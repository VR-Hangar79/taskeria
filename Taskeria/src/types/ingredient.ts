// src/types/ingredient.ts

export interface Ingredient {
    id?: number;
    name: string;
    description?: string;
    unit: string;
    cost: number;
    stock: number;
    min_stock: number;
    is_active: boolean;
    allergens?: number[];  // Array di ID degli allergeni associati
}

export interface IngredientWithAllergens extends Ingredient {
    allergens: {
        id: number;
        eu_code: string;
        name: string;
        presence_note?: string;
    }[];
}

// Definiamo i tipi per le richieste di creazione e aggiornamento
export type CreateIngredientRequest = Omit<Ingredient, 'id' | 'is_active'>;
export type UpdateIngredientRequest = Partial<CreateIngredientRequest>;

// Definiamo i permessi necessari per le operazioni sugli ingredienti
export enum IngredientPermissions {
    VIEW = 'ingredients.view',
    CREATE = 'ingredients.create',
    UPDATE = 'ingredients.update',
    DELETE = 'ingredients.delete',
    MANAGE_ALLERGENS = 'ingredients.manage_allergens'
}