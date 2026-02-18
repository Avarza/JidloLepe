import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, Image, StyleSheet,
    ScrollView, TouchableOpacity, Alert, Button
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/authContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { API_BASE_URL } from "@/config/api";

export default function ProfileTabScreen() {
    const router = useRouter();
    const { isLoggedIn, login, logout } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [userAllergens, setUserAllergens] = useState<string[]>([]);

    const [mockProducts, setMockProducts] = useState<{ code: string; name: string; image: string }[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    const handleLogin = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'Neplatné přihlašovací údaje');
            }

            const data = await response.json();
            await AsyncStorage.setItem('token', data.token);
            login();
        } catch (error: any) {
            Alert.alert('Chyba přihlášení', error.message || 'Neznámá chyba');
        }
    };

    const handleLogout = async () => {
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("user_allergens");
        logout();
        setEmail('');
        setPassword('');
        setUserAllergens([]);
    };

    const handlePasswordChange = () => {
        Alert.alert('Změna hesla', 'Zde může být funkce pro změnu hesla.');
    };

    const handleChangeAvatar = () => {
        Alert.alert('Změna avatara', 'Zde může být výběr nebo upload fotky.');
    };

    useFocusEffect(
        React.useCallback(() => {
            const fetchAllergensFromBackend = async () => {
                try {
                    const token = await AsyncStorage.getItem('token');
                    if (!token) return;

                    const response = await fetch(`${API_BASE_URL}/api/users/allergens`, {
                        method: 'GET',
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    if (!response.ok) throw new Error('Chyba při načítání alergenů');
                    const data: string[] = await response.json();
                    setUserAllergens(data);
                } catch (e) {
                    console.error('❌ Chyba při načítání alergenů:', e);
                }
            };

            if (isLoggedIn) fetchAllergensFromBackend();
        }, [isLoggedIn])
    );

    useEffect(() => {
        const fetchHistoryProducts = async () => {
            try {
                const res = await fetch(
                    'https://world.openfoodfacts.org/cgi/search.pl?action=process&tagtype_0=categories&tag_contains_0=contains&tag_0=snacks&page_size=20&json=true'
                );
                const json = await res.json();

                const valid = json.products
                    .filter((p: any) => p.code && p.product_name && p.image_front_url)
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 4)
                    .map((p: any) => ({
                        code: p.code,
                        name: p.product_name,
                        image: p.image_front_url,
                    }));

                setMockProducts(valid);
            } catch (err) {
                console.error('Chyba při načítání historie produktů:', err);
            } finally {
                setLoadingHistory(false);
            }
        };

        if (isLoggedIn) fetchHistoryProducts();
    }, [isLoggedIn]);

    if (!isLoggedIn) {
        return (
            <View style={styles.loginContainer}>
                <Text style={styles.title}>Přihlášení</Text>
                <TextInput
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    style={styles.input}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <TextInput
                    placeholder="Heslo"
                    value={password}
                    onChangeText={setPassword}
                    style={styles.input}
                    secureTextEntry
                />
                <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                    <Text style={styles.loginButtonText}>Přihlásit se</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
            <View style={styles.header}>
                <Image
                    source={require('@/assets/images/avatar-placeholder.png')}
                    style={styles.avatar}
                />
            </View>

            <View style={styles.content}>
                <Text style={styles.name}>Jitka Kroupová</Text>
                <Text style={styles.email}>{email}</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Moje alergeny</Text>
                    {userAllergens.length > 0 ? (
                        userAllergens.map((a) => <Text key={a}>• {a}</Text>)
                    ) : (
                        <Text style={{ color: '#777' }}>Žádné alergeny uložené</Text>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Historie prohlížených produktů</Text>
                    {loadingHistory ? (
                        <Text>Načítání historie…</Text>
                    ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {mockProducts.map((product) => (
                                <TouchableOpacity
                                    key={product.code}
                                    onPress={() =>
                                        router.push({
                                            pathname: '/Product/[id]',
                                            params: { id: product.code },
                                        })
                                    }
                                    style={styles.productCard}
                                >
                                    <Image
                                        source={{ uri: product.image }}
                                        style={styles.productImage}
                                    />
                                    <Text numberOfLines={1} style={styles.productName}>
                                        {product.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                </View>

                <View style={styles.buttonGroup}>
                    <TouchableOpacity style={styles.actionButton} onPress={handlePasswordChange}>
                        <Text style={styles.buttonText}>🔐 Změnit heslo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => router.push('/(tabs)/fav')}
                    >
                        <Text style={styles.buttonText}>🌾 Upravit alergeny</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={handleChangeAvatar}>
                        <Text style={styles.buttonText}>🖼️ Změnit avatar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#c53030' }]}
                        onPress={handleLogout}
                    >
                        <Text style={[styles.buttonText, { color: 'white' }]}>
                            🚪 Odhlásit se
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    loginContainer: { flex: 1, justifyContent: 'center', padding: 20 },

    container: { flex: 1, backgroundColor: '#E8DFD0' },

    header: {
        backgroundColor: '#764534',
        height: 120,
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 40,
    },

    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: '#fff',
        backgroundColor: '#eee',
        position: 'absolute',
        bottom: -40,
    },

    content: { marginTop: 60, alignItems: 'center', padding: 20 },

    name: { fontSize: 24, fontWeight: 'bold', marginTop: 10 },

    email: { fontSize: 14, color: '#888' },

    section: { width: '100%', marginTop: 30 },

    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },

    productCard: { width: 120, marginRight: 15, alignItems: 'center' },

    productImage: { width: 100, height: 100, borderRadius: 12, marginBottom: 5 },

    productName: { textAlign: 'center', fontSize: 12 },

    buttonGroup: { width: '100%', marginTop: 30 },

    actionButton: {
        backgroundColor: '#764534',
        padding: 12,
        marginBottom: 10,
        borderRadius: 8,
        alignItems: 'center',
    },

    buttonText: { fontWeight: 'bold', color: '#E8DFD0' },

    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#764534',
        padding: 10,
        borderRadius: 5,
        marginBottom: 15,
        color: '#333',
    },

    inputActive: {
        backgroundColor: '#E8DFD0',
        borderColor: '#764534',
    },

    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    loginButton: {
        backgroundColor: '#764534',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },

    loginButtonText: {
        color: '#E8DFD0',
        fontSize: 16,
        fontWeight: 'bold',
    },

});
