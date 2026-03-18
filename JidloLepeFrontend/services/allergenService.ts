// services/allergenService.ts
import { API_BASE_URL } from '@/config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getAuthHeader = async () => {
    const token = await AsyncStorage.getItem('authToken');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
};

// Načte číselník všech alergenů z PostgreSQL (GET /api/allergens)
export const fetchAllergens = async () => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/api/allergens`, { headers });
    if (!response.ok) throw new Error('Nelze načíst alergeny.');
    return response.json();
};

// Načte alergeny přihlášeného uživatele — email bere backend z JWT tokenu
// GET /api/users/allergens
export const fetchUserAllergens = async () => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/api/users/allergens`, { headers });
    if (!response.ok) throw new Error('Nelze načíst alergeny uživatele.');
    return response.json();
};

// Uloží vybrané alergeny uživatele do PostgreSQL (tabulka user_allergens)
// PUT /api/users/allergens — body: { email, allergenIds }
export const saveUserAllergens = async (email: string, allergenIds: number[]) => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/api/users/allergens`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ email, allergenIds }),
    });
    if (!response.ok) throw new Error('Nepodařilo se uložit alergeny.');
};