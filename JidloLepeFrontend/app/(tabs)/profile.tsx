import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { loginUser } from '@/controlers/AuthController';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        const success = await loginUser({ email, password });
        if (success) {
            Alert.alert('Přihlášení úspěšné');
        } else {
            Alert.alert('Neplatné údaje');
        }
    };

    return (
        <View>
            <TextInput placeholder="Email" onChangeText={setEmail} />
            <TextInput placeholder="Heslo" secureTextEntry onChangeText={setPassword} />
            <Button title="Přihlásit se" onPress={handleLogin} />
        </View>
    );
}
