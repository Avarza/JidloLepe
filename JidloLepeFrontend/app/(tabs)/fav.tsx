import React, { useState } from "react";
import { View, Text, TouchableOpacity, Button, StyleSheet, Alert, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const predefinedAllergies = [
    "Lepek",
    "Laktóza",
    "Ořechy",
    "Sója",
    "Vejce",
    "Ryby",
    "Korýši",
    "Celer",
    "Hořčice",
];

const AllergiesForm = () => {
    const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const toggleAllergy = (allergy: string) => {
        setSelectedAllergies(prev =>
            prev.includes(allergy) ? prev.filter(a => a !== allergy) : [...prev, allergy]
        );
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const token = await AsyncStorage.getItem("jwtToken");
            if (!token) {
                Alert.alert("Chyba", "Uživatel není přihlášen.");
                setIsSaving(false);
                return;
            }

            const response = await fetch("http://192.168.30.106:8081/api/user/allergies", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ allergies: selectedAllergies }),
            });

            if (!response.ok) {
                throw new Error("Uložení alergií selhalo");
            }

            Alert.alert("Úspěch", "Alergie byly uloženy.");
        } catch (error: unknown) {
            if (error instanceof Error) {
                Alert.alert("Chyba", error.message);
            } else {
                Alert.alert("Chyba", "Nastala neznámá chyba");
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Vyberte vaše alergie:</Text>
            {predefinedAllergies.map((allergy) => (
                <TouchableOpacity
                    key={allergy}
                    style={[
                        styles.allergyButton,
                        selectedAllergies.includes(allergy) && styles.allergyButtonSelected,
                    ]}
                    onPress={() => toggleAllergy(allergy)}
                >
                    <Text
                        style={[
                            styles.allergyText,
                            selectedAllergies.includes(allergy) && styles.allergyTextSelected,
                        ]}
                    >
                        {allergy}
                    </Text>
                </TouchableOpacity>
            ))}

            <Button title={isSaving ? "Ukládám..." : "Uložit alergie"} onPress={handleSave} disabled={isSaving} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        alignItems: "center",
    },
    title: {
        fontSize: 20,
        marginBottom: 20,
        fontWeight: "bold",
    },
    allergyButton: {
        borderWidth: 1,
        borderColor: "#007BFF",
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginVertical: 5,
        width: "100%",
        alignItems: "center",
    },
    allergyButtonSelected: {
        backgroundColor: "#007BFF",
    },
    allergyText: {
        color: "#007BFF",
        fontSize: 16,
    },
    allergyTextSelected: {
        color: "white",
        fontWeight: "bold",
    },
});

export default AllergiesForm;
