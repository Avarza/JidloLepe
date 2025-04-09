import { Text, View, ScrollView, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import SearchBar from "@/components/searchBar";
import icons from "@/constants/icons";


interface Product {
    code: string;
    product_name: string;
    image_front_url?: string;
}

export default function Home() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch('https://world.openfoodfacts.org/cgi/search.pl?action=process&tagtype_0=categories&tag_contains_0=contains&tag_0=snacks&page_size=5&json=true');
                const data = await response.json();
                setProducts(data.products);
                console.log("Načtené produkty:", data.products);
            } catch (error) {
                console.error('Chyba při načítání produktů:', error);
            }
        };

        fetchProducts();
    }, []);

    return (
        <ScrollView className="flex-1 px-4 pt-10 bg-accent">
            <Image source={icons.logo} className="w-12 h-10 mt-20 mb-5 mx-auto" />

            <SearchBar onPress={()=> router.push("/(tabs)/search")}
                       placeholder="Hledej produkty!"
            />
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