import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View, Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Ikona šipky zpět
import icons from "@/constants/icons"; // Import tvých vlastních ikon

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
    const [hasAllergen, setHasAllergen] = useState<boolean | null>(null);
    const [userAllergens, setUserAllergens] = useState<string[]>(['gluten', 'lactose']); // Příklad alergenu uživatele
    const [overlayVisible, setOverlayVisible] = useState(true); // Stavy pro overlay (zobrazení/skrytí)

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

    // Funkce pro kontrolu alergenů v ingrediencích
    const checkForAllergen = (ingredientsText: string | null) => {
        if (!ingredientsText || userAllergens.length === 0) return;

        const matchingAllergens = userAllergens.filter((allergen) =>
            ingredientsText.toLowerCase().includes(allergen.toLowerCase())
        );

        if (matchingAllergens.length > 0) {
            setHasAllergen(true); // Produkt obsahuje alergeny
        } else {
            setHasAllergen(false); // Produkt neobsahuje alergeny
        }
    };

    useEffect(() => {
        const ingredients = productData?.ingredients_text || null;
        checkForAllergen(ingredients);
    }, [productData, userAllergens]);

    if (!productData) {
        return (
            <View style={styles.container}>
                <Text>Načítání produktu...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>


            {/* Overlay pro alergen */}
            {overlayVisible && hasAllergen !== null && (
                <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.9)' }]}>
                    <Image
                        source={hasAllergen ? icons.good : icons.bad}
                        style={styles.icon}
                    />
                    <Text
                        style={[
                            styles.overlayText,
                            { color: hasAllergen ? 'green' : 'red' },
                        ]}
                    >
                        {hasAllergen ? 'Bez alergenů, které jste zadali' : 'Obsahuje alergeny, které jste zadali'}
                    </Text>

                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setOverlayVisible(false)} // Zavření overlay
                    >
                        <Ionicons name="close" size={30} color="white" />
                    </TouchableOpacity>
                </View>
            )}

            <ScrollView style={styles.productContainer}>
                {/* Název produktu a šipka pro návrat */}
                <View style={styles.productHeader}>
                    <Text style={styles.productTitle}>{productData.product_name}</Text>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.push('/scan')} // Návrat na skenování
                    >
                        <Ionicons name="arrow-back" size={30} color="black" />
                    </TouchableOpacity>
                </View>

                {productData.image_url && (
                    <Image
                        source={{ uri: productData.image_url }}
                        style={styles.productImage}
                    />
                )}
                <Text style={styles.sectionTitle}>Složení:</Text>
                <Text>{productData.ingredients_text || 'Složení není k dispozici.'}</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        opacity: 0.8,
    },
    overlayText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 10,
        left: 10,
    },
    closeButton: {
        position: 'absolute',
        bottom: 20,
        margin:"auto",
        transform: [{ translateX: -25 }],

    },
    icon: {
        width: 50,
        height: 50,
        marginBottom: 20,
    },
    productContainer: {
        padding: 20,
    },
    productHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    productTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        marginRight: 10, // 1rem spacing to the right for arrow
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
