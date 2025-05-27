import { View, Text, ScrollView, Image, TextInput, Pressable, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import icons from "@/constants/icons";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Product {
    code: string;
    product_name: string;
    image_front_url?: string;
}

const Search = () => {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const insets = useSafeAreaInsets();

    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setSearched(true);
        try {
            const response = await fetch(
                `https://world.openfoodfacts.org/cgi/search.pl?action=process&search_terms=${encodeURIComponent(query)}&page_size=10&json=true`
            );
            const data = await response.json();
            setProducts(data.products);
        } catch (error) {
            console.error('Chyba při hledání:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-accent px-4 pt-10">
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

            {loading && <ActivityIndicator size="large" color="#000" className="mt-10" />}

            {!loading && searched && products.length === 0 && (
                <Text className="text-center mt-10 text-gray-600">Žádné produkty nenalezeny</Text>
            )}

            <ScrollView   className="flex-1 px-4 pt-10 bg-accent"
                          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} // přidá místo odspodu
            >
                {products.map((product) => {
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
