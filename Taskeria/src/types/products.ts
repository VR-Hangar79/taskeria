// src/types/product.ts

// Definiamo prima l'interfaccia per gli ingredienti del prodotto
export interface ProductIngredient {
    ingredient_id: number;
    quantity: number;
    notes?: string;
}

// Interfaccia principale del prodotto
export interface Product {
    id?: number;
    name: string;
    description?: string;
    price: number;
    category_id: number;
    image_url?: string;
    is_available: boolean;
    is_active: boolean;
    ingredients?: ProductIngredient[];
}

// Versione estesa del prodotto con tutte le relazioni
export interface ProductWithDetails extends Product {
    category_name: string;
    ingredients: Array<{
        id: number;
        name: string;
        quantity: number;
        unit: string;
        cost: number;
        allergens: Array<{
            id: number;
            eu_code: string;
            name: string;
        }>;
    }>;
    total_cost: number;  // Costo totale calcolato dagli ingredienti
    margin: number;      // Margine di guadagno (prezzo - costo totale)
}

// Tipi per le richieste di creazione e aggiornamento
export type CreateProductRequest = Omit<Product, 'id' | 'is_active'>;
export type UpdateProductRequest = Partial<CreateProductRequest>;

// Enumerazione dei permessi per i prodotti
export enum ProductPermissions {
    VIEW = 'products.view',
    CREATE = 'products.create',
    UPDATE = 'products.update',
    DELETE = 'products.delete',
    MANAGE_INGREDIENTS = 'products.manage_ingredients',
    VIEW_COSTS = 'products.view_costs'  // Permesso speciale per vedere i costi e i margini
}