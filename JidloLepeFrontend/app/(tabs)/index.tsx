import { Text, View, ScrollView, Image, Pressable, Button, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import SearchBar from "@/components/searchBar";
import icons from "@/constants/icons";
import * as SecureStore from "expo-secure-store"; // ⬅️ Přidáno

interface Product {
    code: string;
    product_name: string;
    image_front_url?: string;
}

export default function Home() {
    const router = useRouter();

    const [products, setProducts] = useState<Product[]>([]);
    const [productLoading, setProductLoading] = useState<boolean>(true);

    // Načtení produktů hned bez čekání na token
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch('https://world.openfoodfacts.org/cgi/search.pl?action=process&tagtype_0=categories&tag_contains_0=contains&tag_0=snacks&page_size=5&json=true');
                const data = await response.json();
                setProducts(data.products);
            } catch (error) {
                console.error('Chyba při načítání produktů:', error);
            } finally {
                setProductLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const handleCheckToken = async () => {
        const storedToken = await SecureStore.getItemAsync("token");
        const storedEmail = await SecureStore.getItemAsync("userEmail");

        Alert.alert("Debug Token", `Token: ${storedToken || 'null'}\nEmail: ${storedEmail || 'null'}`);
    };

    if (productLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-accent">
                <Text>Načítání produktů...</Text>
                <Button title="🔍 Zkontroluj token" onPress={handleCheckToken} />
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 px-4 pt-10 bg-accent">
            <Image source={icons.logo} className="w-12 h-10 mt-20 mb-5 mx-auto" />
            <SearchBar onPress={() => router.push("/(tabs)/search")} placeholder="Hledej produkty!" />

            <Button title="🔍 Zkontroluj token" onPress={handleCheckToken} />

            {products.map((product) => {
                if (!product.code) return null;

                return (
                    <Pressable
                        key={product.code}
                        onPress={() => router.push({ pathname: '/Product/[id]', params: { id: product.code } })}
                    >
                        <View className="mb-5 bg-white p-3 rounded-2xl accent-primary">
                            {product.image_front_url && (
                                <Image
                                    source={{ uri: product.image_front_url }}
                                    className="w-full h-48 rounded-xl mb-2"
                                    resizeMode="contain"
                                />
                            )}
                            <Text className="text-lg font-semibold">{product.product_name || 'Bez názvu'}</Text>
                        </View>
                    </Pressable>
                );
            })}
        </ScrollView>
    );
}
