import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, Image, StyleSheet,
    ScrollView, TouchableOpacity, Alert, Button, FlatList
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/authContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function ProfileTabScreen() {
    const router = useRouter();
    const { isLoggedIn, login, logout } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [userAllergens, setUserAllergens] = useState<string[]>([]);

    // nový stav pro produkty historie
    const [mockProducts, setMockProducts] = useState<
        { code: string; name: string; image: string }[]
    >([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    const handleLogin = () => {
        if (username === 'admin' && password === 'admin') {
            login();
        } else {
            Alert.alert('Chyba', 'Neplatné přihlašovací údaje');
        }
    };

    const handleLogout = () => {
        logout();
        setUsername('');
        setPassword('');
    };

    const handlePasswordChange = () => {
        Alert.alert('Změna hesla', 'Zde může být funkce pro změnu hesla.');
    };

    const handleChangeAvatar = () => {
        Alert.alert('Změna avatara', 'Zde může být výběr nebo upload fotky.');
    };

    // Načtení alergenů ze storage
    useFocusEffect(
        React.useCallback(() => {
            const loadAllergens = async () => {
                try {
                    const json = await AsyncStorage.getItem('user_allergens');
                    if (json) setUserAllergens(JSON.parse(json));
                    else setUserAllergens([]);
                } catch (e) {
                    console.error('Chyba při načítání alergenů:', e);
                }
            };
            if (isLoggedIn) loadAllergens();
        }, [isLoggedIn])
    );

    // Načtení 4 náhodných snack produktů
    useEffect(() => {
        const fetchHistoryProducts = async () => {
            try {
                const res = await fetch(
                    'https://world.openfoodfacts.org/cgi/search.pl?action=process&tagtype_0=categories&tag_contains_0=contains&tag_0=snacks&page_size=20&json=true'
                );
                const json = await res.json();

                // Filtrování platných produktů se jménem a obrázkem
                const valid = json.products
                    .filter(
                        (p: any) =>
                            p.code && p.product_name && p.image_front_url
                    )
                    // promíchej a vezmi první 4
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
            <View  className= "bg-accent" style={styles.loginContainer}>
                <Text style={styles.title}>Přihlášení</Text>
                <TextInput
                    placeholder="Uživatelské jméno"
                    value={username}
                    onChangeText={setUsername}
                    style={styles.input}
                    autoCapitalize="none"
                />
                <TextInput
                    placeholder="Heslo"
                    value={password}
                    onChangeText={setPassword}
                    style={styles.input}
                    secureTextEntry
                />
                <Button title="Přihlásit se" onPress={handleLogin} />
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
                <Text style={styles.email}>jitka@example.com</Text>

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
    container: { flex: 1, backgroundColor: '#EEE8DA' },
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
        backgroundColor: '#E8DFD0',
        padding: 12,
        marginBottom: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: { fontWeight: 'bold', color: '#333' },
    input: {
        borderWidth: 1, borderColor: '#ccc',
        padding: 10, borderRadius: 5, marginBottom: 15,
    },
    title: {
        fontSize: 24, fontWeight: 'bold',
        textAlign: 'center', marginBottom: 20,
    },
});
