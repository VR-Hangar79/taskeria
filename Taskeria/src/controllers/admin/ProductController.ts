// src/controllers/admin/ProductController.ts

import { Request, Response } from 'express';
import { db } from '../../config/database';
import { Product, CreateProductRequest, UpdateProductRequest, ProductIngredient } from '../../types/product';
import { logActivity } from '../../utils/activityLogger';

class ProductController {
    /**
     * Recupera tutti i prodotti con i loro dettagli.
     * Include categoria, ingredienti, allergeni e, se autorizzato, informazioni sui costi.
     */
    async getAll(req: Request, res: Response) {
        try {
            const { category_id, search, is_available, include_costs } = req.query;
            const canViewCosts = req.user.permissions.includes('products.view_costs');

            let query = `
                SELECT 
                    p.*,
                    c.name as category_name,
                    GROUP_CONCAT(DISTINCT i.id) as ingredient_ids,
                    GROUP_CONCAT(DISTINCT i.name) as ingredient_names,
                    GROUP_CONCAT(DISTINCT i.unit) as ingredient_units,
                    GROUP_CONCAT(DISTINCT pi.quantity) as ingredient_quantities
                ${canViewCosts ? ', GROUP_CONCAT(DISTINCT i.cost) as ingredient_costs' : ''}
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                LEFT JOIN product_ingredients pi ON p.id = pi.product_id
                LEFT JOIN ingredients i ON pi.ingredient_id = i.id
                WHERE 1=1
            `;

            const params: any[] = [];

            if (search) {
                query += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
                params.push(`%${search}%`, `%${search}%`);
            }

            if (category_id) {
                query += ` AND p.category_id = ?`;
                params.push(category_id);
            }

            if (is_available !== undefined) {
                query += ` AND p.is_available = ?`;
                params.push(is_available);
            }

            query += ` GROUP BY p.id ORDER BY c.name, p.name`;

            const [rows] = await db.execute(query, params);

            // Formatta i risultati includendo gli ingredienti come array
            const products = rows.map((row: any) => {
                const ingredients = row.ingredient_ids ? row.ingredient_ids.split(',').map((id: string, index: number) => ({
                    id: parseInt(id),
                    name: row.ingredient_names.split(',')[index],
                    unit: row.ingredient_units.split(',')[index],
                    quantity: parseFloat(row.ingredient_quantities.split(',')[index]),
                    cost: canViewCosts ? parseFloat(row.ingredient_costs.split(',')[index]) : undefined
                })) : [];

                // Calcola i costi se l'utente ha i permessi
                let total_cost, margin;
                if (canViewCosts && ingredients.length > 0) {
                    total_cost = ingredients.reduce((sum: number, ing: any) => 
                        sum + (ing.cost * ing.quantity), 0);
                    margin = row.price - total_cost;
                }

                return {
                    ...row,
                    ingredients,
                    ...(canViewCosts && {
                        total_cost,
                        margin,
                        margin_percentage: total_cost ? ((margin / row.price) * 100).toFixed(2) : null
                    })
                };
            });

            return res.json({
                status: 'success',
                data: products
            });

        } catch (error) {
            console.error('Error fetching products:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Errore nel recupero dei prodotti'
            });
        }
    }

    /**
     * Crea un nuovo prodotto con i suoi ingredienti.
     * Verifica la disponibilità degli ingredienti e calcola i costi.
     */
    async create(req: Request, res: Response) {
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            const { ingredients, ...productData }: CreateProductRequest = req.body;

            // Verifica che la categoria esista
            const [categories] = await connection.execute(
                'SELECT id FROM categories WHERE id = ?',
                [productData.category_id]
            );

            if (!categories[0]) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Categoria non valida'
                });
            }

            // Inserisce il prodotto
            const [result] = await connection.execute(
                `INSERT INTO products (name, description, price, category_id, image_url, is_available) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    productData.name,
                    productData.description || '',
                    productData.price,
                    productData.category_id,
                    productData.image_url || null,
                    productData.is_available ?? true
                ]
            );

            const productId = result.insertId;

            // Associa gli ingredienti se presenti
            if (ingredients && ingredients.length > 0) {
                // Verifica che tutti gli ingredienti esistano
                const ingredientIds = ingredients.map(i => i.ingredient_id);
                const [existingIngredients] = await connection.execute(
                    'SELECT id FROM ingredients WHERE id IN (?) AND is_active = TRUE',
                    [ingredientIds]
                );

                if (existingIngredients.length !== ingredientIds.length) {
                    await connection.rollback();
                    return res.status(400).json({
                        status: 'error',
                        message: 'Uno o più ingredienti non sono validi o non sono attivi'
                    });
                }

                // Inserisce le relazioni con gli ingredienti
                const values = ingredients.map(ing => [
                    productId,
                    ing.ingredient_id,
                    ing.quantity,
                    ing.notes || null
                ]);

                await connection.query(
                    'INSERT INTO product_ingredients (product_id, ingredient_id, quantity, notes) VALUES ?',
                    [values]
                );
            }

            await connection.commit();

            // Registra l'attività
            await logActivity({
                userId: req.user.id,
                action: 'CREATE',
                entityType: 'PRODUCT',
                entityId: productId,
                details: { productData, ingredients }
            });

            return res.status(201).json({
                status: 'success',
                data: {
                    id: productId,
                    ...productData,
                    ingredients: ingredients || []
                }
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error creating product:', error);
            
            if ((error as any).code === 'ER_DUP_ENTRY') {
                return res.status(400).json({
                    status: 'error',
                    message: 'Esiste già un prodotto con questo nome'
                });
            }

            return res.status(500).json({
                status: 'error',
                message: 'Errore nella creazione del prodotto'
            });
        } finally {
            connection.release();
        }
    }

    /**
     * Aggiorna un prodotto e le sue relazioni con gli ingredienti.
     * Mantiene la tracciabilità delle modifiche per scopi amministrativi.
     */
    async update(req: Request, res: Response) {
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            const { id } = req.params;
            const { ingredients, ...updateData }: UpdateProductRequest = req.body;

            // Verifica se il prodotto esiste
            const [existing] = await connection.execute(
                'SELECT * FROM products WHERE id = ?',
                [id]
            );

            if (!existing[0]) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Prodotto non trovato'
                });
            }

            // Se viene specificata una categoria, verifica che esista
            if (updateData.category_id) {
                const [categories] = await connection.execute(
                    'SELECT id FROM categories WHERE id = ?',
                    [updateData.category_id]
                );

                if (!categories[0]) {
                    return res.status(400).json({
                        status: 'error',
                        message: 'Categoria non valida'
                    });
                }
            }

            // Aggiorna il prodotto
            const updateFields = Object.entries(updateData)
                .filter(([_, value]) => value !== undefined)
                .map(([key, _]) => `${key} = ?`);

            if (updateFields.length > 0) {
                await connection.execute(
                    `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`,
                    [...Object.values(updateData).filter(v => v !== undefined), id]
                );
            }

            // Aggiorna gli ingredienti se specificati
            if (ingredients !== undefined) {
                // Rimuove le associazioni esistenti
                await connection.execute(
                    'DELETE FROM product_ingredients WHERE product_id = ?',
                    [id]
                );

                if (ingredients.length > 0) {
                    // Verifica che tutti gli ingredienti esistano
                    const ingredientIds = ingredients.map(i => i.ingredient_id);
                    const [existingIngredients] = await connection.execute(
                        'SELECT id FROM ingredients WHERE id IN (?) AND is_active = TRUE',
                        [ingredientIds]
                    );

                    if (existingIngredients.length !== ingredientIds.length) {
                        await connection.rollback();
                        return res.status(400).json({
                            status: 'error',
                            message: 'Uno o più ingredienti non sono validi o non sono attivi'
                        });
                    }

                    // Inserisce le nuove associazioni
                    const values = ingredients.map(ing => [
                        id,
                        ing.ingredient_id,
                        ing.quantity,
                        ing.notes || null
                    ]);

                    await connection.query(
                        'INSERT INTO product_ingredients (product_id, ingredient_id, quantity, notes) VALUES ?',
                        [values]
                    );
                }
            }

            await connection.commit();

            // Registra l'attività
            await logActivity({
                userId: req.user.id,
                action: 'UPDATE',
                entityType: 'PRODUCT',
                entityId: parseInt(id),
                details: { updateData, ingredients }
            });

            // Recupera il prodotto aggiornato con tutti i dettagli
            const [updated] = await this.getProductWithDetails(parseInt(id), req.user.permissions);

            return res.json({
                status: 'success',
                data: updated
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error updating product:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Errore nell\'aggiornamento del prodotto'
            });
        } finally {
            connection.release();
        }
    }

    /**
     * Disattiva un prodotto invece di eliminarlo fisicamente.
     * Controlla anche eventuali dipendenze da menu o ordini attivi.
     */
    async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // Verifica se il prodotto è utilizzato in menu attivi
            const [menuUsage] = await db.execute(
                `SELECT COUNT(*) as count 
                 FROM menu_products mp
                 JOIN menus m ON mp.menu_id = m.id
                 WHERE mp.product_id = ? AND m.is_active = TRUE`,
                [id]
            );

            if (menuUsage[0].count > 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Non è possibile eliminare questo prodotto perché è utilizzato in uno o più menu attivi'
                });
            }

            // Disattiva il prodotto invece di eliminarlo
            await db.execute(
                'UPDATE products SET is_active = FALSE WHERE id = ?',
                [id]
            );

            // Registra l'attività
            await logActivity({
                userId: req.user.id,
                action: 'DELETE',
                entityType: 'PRODUCT',
                entityId: parseInt(id)
            });

            return res.json({
                status: 'success',
                message: 'Prodotto disattivato con successo'
            });

        } catch (error) {
            console.error('Error deleting product:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Errore nella disattivazione del prodotto'
            });
        }
    }

/**
     * Metodo privato per recuperare un prodotto con tutti i suoi dettagli.
     * Include ingredienti, allergeni e, se autorizzato, informazioni sui costi.
     */
private async getProductWithDetails(productId: number, userPermissions: string[]) {
    const canViewCosts = userPermissions.includes('products.view_costs');

    const query = `
        SELECT 
            p.*,
            c.name as category_name,
            i.id as ingredient_id,
            i.name as ingredient_name,
            i.unit as ingredient_unit,
            pi.quantity as ingredient_quantity,
            ${canViewCosts ? 'i.cost as ingredient_cost,' : ''}
            GROUP_CONCAT(DISTINCT a.eu_code) as allergen_codes,
            GROUP_CONCAT(DISTINCT at.name) as allergen_names
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN product_ingredients pi ON p.id = pi.product_id
        LEFT JOIN ingredients i ON pi.ingredient_id = i.id
        LEFT JOIN ingredient_allergens ia ON i.id = ia.ingredient_id
        LEFT JOIN allergens a ON ia.allergen_id = a.id
        LEFT JOIN allergen_translations at ON a.id = at.allergen_id 
        WHERE p.id = ? AND at.language_code = ?
        GROUP BY p.id, i.id
    `;

    const [rows] = await db.execute(query, [productId, 'it']); // 'it' è la lingua predefinita

    if (!rows[0]) return null;

    // Raggruppa gli ingredienti e i loro allergeni
    const ingredients = rows.reduce((acc: any[], row: any) => {
        if (row.ingredient_id) {
            const allergens = row.allergen_codes ? row.allergen_codes.split(',').map((code: string, index: number) => ({
                eu_code: code,
                name: row.allergen_names.split(',')[index]
            })) : [];

            acc.push({
                id: row.ingredient_id,
                name: row.ingredient_name,
                unit: row.ingredient_unit,
                quantity: row.ingredient_quantity,
                ...(canViewCosts && { cost: row.ingredient_cost }),
                allergens
            });
        }
        return acc;
    }, []);

    // Calcola i costi se l'utente ha i permessi
    let costInfo = {};
    if (canViewCosts) {
        const totalCost = ingredients.reduce((sum, ing) => 
            sum + (ing.cost * ing.quantity), 0);
        const margin = rows[0].price - totalCost;
        
        costInfo = {
            total_cost: totalCost,
            margin,
            margin_percentage: ((margin / rows[0].price) * 100).toFixed(2)
        };
    }

    return {
        ...rows[0],
        ingredients,
        ...costInfo
    };
}

/**
 * Calcola e aggiorna i costi di un prodotto.
 * Richiede permessi speciali per la visualizzazione dei costi.
 */
async calculateCosts(req: Request, res: Response) {
    try {
        const { id } = req.params;

        if (!req.user.permissions.includes('products.view_costs')) {
            return res.status(403).json({
                status: 'error',
                message: 'Non hai i permessi per visualizzare le informazioni sui costi'
            });
        }

        const [rows] = await db.execute(`
            SELECT 
                p.id,
                p.name,
                p.price,
                i.cost as ingredient_cost,
                pi.quantity as ingredient_quantity
            FROM products p
            JOIN product_ingredients pi ON p.id = pi.product_id
            JOIN ingredients i ON pi.ingredient_id = i.id
            WHERE p.id = ?
        `, [id]);

        if (!rows[0]) {
            return res.status(404).json({
                status: 'error',
                message: 'Prodotto non trovato'
            });
        }

        // Calcola il costo totale e il margine
        const totalCost = rows.reduce((sum: number, row: any) => 
            sum + (row.ingredient_cost * row.ingredient_quantity), 0);
        const price = rows[0].price;
        const margin = price - totalCost;
        const marginPercentage = ((margin / price) * 100).toFixed(2);

        return res.json({
            status: 'success',
            data: {
                product_name: rows[0].name,
                price,
                total_cost: totalCost,
                margin,
                margin_percentage: marginPercentage,
                ingredients: rows.map((row: any) => ({
                    cost: row.ingredient_cost,
                    quantity: row.ingredient_quantity,
                    total: row.ingredient_cost * row.ingredient_quantity
                }))
            }
        });

    } catch (error) {
        console.error('Error calculating costs:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Errore nel calcolo dei costi'
        });
    }
}
}

export default new ProductController();    