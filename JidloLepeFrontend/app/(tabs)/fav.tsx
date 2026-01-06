import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, Alert,
    StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Button
} from 'react-native';
import { useAuth } from '@/context/authContext';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from "@/config/api";

const allAllergens = [
    'Lepek', 'Mléko', 'Ořechy', 'Sója', 'Vejce', 'Ryby',
    'Celer', 'Hořčice', 'Sezam', 'Skořápky'
];

const allergenIdMap: { [key: string]: number } = {
    Lepek: 1,
    Mléko: 2,
    Ořechy: 3,
    Sója: 4,
    Vejce: 5,
    Ryby: 6,
    Celer: 7,
    Hořčice: 8,
    Sezam: 9,
    Skořápky: 10,
};

export default function FavScreen() {
    const { isLoggedIn } = useAuth();
    const router = useRouter();
    const [selected, setSelected] = useState<string[]>([]);
    const [search, setSearch] = useState('');

    // 🔄 Načti alergeny z backendu
    useEffect(() => {
        const fetchAllergens = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (!token) return;

                const response = await fetch(`${API_BASE_URL}/api/users/allergens`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) throw new Error('Nepodařilo se načíst alergeny');

                const data: string[] = await response.json();
                setSelected(data); // backend vrací názvy → super
            } catch (e) {
                console.error('Chyba při načítání alergenů:', e);
            }
        };

        if (isLoggedIn) fetchAllergens();
    }, [isLoggedIn]);

    // 💾 Ulož alergeny na backend
    const saveAllergens = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) throw new Error('Uživatel není přihlášen');

            const email = getEmailFromToken(token);
            const allergenIds = selected.map(name => allergenIdMap[name]).filter(Boolean);

            const response = await fetch(`${API_BASE_URL}/api/users/allergens`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    email,
                    allergenIds,
                }),
            });

            if (!response.ok) throw new Error('Chyba při ukládání na server');

            Alert.alert('Hotovo', 'Alergeny byly uloženy na server');
        } catch (e: any) {
            console.error('Chyba při ukládání alergenů:', e);
            Alert.alert('Chyba', e.message || 'Nepodařilo se uložit alergeny');
        }
    };

    // 📧 Získání emailu z JWT tokenu
    const getEmailFromToken = (token: string): string => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
                    .join('')
            );
            return JSON.parse(jsonPayload).sub;
        } catch {
            return '';
        }
    };

    // ✔️ Přepínání alergenů
    const toggleAllergen = (item: string) => {
        setSelected(prev =>
            prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
        );
    };

    const filtered = allAllergens.filter(a =>
        a.toLowerCase().includes(search.toLowerCase())
    );

    // ❗ Pokud není přihlášen → nabídni přihlášení
    if (!isLoggedIn) {
        return (
            <View style={styles.centered}>
                <Text style={styles.info}>Musíte být přihlášeni pro úpravu alergenů.</Text>
                <Button title="Přejít na přihlášení" onPress={() => router.replace('/(tabs)/profile')} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Vyber si své alergeny</Text>
                <TextInput
                    placeholder="Hledej..."
                    value={search}
                    onChangeText={setSearch}
                    style={styles.input}
                />

                {filtered.map((item) => (
                    <TouchableOpacity
                        key={item}
                        onPress={() => toggleAllergen(item)}
                        style={[
                            styles.allergenItem,
                            selected.includes(item) && styles.selectedItem
                        ]}
                    >
                        <Text>{selected.includes(item) ? '☑' : '☐'} {item}</Text>
                    </TouchableOpacity>
                ))}

                <View style={styles.selectedList}>
                    <Text style={{ fontWeight: 'bold' }}>Vybrané alergeny:</Text>
                    {selected.length > 0 ? (
                        <Text>{selected.join(', ')}</Text>
                    ) : (
                        <Text style={{ color: '#777' }}>Žádný alergen není vybrán</Text>
                    )}
                </View>

                <View style={{ marginTop: 30, paddingBottom: 100 }}>
                    <Button title="Uložit výběr" onPress={saveAllergens} />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    info: {
        fontSize: 18,
        marginBottom: 20,
        textAlign: 'center',
    },
    container: {
        padding: 20,
        backgroundColor: '#E8DFD0',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        marginBottom: 15,
    },
    allergenItem: {
        padding: 12,
        backgroundColor: '#EEE8DA',
        borderRadius: 8,
        marginBottom: 8,
    },
    selectedItem: {
        backgroundColor: '#d1fae5',
    },
    selectedList: {
        marginTop: 20,
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 8,
    },
});
