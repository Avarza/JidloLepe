import React, { useState } from 'react';
import {
    View,
    Text,
    Image,
    Button,
    ScrollView,
    StyleSheet,
    TouchableOpacity
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

// Definice typu pro produkt
type Product = {
    image: string;
    name: string;
};

const ProfileScreen = () => {
    const router = useRouter();
    const [backgroundImage, setBackgroundImage] = useState('https://example.com/background.jpg');
    const [avatarImage, setAvatarImage] = useState('https://example.com/avatar.jpg');
    // Typ pro recentProducts je nyní pole typu Product
    const [recentProducts, setRecentProducts] = useState<Product[]>([]);

    const pickImage = async (setter: (uri: string) => void) => {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
        if (!result.canceled && result.assets.length > 0) {
            setter(result.assets[0].uri);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        router.replace('/AuthScreen');
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Image source={{ uri: backgroundImage }} style={styles.background} />
                <TouchableOpacity
                    style={styles.avatarWrapper}
                    onPress={() => pickImage(setAvatarImage)}
                >
                    <Image source={{ uri: avatarImage }} style={styles.avatar} />
                </TouchableOpacity>
            </View>

            <View style={styles.buttonsRow}>
                <Button title="Změnit heslo" onPress={() => router.push('/')} />
                <Button title="Nahrát profilovku" onPress={() => pickImage(setAvatarImage)} />
                <Button title="Odhlásit se" onPress={handleLogout} />
            </View>

            <Text style={styles.sectionTitle}>Naposledy prohlížené</Text>
            <View style={styles.historyContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {recentProducts.map((product, index) => (
                        <View key={index} style={styles.productCard}>
                            <Image source={{ uri: product.image }} style={styles.productImage} />
                            <Text>{product.name}</Text>
                        </View>
                    ))}
                </ScrollView>
                <TouchableOpacity onPress={() => {}}>
                    <Ionicons name="arrow-forward-circle" size={30} color="gray" />
                </TouchableOpacity>
            </View>

            <View style={styles.extraButtons}>
                <Button title="Moje alergeny" onPress={() => router.push('/(tabs)/fav')} />
                <Button title="Doporučené produkty" onPress={() => router.push('/(tabs)/search')} />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        position: 'relative',
        height: 200,
    },
    background: {
        width: '100%',
        height: '100%',
    },
    avatarWrapper: {
        position: 'absolute',
        bottom: -40,
        left: '50%',
        marginLeft: -40,
        width: 80,
        height: 80,
        borderRadius: 40,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#fff',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    buttonsRow: {
        marginTop: 60,
        paddingHorizontal: 20,
        gap: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginHorizontal: 20,
        marginTop: 20,
    },
    historyContainer: {
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    productCard: {
        width: 100,
        height: 140,
        marginRight: 10,
        alignItems: 'center',
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: 10,
    },
    extraButtons: {
        paddingHorizontal: 20,
        marginTop: 20,
        gap: 10,
    },
});

export default ProfileScreen;
