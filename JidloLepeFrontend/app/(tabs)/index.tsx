import { Text, View, ScrollView, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import SearchBar from "@/components/searchBar";
import icons from "@/constants/icons";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE_URL } from "@/config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/context/authContext";

interface Product {
    code: string;
    product_name: string;
    image_front_url?: string;
}

export default function Home() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { isLoggedIn } = useAuth();

    const [products, setProducts] = useState<Product[]>([]);
    const [recent, setRecent] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [userAllergens, setUserAllergens] = useState<string[]>([]);

    // 🔥 Načti produkty z backendu
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/products/`);
                const data = await response.json();

                if (data.products) {
                    setProducts(data.products);
                }
            } catch (error) {
                console.error('Chyba při načítání produktů:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    // 🔥 Načti poslední prohlížené produkty
    useEffect(() => {
        const loadRecent = async () => {
            const stored = await AsyncStorage.getItem("recent_products");
            if (stored) setRecent(JSON.parse(stored));
        };
        loadRecent();
    }, []);

    // 🔥 Načti alergeny uživatele
    useEffect(() => {
        const loadAllergens = async () => {
            if (!isLoggedIn) return;

            const token = await AsyncStorage.getItem("token");
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/api/users/allergens`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setUserAllergens(data);
            }
        };

        loadAllergens();
    }, [isLoggedIn]);

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
            {/* 🔥 Logo */}
            <Image source={icons.logo} className="w-12 h-10 mt-20 mb-3 mx-auto" />


            {/* 🔍 Vyhledávání */}
            <SearchBar
                onPress={() => router.push("/(tabs)/search")}
                placeholder="Hledej produkty!"
            />

            {/* 📷 Skenovat produkt */}
            <Pressable
                onPress={() => router.push("/scan")}
                className="bg-primary mt-5 p-4 rounded-full items-center"
            >
                <Text className="text-white font-semibold text-lg">📷 Skenovat produkt</Text>
            </Pressable>

            {/* ⚠️ Moje alergeny */}
            {isLoggedIn && (
                <View className="mt-8 bg-white p-4 rounded-2xl">
                    <Text className="text-lg font-semibold mb-2">Moje alergeny</Text>
                    {userAllergens.length > 0 ? (
                        <Text>{userAllergens.join(", ")}</Text>
                    ) : (
                        <Text className="text-gray-500">Nemáš uložené žádné alergeny.</Text>
                    )}

                    <Pressable
                        onPress={() => router.push("/(tabs)/fav")}
                        className="mt-3 bg-primary p-2 rounded-xl"
                    >
                        <Text className="text-white text-center font-semibold">Upravit alergeny</Text>
                    </Pressable>
                </View>
            )}

            {/* ⭐ Doporučené produkty */}
            <Text className="text-xl font-bold mt-10 mb-3">Doporučené produkty</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {products.slice(0, 6).map((product) => (
                    <Pressable
                        key={product.code}
                        onPress={() =>
                            router.push({ pathname: '/Product/[id]', params: { id: product.code } })
                        }
                        className="mr-4"
                    >
                        <View className="bg-white p-3 rounded-2xl w-40">
                            {product.image_front_url && (
                                <Image
                                    source={{ uri: product.image_front_url }}
                                    className="w-full h-32 rounded-xl mb-2"
                                    resizeMode="contain"
                                />
                            )}
                            <Text className="font-semibold" numberOfLines={1}>
                                {product.product_name || 'Bez názvu'}
                            </Text>
                        </View>
                    </Pressable>
                ))}
            </ScrollView>

            {/* 🕒 Naposledy prohlížené */}
            {recent.length > 0 && (
                <>
                    <Text className="text-xl font-bold mt-10 mb-3">Naposledy prohlížené</Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {recent.map((product) => (
                            <Pressable
                                key={product.code}
                                onPress={() =>
                                    router.push({ pathname: '/Product/[id]', params: { id: product.code } })
                                }
                                className="mr-4"
                            >
                                <View className="bg-white p-3 rounded-2xl w-40">
                                    {product.image_front_url && (
                                        <Image
                                            source={{ uri: product.image_front_url }}
                                            className="w-full h-32 rounded-xl mb-2"
                                            resizeMode="contain"
                                        />
                                    )}
                                    <Text className="font-semibold" numberOfLines={1}>
                                        {product.product_name || 'Bez názvu'}
                                    </Text>
                                </View>
                            </Pressable>
                        ))}
                    </ScrollView>
                </>
            )}

            {/* 📊 Statistiky */}
            <View className="mt-10 bg-white p-4 rounded-2xl">
                <Text className="text-xl font-bold mb-3">Statistiky</Text>

                <Text>📦 Počet produktů v databázi: {products.length}</Text>

                {recent.length > 0 && (
                    <Text>🕒 Zkontrolované produkty: {recent.length}</Text>
                )}

                {userAllergens.length > 0 && (
                    <Text>⚠️ Sledované alergeny: {userAllergens.length}</Text>
                )}
            </View>
        </ScrollView>
    );
}
