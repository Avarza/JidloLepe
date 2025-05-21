export interface ProductApiResponse {
    status: number;
    code: string;
    product: Product;
}

export interface Product {
    product_name: string;
    brands: string;
    ingredients_text?: string;
    allergens_tags?: string[];
    nutriments?: Nutriments;
    image_url?: string;
    categories?: string;
    quantity?: string;
    packaging?: string;
}

export interface Nutriments {
    energy_100g?: number;
    fat_100g?: number;
    saturated_fat_100g?: number;
    carbohydrates_100g?: number;
    sugars_100g?: number;
    fiber_100g?: number;
    proteins_100g?: number;
    salt_100g?: number;
    sodium_100g?: number;
}

export interface SearchApiResponse {
    count: number;
    page: number;
    page_count: number;
    page_size: number;
    products: Product[];
    skip: number;
}
