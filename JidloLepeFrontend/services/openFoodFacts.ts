import axios from 'axios';

const API_URL = 'https://world.openfoodfacts.org/api/v2';

export const searchProducts = async (query: string) => {
    try {
        const response = await axios.get(`${API_URL}/search?search_terms=${query}`);
        return response.data;
    } catch (error) {
        console.error('Error searching products:', error);
        throw error;
    }
};

export const getProductByBarcode = async (barcode: string) => {
    try {
        const response = await axios.get(`${API_URL}/product/${barcode}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching product:', error);
        throw error;
    }
};