import React, { useState } from "react";
import { Button, TextInput, View } from "react-native";
import { auth } from "@/lib/firebase"; // Importuj Firebase pro získání aktuálního uživatele
import { saveAllergiesToFirestore } from "@/lib/firestore"; // Importuj funkci pro ukládání alergií

const AllergiesForm = () => {
    const [allergies, setAllergies] = useState<string[]>([]);

    const handleSave = () => {
        if (auth.currentUser) {
            // Zavolání funkce pro uložení alergií a předání uživatelského ID
            saveAllergiesToFirestore(auth.currentUser.uid, allergies);
        } else {
            console.error('Uživatel není přihlášen!');
        }
    };

    return (
        <View>
            <TextInput
                placeholder="Zadejte vaše alergie"
                value={allergies.join(", ")}
                onChangeText={(text) => setAllergies(text.split(", "))} // Uložení alergií jako pole
            />
            <Button title="Uložit alergie" onPress={handleSave} />
        </View>
    );
};

export default AllergiesForm;
