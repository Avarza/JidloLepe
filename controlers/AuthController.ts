import { login } from '@/services/AuthService';
import { LoginRequestDTO } from '@/DTO/LoginDTO';

export async function loginUser(credentials: LoginRequestDTO): Promise<boolean> {
    try {
        return await login(credentials);
    } catch (error) {
        console.error("Chyba v AuthController:", error);
        return false;
    }
}
