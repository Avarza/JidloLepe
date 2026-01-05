import { Text, View, ScrollView, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import SearchBar from "@/components/searchBar";
import icons from "@/constants/icons";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {API_BASE_URL} from "@/config/api";

interface Product {
    code: string;
    product_name: string;
    image_front_url?: string;
}

export default function Home() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/products/`);
                const data = await response.json();

                if (data.products) {
                    setProducts(data.products);
                    console.log(" Načtené produkty:", data.products.length);
                } else {
                    console.warn(" Žádné produkty nenalezeny v odpovědi.");
                }
            } catch (error) {
                console.error(' Chyba při načítání produktů:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-accent">
                <Text>Načítání produktů...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            className="flex-1 px-4 pt-10 bg-accent"
            contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
            <Image source={icons.logo} className="w-12 h-10 mt-20 mb-5 mx-auto" />

            <SearchBar
                onPress={() => router.push("/(tabs)/search")}
                placeholder="Hledej produkty!"
            />

            {products.map((product) => {
                if (!product.code) return null;

                return (
                    <Pressable
                        key={product.code}
                        onPress={() =>
                            router.push({ pathname: '/Product/[id]', params: { id: product.code } })
                        }
                    >
                        <View className="mb-5 bg-white p-3 rounded-2xl accent-primary">
                            {product.image_front_url && (
                                <Image
                                    source={{ uri: product.image_front_url }}
                                    className="w-full h-48 rounded-xl mb-2"
                                    resizeMode="contain"
                                />
                            )}
                            <Text className="text-lg font-semibold">
                                {product.product_name || 'Bez názvu'}
                            </Text>
                        </View>
                    </Pressable>
                );
            })}
        </ScrollView>
    );
}
