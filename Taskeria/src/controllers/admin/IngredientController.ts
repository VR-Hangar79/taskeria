// src/controllers/admin/IngredientController.ts

import { Request, Response } from 'express';
import { db } from '../../config/database';
import { Ingredient, CreateIngredientRequest, UpdateIngredientRequest } from '../../types/ingredient';
import { logActivity } from '../../utils/activityLogger';

class IngredientController {
    /**
     * Recupera tutti gli ingredienti con i loro allergeni associati.
     * Gli ingredienti possono essere filtrati per nome, categoria e stato di attività.
     */
    async getAll(req: Request, res: Response) {
        try {
            const { search, is_active, with_allergens } = req.query;
            
            let query = `
                SELECT 
                    i.*,
                    GROUP_CONCAT(DISTINCT a.id) as allergen_ids,
                    GROUP_CONCAT(DISTINCT a.eu_code) as allergen_codes,
                    GROUP_CONCAT(DISTINCT at.name) as allergen_names
                FROM ingredients i
                LEFT JOIN ingredient_allergens ia ON i.id = ia.ingredient_id
                LEFT JOIN allergens a ON ia.allergen_id = a.id
                LEFT JOIN allergen_translations at ON a.id = at.allergen_id AND at.language_code = ?
                WHERE 1=1
            `;
            
            const params: any[] = [req.query.lang || 'it'];

            if (search) {
                query += ` AND i.name LIKE ?`;
                params.push(`%${search}%`);
            }

            if (is_active !== undefined) {
                query += ` AND i.is_active = ?`;
                params.push(is_active);
            }

            query += ` GROUP BY i.id ORDER BY i.name`;

            const [rows] = await db.execute(query, params);

            // Formatta i risultati per includere gli allergeni come array
            const ingredients = rows.map((row: any) => ({
                ...row,
                allergens: row.allergen_ids ? row.allergen_ids.split(',').map((id: string, index: number) => ({
                    id: parseInt(id),
                    eu_code: row.allergen_codes.split(',')[index],
                    name: row.allergen_names.split(',')[index]
                })) : []
            }));

            return res.json({
                status: 'success',
                data: ingredients
            });
        } catch (error) {
            console.error('Error fetching ingredients:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Errore nel recupero degli ingredienti'
            });
        }
    }

    /**
     * Crea un nuovo ingrediente con i suoi allergeni associati.
     * Questa operazione è transazionale per garantire l'integrità dei dati.
     */
    async create(req: Request, res: Response) {
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            const { allergens, ...ingredientData }: CreateIngredientRequest & { allergens?: number[] } = req.body;

            // Inserisce l'ingrediente
            const [result] = await connection.execute(
                `INSERT INTO ingredients (name, description, unit, cost, stock, min_stock) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    ingredientData.name,
                    ingredientData.description || '',
                    ingredientData.unit,
                    ingredientData.cost,
                    ingredientData.stock,
                    ingredientData.min_stock
                ]
            );

            const ingredientId = result.insertId;

            // Associa gli allergeni se presenti
            if (allergens && allergens.length > 0) {
                const values = allergens.map(allergenId => [ingredientId, allergenId]);
                await connection.query(
                    'INSERT INTO ingredient_allergens (ingredient_id, allergen_id) VALUES ?',
                    [values]
                );
            }

            await connection.commit();

            // Registra l'attività
            await logActivity({
                userId: req.user.id,
                action: 'CREATE',
                entityType: 'INGREDIENT',
                entityId: ingredientId,
                details: { ingredientData, allergens }
            });

            return res.status(201).json({
                status: 'success',
                data: {
                    id: ingredientId,
                    ...ingredientData,
                    allergens: allergens || []
                }
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error creating ingredient:', error);
            
            if ((error as any).code === 'ER_DUP_ENTRY') {
                return res.status(400).json({
                    status: 'error',
                    message: 'Esiste già un ingrediente con questo nome'
                });
            }

            return res.status(500).json({
                status: 'error',
                message: 'Errore nella creazione dell\'ingrediente'
            });
        } finally {
            connection.release();
        }
    }

    /**
     * Aggiorna un ingrediente esistente e le sue associazioni con gli allergeni.
     * L'aggiornamento è transazionale e mantiene uno storico delle modifiche.
     */
    async update(req: Request, res: Response) {
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            const { id } = req.params;
            const { allergens, ...updateData }: UpdateIngredientRequest & { allergens?: number[] } = req.body;

            // Verifica se l'ingrediente esiste
            const [existing] = await connection.execute(
                'SELECT * FROM ingredients WHERE id = ?',
                [id]
            );

            if (!existing[0]) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Ingrediente non trovato'
                });
            }

            // Prepara la query di aggiornamento
            const updateFields = Object.entries(updateData)
                .filter(([_, value]) => value !== undefined)
                .map(([key, _]) => `${key} = ?`);

            if (updateFields.length > 0) {
                await connection.execute(
                    `UPDATE ingredients SET ${updateFields.join(', ')} WHERE id = ?`,
                    [...Object.values(updateData).filter(v => v !== undefined), id]
                );
            }

            // Aggiorna le associazioni con gli allergeni se specificato
            if (allergens !== undefined) {
                // Rimuove le associazioni esistenti
                await connection.execute(
                    'DELETE FROM ingredient_allergens WHERE ingredient_id = ?',
                    [id]
                );

                // Aggiunge le nuove associazioni
                if (allergens.length > 0) {
                    const values = allergens.map(allergenId => [id, allergenId]);
                    await connection.query(
                        'INSERT INTO ingredient_allergens (ingredient_id, allergen_id) VALUES ?',
                        [values]
                    );
                }
            }

            await connection.commit();

            // Registra l'attività
            await logActivity({
                userId: req.user.id,
                action: 'UPDATE',
                entityType: 'INGREDIENT',
                entityId: parseInt(id),
                details: { updateData, allergens }
            });

            // Recupera l'ingrediente aggiornato
            const [updated] = await connection.execute(
                `SELECT i.*, GROUP_CONCAT(a.id) as allergen_ids
                 FROM ingredients i
                 LEFT JOIN ingredient_allergens ia ON i.id = ia.ingredient_id
                 LEFT JOIN allergens a ON ia.allergen_id = a.id
                 WHERE i.id = ?
                 GROUP BY i.id`,
                [id]
            );

            return res.json({
                status: 'success',
                data: updated[0]
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error updating ingredient:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Errore nell\'aggiornamento dell\'ingrediente'
            });
        } finally {
            connection.release();
        }
    }

    /**
     * Disattiva un ingrediente invece di eliminarlo fisicamente.
     * Questo mantiene l'integrità referenziale e lo storico.
     */
    async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // Verifica se l'ingrediente è utilizzato in qualche prodotto
            const [usages] = await db.execute(
                'SELECT COUNT(*) as count FROM product_ingredients WHERE ingredient_id = ?',
                [id]
            );

            if (usages[0].count > 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Non è possibile eliminare questo ingrediente perché è utilizzato in uno o più prodotti'
                });
            }

            // Disattiva l'ingrediente invece di eliminarlo
            await db.execute(
                'UPDATE ingredients SET is_active = FALSE WHERE id = ?',
                [id]
            );

            // Registra l'attività
            await logActivity({
                userId: req.user.id,
                action: 'DELETE',
                entityType: 'INGREDIENT',
                entityId: parseInt(id)
            });

            return res.json({
                status: 'success',
                message: 'Ingrediente disattivato con successo'
            });

        } catch (error) {
            console.error('Error deleting ingredient:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Errore nella disattivazione dell\'ingrediente'
            });
        }
    }
}

export default new IngredientController();