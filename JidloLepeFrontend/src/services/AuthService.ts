import { LoginRequestDTO } from '@/src/DTO/LoginDTO';
import { loginWithCredentials } from '@/repositories/AuthRepository';

export async function login(credentials: LoginRequestDTO): Promise<boolean> {
    if (!credentials.email || !credentials.password) {
        return false;
    }

    const result = await loginWithCredentials(credentials);
    return result.success;
}
