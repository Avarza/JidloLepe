// /components/AllergenSelector.tsx
import React, { useState, useEffect } from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity, Alert, Button } from 'react-native';
import { fetchAllergens, fetchUserAllergens, saveUserAllergens } from '@/services/allergenService';  // Import služeb
import { getAuth } from 'firebase/auth';

const AllergenSelector = () => {
    const [allergens, setAllergens] = useState<any>({});
    const [filteredAllergens, setFilteredAllergens] = useState<any>({});
    const [searchText, setSearchText] = useState('');
    const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
    const auth = getAuth();
    const user = auth.currentUser;
    const getErrorMessage = (error: unknown) =>
        error instanceof Error ? error.message : 'Došlo k neznámé chybě';
    useEffect(() => {
        const loadData = async () => {
            try {
                const allergenData = await fetchAllergens();  // Používáme službu
                setAllergens(allergenData);
                setFilteredAllergens(allergenData);

                if (user) {
                    const userAllergens = await fetchUserAllergens(user.uid);  // Používáme službu
                    setSelectedAllergens(userAllergens);
                }
            } catch (error) {
                Alert.alert('Chyba', getErrorMessage(error));
                console.error('Error loading allergens:', error);
            }
        };

        loadData();
    }, [user]);

    const filterAllergens = (text: string) => {
        setSearchText(text);
        if (!text) {
            setFilteredAllergens(allergens);
            return;
        }

        const filtered: any = {};
        for (const category in allergens) {
            const filteredCategory = allergens[category].filter((allergen: string) =>
                allergen.toLowerCase().includes(text.toLowerCase())
            );
            if (filteredCategory.length > 0) {
                filtered[category] = filteredCategory;
            }
        }
        setFilteredAllergens(filtered);
    };

    const handleToggleAllergen = (category: string, allergen: string) => {
        const fullName = `${category}: ${allergen}`;
        setSelectedAllergens((prev) =>
            prev.includes(fullName)
                ? prev.filter((item) => item !== fullName)
                : [...prev, fullName]
        );
    };

    const handleSaveSelection = async () => {
        if (!user) {
            Alert.alert('Nepřihlášený uživatel', 'Přihlaste se pro uložení alergenů.');
            return;
        }

        try {
            await saveUserAllergens(user.uid, selectedAllergens);  // Používáme službu
            Alert.alert('Uloženo', 'Alergeny byly úspěšně uloženy.');
        } catch (error) {
            Alert.alert('Chyba', getErrorMessage(error));
        }
    };

    const handleResetSelection = () => {
        setSelectedAllergens([]);
    };

    return (
        <View style={{ padding: 20 }}>
            <TextInput
                placeholder="Hledejte alergeny..."
                value={searchText}
                onChangeText={filterAllergens}
                style={{
                    borderWidth: 1,
                    marginVertical: 10,
                    padding: 10,
                    borderRadius: 5,
                }}
            />

            <Text style={{ marginBottom: 10, fontWeight: 'bold' }}>Vyberte alergeny:</Text>

            {Object.keys(filteredAllergens).map((category) => (
                <View key={category}>
                    <Text style={{ fontWeight: 'bold', marginTop: 10 }}>{category}</Text>
                    <FlatList
                        data={filteredAllergens[category]}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => {
                            const selected = selectedAllergens.includes(`${category}: ${item}`);
                            return (
                                <TouchableOpacity
                                    onPress={() => handleToggleAllergen(category, item)}
                                    style={{
                                        padding: 10,
                                        marginVertical: 4,
                                        borderRadius: 5,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: selected ? '#d1fae5' : '#f3f4f6',
                                    }}
                                >
                                    <Text style={{ marginRight: 10 }}>{selected ? '☑' : '☐'}</Text>
                                    <Text>{item}</Text>
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>
            ))}

            {selectedAllergens.length > 0 && (
                <View style={{ marginTop: 20 }}>
                    <Text style={{ fontWeight: 'bold' }}>Vybrané alergeny:</Text>
                    {selectedAllergens.map((a, i) => (
                        <Text key={i}>• {a}</Text>
                    ))}
                </View>
            )}

            <View style={{ marginTop: 30 }}>
                <Button title="Uložit výběr" onPress={handleSaveSelection} />
                <View style={{ height: 10 }} />
                <Button title="Zrušit výběr" color="gray" onPress={handleResetSelection} />
            </View>
        </View>
    );
};

export default AllergenSelector;
