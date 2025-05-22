import { View, Text, TouchableOpacity, Image } from "react-native";
import React, { useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { useAuthRequest, makeRedirectUri } from "expo-auth-session";
import { signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";

WebBrowser.maybeCompleteAuthSession();

const GoogleLoginButton = () => {
    const [request, response, promptAsync] = Google.useAuthRequest({
        androidClientId: "254745062967-a5r38upfkiu8s8vlfug23aamdfjmddsn.apps.googleusercontent.com",
        redirectUri: makeRedirectUri(),
    });

    useEffect(() => {
        if (response?.type === "success" && response.authentication?.idToken) {
            const { idToken } = response.authentication;

            const credential = GoogleAuthProvider.credential(idToken);
            signInWithCredential(auth, credential).catch((err) => {
                console.error("Přihlášení selhalo", err);
            });
        }
    }, [response]);


    return (
        <TouchableOpacity
            className="bg-white p-3 rounded-lg flex-row items-center justify-center"
            onPress={() => promptAsync()}
        >
            <Image
                source={{ uri: "https://img.icons8.com/color/48/google-logo.png" }}
                style={{ width: 24, height: 24, marginRight: 10 }}
            />
            <Text className="text-black font-semibold">Přihlásit se přes Google</Text>
        </TouchableOpacity>
    );
};

export default GoogleLoginButton;
