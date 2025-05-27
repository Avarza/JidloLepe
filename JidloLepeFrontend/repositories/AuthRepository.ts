// src/repositories/AuthRepository.ts
import { LoginRequestDTO } from '@/DTO/LoginDTO';
import { API_BASE_URL } from '@/config/api';

export async function loginRequest(dto: LoginRequestDTO): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(dto),
    });

    if (!response.ok) {
        throw new Error('Neplatné přihlašovací údaje');
    }

    const data = await response.json();
    return data.token;
}
