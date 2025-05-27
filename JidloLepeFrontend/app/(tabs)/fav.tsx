import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, Alert,
    StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Button
} from 'react-native';
import { useAuth } from '@/context/authContext';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const allAllergens = [
    'Lepek', 'Mléko', 'Ořechy', 'Sója', 'Vejce', 'Ryby',
    'Celer', 'Hořčice', 'Sezam', 'Skořápky'
];

export default function FavScreen() {
    const { isLoggedIn } = useAuth();
    const router = useRouter();
    const [selected, setSelected] = useState<string[]>([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const loadAllergens = async () => {
            const json = await AsyncStorage.getItem('user_allergens');
            if (json) setSelected(JSON.parse(json));
        };
        loadAllergens();
    }, []);

    const saveAllergens = async () => {
        try {
            await AsyncStorage.setItem('user_allergens', JSON.stringify(selected));
            Alert.alert('Hotovo', 'Alergeny byly uloženy');
        } catch (e) {
            Alert.alert('Chyba', 'Nepodařilo se uložit alergeny');
        }
    };

    const toggleAllergen = (item: string) => {
        setSelected(prev =>
            prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
        );
    };

    const filtered = allAllergens.filter(a =>
        a.toLowerCase().includes(search.toLowerCase())
    );

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
        color: '#EEE8DA',
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
});
