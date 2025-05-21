import React, { useEffect, useState } from "react";
import { View, Text, Image, Button, StyleSheet, Alert } from "react-native";
import { useAuth } from "@/src/context/authContext";  // uprav cestu podle struktury
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

const ProfileScreen = () => {
    const { logout } = useAuth();
    const router = useRouter();

    const [userData, setUserData] = useState<{ email: string; name: string } | null>(null);

    useEffect(() => {
        // Můžeš to přepsat na SecureStore pokud chceš, tady nechávám AsyncStorage kvůli příkladu
        const loadUserData = async () => {
            try {
                // Pokud máš jinde uložený userName, přizpůsob tady
                const email = await SecureStore.getItemAsync("userEmail");
                // Příklad statického jména
                if (email) {
                    setUserData({ email, name: "Jan Novák" });
                }
            } catch (error) {
                console.error("Error loading user data", error);
            }
        };
        loadUserData();
    }, []);

    const handleChangePassword = () => {
        Alert.alert("Funkce změny hesla", "Zde přidáš změnu hesla");
    };

    const handleLogout = async () => {
        try {
            await logout(); // použije authContext logout
            Alert.alert("Odhlášení", "Byl jsi odhlášen");
            router.replace("/AuthScreen"); // přesměruje na přihlašovací obrazovku
        } catch (e) {
            Alert.alert("Chyba", "Nepodařilo se odhlásit");
        }
    };

    return (
        <View style={styles.container}>
            <Image
                source={require("@/assets/images/avatar-placeholder.png")}
                style={styles.profileImage}
            />
            <Text style={styles.name}>{userData?.name}</Text>
            <Text style={styles.email}>{userData?.email}</Text>

            <View style={styles.buttons}>
                <Button title="Změnit heslo" onPress={handleChangePassword} />
                <View style={{ height: 10 }} />
                <Button title="Odhlásit se" onPress={handleLogout} color="red" />
            </View>
        </View>
    );
};

export default ProfileScreen;

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: "center", padding: 20, justifyContent: "center" },
    profileImage: { width: 100, height: 100, borderRadius: 50, marginBottom: 20 },
    name: { fontSize: 24, fontWeight: "bold" },
    email: { fontSize: 18, color: "gray", marginBottom: 40 },
    buttons: { width: "100%", paddingHorizontal: 40 },
});
