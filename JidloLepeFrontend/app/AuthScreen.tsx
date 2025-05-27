import React, { useState } from 'react';
import {
    View,
    TextInput,
    Button,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const AuthScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const handleLogin = async () => {
        setError('');
        console.log('➡️ Odesílám login požadavek na backend...');
        try {
            const response = await fetch('http://192.168.30.106:8082/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            console.log('⬅️ Odpověď ze serveru: status', response.status);

            if (!response.ok) {
                let errorMessage = 'Neplatné přihlašovací údaje.';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    console.log('⚠️ Nelze načíst tělo chyby');
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('✅ Přihlášení úspěšné, token:', data.token);

            await AsyncStorage.setItem('token', data.token);
            router.replace('/profile');
        } catch (err: unknown) {
            console.log('❌ Chyba při loginu:', err);
            if (err instanceof Error) {
                setError(err.message);
                Alert.alert('Chyba přihlášení', err.message);
            } else {
                setError('Neznámá chyba');
                Alert.alert('Chyba přihlášení', 'Neznámá chyba');
            }
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Přihlášení</Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            <View style={styles.passwordContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Heslo"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                >
                    <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color="gray" />
                </TouchableOpacity>
            </View>

            <Button title="Přihlásit se" onPress={handleLogin} />

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        marginBottom: 15,
        paddingLeft: 10,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginBottom: 15,
    },
    passwordContainer: {
        position: 'relative',
    },
    eyeIcon: {
        position: 'absolute',
        right: 10,
        top: 10,
    },
});

export default AuthScreen;
