import { View, Text, Image, Button } from "react-native";
import React, { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import GoogleLoginButton from "@/components/GoogleLoginButton";

const Profile = () => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
        });

        return unsubscribe;
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            alert("Odhlášen!");
        } catch (error) {
            console.error("Chyba při odhlašování:", error);
        }
    };

    if (!user) {
        return (
            <View className="flex-1 justify-center items-center bg-[#F5F5F5]">
                <Text className="text-lg mb-4">Nejste přihlášen(a)</Text>
                <GoogleLoginButton />
            </View>
        );
    }

    return (
        <View className="flex-1 justify-center items-center bg-[#F5F5F5]">
            <Image
                source={{ uri: user.photoURL || "" }}
                style={{ width: 80, height: 80, borderRadius: 40 }}
            />
            <Text className="text-xl font-bold mt-4">{user.displayName}</Text>
            <Text className="text-sm text-gray-600">{user.email}</Text>

            <View className="mt-6">
                <Button title="Odhlásit se" onPress={handleLogout} />
            </View>
        </View>
    );
};

export default Profile;
