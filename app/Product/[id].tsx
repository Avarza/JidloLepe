import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View, Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';  // Ikona šipky zpět

// Typ pro data produktu
interface ProductData {
    product_name: string;
    image_url: string;
    ingredients_text: string | null;
}

export default function ProductDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [productData, setProductData] = useState<ProductData | null>(null);

    useEffect(() => {
        const fetchProductData = async () => {
            try {
                const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${id}.json`);
                const data = await response.json();

                // Kontrola, zda odpověď obsahuje produkt
                if (data.product) {
                    setProductData(data.product);
                }
            } catch (error) {
                console.error('Error fetching product data:', error);
            }
        };

        if (id) {
            fetchProductData();
        }
    }, [id]);

    if (!productData) {
        return (
            <View style={styles.container}>
                <Text>Načítání produktu...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Tlačítko pro návrat */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.push('/')}  // Návrat na hlavní obrazovku
            >
                <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>

            <Text style={styles.productTitle}>{productData.product_name}</Text>
            {productData.image_url && (
                <Image
                    source={{ uri: productData.image_url }}
                    style={styles.productImage}
                />
            )}
            <Text style={styles.sectionTitle}>Složení:</Text>
            <Text>{productData.ingredients_text || 'Složení není k dispozici.'}</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#fff',
    },
    productTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    productImage: {
        width: '100%',
        height: 300,
        resizeMode: 'contain',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
    },
    backButton: {
   display:"flex",
        justifyContent:"flex-start",
    },
});
