export async function login(credentials: LoginRequestDTO): Promise<boolean> {
    try {
        console.log("📤 Posílám login na:", `${API_BASE_URL}/api/auth/login`);
        console.log("📤 Payload:", credentials);

        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });

        console.log("📥 Status odpovědi:", response.status);

        if (!response.ok) {
            const err = await response.text();
            console.log("📥 Chyba:", err);
            throw new Error('Login selhal');
        }

        const data = await response.json();
        console.log("✅ Přijatý token:", data.token);
        return true;
    } catch (error) {
        console.error("❌ Chyba při loginu:", error);
        return false;
    }
}
