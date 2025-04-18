import React, { useState, useEffect } from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity, Alert, Button } from 'react-native';
import { db } from '@/constants/firebaseConfig';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const AllergenSelector = () => {
    const [allergens, setAllergens] = useState<any>({});
    const [filteredAllergens, setFilteredAllergens] = useState<any>({});
    const [searchText, setSearchText] = useState('');
    const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);

    const auth = getAuth();
    const user = auth.currentUser;

    useEffect(() => {
        const fetchAllergens = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'allergens'));
                const allergenData: any = {};
                querySnapshot.forEach(doc => {
                    allergenData[doc.id] = doc.data().allergens;
                });
                setAllergens(allergenData);
                setFilteredAllergens(allergenData);
            } catch (error) {
                Alert.alert('Chyba', 'Nelze načíst alergeny.');
                console.error('Chyba při načítání:', error);
            }
        };

        const fetchUserAllergens = async () => {
            if (user) {
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    if (userData?.allergens) {
                        setSelectedAllergens(userData.allergens);
                    }
                }
            }
        };

        fetchAllergens();
        fetchUserAllergens();
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

    const isSelected = (category: string, allergen: string) => {
        return selectedAllergens.includes(`${category}: ${allergen}`);
    };

    const handleSaveSelection = async () => {
        if (!user) {
            Alert.alert('Nepřihlášený uživatel', 'Přihlaste se pro uložení alergenů.');
            return;
        }

        try {
            await setDoc(doc(db, 'users', user.uid), {
                allergens: selectedAllergens,
            }, { merge: true });

            Alert.alert('Uloženo', 'Alergeny byly úspěšně uloženy.');
        } catch (error) {
            console.error('Chyba při ukládání:', error);
            Alert.alert('Chyba', 'Nepodařilo se uložit alergeny.');
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
                            const selected = isSelected(category, item);
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
                                    <Text style={{ marginRight: 10 }}>
                                        {selected ? '☑' : '☐'}
                                    </Text>
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
