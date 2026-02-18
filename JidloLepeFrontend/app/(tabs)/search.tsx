import { View, Text, ScrollView, Image, TextInput, Pressable, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import icons from "@/constants/icons";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE_URL } from "@/config/api";

interface Product {
    code: string;
    product_name: string;
    image_front_url?: string;
}

const Search = () => {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [backendProducts, setBackendProducts] = useState<Product[]>([]);
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const insets = useSafeAreaInsets();

    // 🔥 1) Načti produkty z backendu (stejně jako Home)
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/products/`);
                const data = await response.json();

                if (data.products) {
                    setBackendProducts(data.products);
                }
            } catch (error) {
                console.error('Chyba při načítání produktů:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    // 🔍 2) Vyhledávání přes OpenFoodFacts API
    const handleSearch = async () => {
        if (!query.trim()) return;

        setSearching(true);
        setSearchResults([]);

        try {
            const response = await fetch(
                `https://world.openfoodfacts.org/cgi/search.pl?action=process&search_terms=${encodeURIComponent(
                    query
                )}&page_size=20&json=true`
            );

            const data = await response.json();
            setSearchResults(data.products || []);
        } catch (error) {
            console.error('Chyba při hledání:', error);
        } finally {
            setSearching(false);
        }
    };

    return (
        <View className="flex-1 bg-accent px-4 pt-10">

            {/* 🔍 Vyhledávací pole */}
            <View className="flex-row items-center mb-4 bg-primary rounded-full px-4 py-3">
                <Image source={icons.search} className="w-5 h-5 mr-3" resizeMode="contain" />
                <TextInput
                    placeholder="Hledat produkt..."
                    placeholderTextColor="white"
                    value={query}
                    onChangeText={setQuery}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                    className="text-white flex-1"
                />
            </View>

            {/* 🔄 Načítání backend produktů */}
            {loading && <ActivityIndicator size="large" color="#000" className="mt-10" />}

            {/* 🔄 Načítání výsledků hledání */}
            {searching && <ActivityIndicator size="large" color="#000" className="mt-10" />}

            {/* ❌ Nic nenalezeno */}
            {!loading && !searching && query && searchResults.length === 0 && (
                <Text className="text-center mt-10 text-gray-600">Žádné produkty nenalezeny</Text>
            )}

            <ScrollView
                className="flex-1 px-4 pt-5 bg-accent"
                contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
            >
                {/* 🛒 3) Pokud není vyhledávání → zobraz backend produkty */}
                {!query &&
                    backendProducts.map((product) => {
                        if (!product.code) return null;

                        return (
                            <Pressable
                                key={product.code}
                                onPress={() =>
                                    router.push({ pathname: '/Product/[id]', params: { id: product.code } })
                                }
                            >
                                <View className="mb-5 bg-white p-3 rounded-2xl">
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

                {/* 🔍 4) Pokud je vyhledávání → zobraz výsledky z OpenFoodFacts */}
                {query &&
                    searchResults.map((product) => {
                        if (!product.code) return null;

                        return (
                            <Pressable
                                key={product.code}
                                onPress={() =>
                                    router.push({ pathname: '/Product/[id]', params: { id: product.code } })
                                }
                            >
                                <View className="mb-5 bg-white p-3 rounded-2xl">
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
        </View>
    );
};

export default Search;
