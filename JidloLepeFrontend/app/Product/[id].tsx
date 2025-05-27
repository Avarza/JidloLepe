import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    Text,
    View,
    Image,
    ScrollView,
    StyleSheet,
    TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import icons from "@/constants/icons";
import allergensData from "@/assets/data/allergens.json";

interface ProductData {
    product_name: string;
    image_url: string;
    ingredients_text: string | null;
    ingredients_text_cz?: string | null;
    ingredients_text_en?: string | null;
}

export default function ProductDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [productData, setProductData] = useState<ProductData | null>(null);
    const [hasAllergen, setHasAllergen] = useState<boolean | null>(null);
    const [userAllergens, setUserAllergens] = useState<string[]>([]);
    const [overlayVisible, setOverlayVisible] = useState(true);

    // 🥫 Načti data o produktu
    useEffect(() => {
        const fetchProductData = async () => {
            try {
                const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${id}.json`);
                const data = await response.json();
                if (data.product) {
                    setProductData(data.product);
                }
            } catch (error) {
                console.error('Chyba při načítání produktu:', error);
            }
        };

        if (id) {
            fetchProductData();
        }
    }, [id]);

    // 🧠 Načti alergeny z backendu (JWT)
    useEffect(() => {
        const fetchUserAllergens = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (!token) return;

                const response = await fetch('http://192.168.30.106:8082/api/users/allergens', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) throw new Error('Chyba při načítání alergenů');
                const data: string[] = await response.json();
                setUserAllergens(data); // např. ["Lepek", "Ryby"]
            } catch (err) {
                console.error('❌ Chyba při načítání uživatelských alergenů:', err);
            }
        };

        fetchUserAllergens();
    }, []);

    // 🔍 Porovnej složení s alergeny
    useEffect(() => {
        const ingredients =
            productData?.ingredients_text_cz ||
            productData?.ingredients_text ||
            productData?.ingredients_text_en ||
            null;

        if (!ingredients || userAllergens.length === 0) return;

        const lowerIngredients = ingredients.toLowerCase();

        const translationsToCheck = allergensData
            .filter((item) => userAllergens.includes(item.cz))
            .flatMap((item) => item.translations.map((tr) => tr.toLowerCase()));

        const found = translationsToCheck.some((term) =>
            lowerIngredients.includes(term)
        );

        setHasAllergen(found);
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
            {overlayVisible && hasAllergen !== null && (
                <View style={styles.overlay}>
                    <Image
                        source={hasAllergen ? icons.bad : icons.good}
                        style={styles.icon}
                    />
                    <Text
                        style={[
                            styles.overlayText,
                            { color: hasAllergen ? 'red' : 'green' },
                        ]}
                    >
                        {hasAllergen
                            ? 'Obsahuje alergeny, které jste zadali'
                            : 'Bez alergenů, které jste zadali'}
                    </Text>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setOverlayVisible(false)}
                    >
                        <Ionicons name="close" size={30} color="white" />
                    </TouchableOpacity>
                </View>
            )}

            <ScrollView style={styles.productContainer}>
                <View style={styles.productHeader}>
                    <Text style={styles.productTitle}>{productData.product_name}</Text>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
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
                <Text>
                    {productData.ingredients_text_cz ||
                        productData.ingredients_text ||
                        'Složení není k dispozici.'}
                </Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E8DFD0',
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
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        opacity: 0.9,
    },
    overlayText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    closeButton: {
        position: 'absolute',
        bottom: 20,
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
        alignItems: 'center',
        marginBottom: 20,
        paddingTop: 40,
        justifyContent: 'center',
        position: 'relative',
    },
    productTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        marginRight: 10,
        textAlign: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 0,
        left: 10,
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
