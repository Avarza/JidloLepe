import { LoginRequestDTO } from '@/src/DTO/LoginDTO';

export async function loginWithCredentials(credentials: LoginRequestDTO): Promise<{ success: boolean }> {
    try {
        const response = await fetch('http://10.0.2.2:8081/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });

        if (response.ok) {
            const data = await response.json();
            // můžeš zde uložit token do SecureStore nebo AsyncStorage
            return { success: true };
        }

        return { success: false };
    } catch (error) {
        console.error('Chyba při přihlášení:', error);
        return { success: false };
    }
}
