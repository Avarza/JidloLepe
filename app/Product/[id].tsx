import { useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Text, View, Image, ScrollView, StyleSheet } from 'react-native';

// Typ pro data produktu
interface ProductData {
    product_name: string;
    image_url: string;
    ingredients_text: string | null;
}

export default function ProductDetail() {
    const { id } = useLocalSearchParams();
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
});
