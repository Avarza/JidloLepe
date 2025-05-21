// services/userService.ts
import { getJwtToken } from '@/src/utills/tokenUtils';

export const fetchUserProfile = async () => {
    const token = await getJwtToken();

    const response = await fetch('http://10.0.2.2:8081/api/user/profile', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Nepodařilo se načíst profil');
    }

    return await response.json(); // očekáváme např. { email: ..., allergens: [...] }
};
