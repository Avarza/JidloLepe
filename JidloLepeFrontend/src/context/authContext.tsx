// /context/authContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";

type AuthContextType = {
    token: string | null;
    userEmail: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [token, setToken] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadToken = async () => {
            try {
                const savedToken = await SecureStore.getItemAsync("token");
                const savedEmail = await SecureStore.getItemAsync("userEmail");
                if (savedToken) {
                    setToken(savedToken);
                    setUserEmail(savedEmail);
                }
            } catch (e) {
                console.error("Chyba při načítání tokenu:", e);
            } finally {
                setLoading(false);
            }
        };
        loadToken();
    }, []);

    const login = async (email: string, password: string) => {
        const response = await fetch("http://192.168.1.10:8081/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            throw new Error("Neplatné přihlašovací údaje");
        }

        const data = await response.json();
        const jwtToken = data.token;

        setToken(jwtToken);
        setUserEmail(email);

        await SecureStore.setItemAsync("token", jwtToken);
        await SecureStore.setItemAsync("userEmail", email);
    };

    const logout = async () => {
        setToken(null);
        setUserEmail(null);
        await SecureStore.deleteItemAsync("token");
        await SecureStore.deleteItemAsync("userEmail");
    };

    return (
        <AuthContext.Provider value={{ token, userEmail, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth musí být používán v AuthProvideru");
    return context;
};
