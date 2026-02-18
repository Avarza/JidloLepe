import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    Text,
    View,
    Image,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    AppState
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import icons from "@/constants/icons";
import allergensData from "@/assets/data/allergens.json";
import { API_BASE_URL } from "@/config/api";

interface ProductData {
    product_name: string;
    image_url: string;
    ingredients_text: string | null;
    ingredients_text_cz?: string | null;
    ingredients_text_en?: string | null;
    ingredients_text_de?: string | null;
    ingredients_text_fr?: string | null;
    ingredients_text_pl?: string | null;
    ingredients_text_sk?: string | null;
}

export default function ProductDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const [productData, setProductData] = useState<ProductData | null>(null);
    const [hasAllergen, setHasAllergen] = useState<boolean | null>(null);
    const [userAllergens, setUserAllergens] = useState<string[]>([]);
    const [overlayVisible, setOverlayVisible] = useState(true);
    const [loginRequired, setLoginRequired] = useState(false);

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

        if (id) fetchProductData();
    }, [id]);

    // 🧠 Kontrola tokenu + načtení alergenů
    const checkLogin = async () => {
        const token = await AsyncStorage.getItem("token");

        if (!token) {
            setLoginRequired(true);
            setUserAllergens([]);
            setHasAllergen(null);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/users/allergens`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                setLoginRequired(true);
                setUserAllergens([]);
                setHasAllergen(null);
                return;
            }

            const data: string[] = await response.json();
            setUserAllergens(data);
            setLoginRequired(false);

        } catch (err) {
            console.error("Chyba při načítání alergenů:", err);
            setLoginRequired(true);
        }
    };

    // 🔥 Sleduj návrat aplikace do popředí + první načtení
    useEffect(() => {
        checkLogin();

        const sub = AppState.addEventListener("change", (state) => {
            if (state === "active") checkLogin();
        });

        return () => sub.remove();
    }, []);

    // 🔍 Porovnej složení s alergeny
    useEffect(() => {
        if (!productData || userAllergens.length === 0) return;

        const ingredients =
            productData.ingredients_text_cz ||
            productData.ingredients_text ||
            productData.ingredients_text_en ||
            productData.ingredients_text_de ||
            productData.ingredients_text_fr ||
            productData.ingredients_text_pl ||
            productData.ingredients_text_sk ||
            null;

        if (!ingredients) return;

        const lowerIngredients = ingredients.toLowerCase();

        const selectedAllergens = allergensData.filter(item =>
            userAllergens.includes(item.cz)
        );

        const allTerms = selectedAllergens.flatMap(item => {
            const terms = [
                item.cz,
                ...(item.en || []),
                ...(item.de || []),
                ...(item.fr || []),
                ...(item.pl || []),
                ...(item.sk || []),
                ...(item.variants || [])
            ];
            return terms.map(t => t.toLowerCase());
        });

        const found = allTerms.some(term => lowerIngredients.includes(term));

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

            {/* 🔥 Pokud není uživatel přihlášený */}
            {loginRequired && (
                <View style={styles.overlay}>
                    <Ionicons name="lock-closed" size={50} color="white" />
                    <Text style={[styles.overlayText, { color: "white" }]}>
                        Pro zobrazení alergenů se musíte přihlásit.
                    </Text>

                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={() => router.push("/profile")}
                    >
                        <Text style={styles.loginButtonText}>Přejít na přihlášení</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setLoginRequired(false)}
                    >
                        <Ionicons name="close" size={30} color="white" />
                    </TouchableOpacity>
                </View>
            )}

            {/* 🔥 Overlay s výsledkem alergenů */}
            {overlayVisible && hasAllergen !== null && !loginRequired && (
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
                        productData.ingredients_text_en ||
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
        zIndex: 2,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
    },
    overlayText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    loginButton: {
        backgroundColor: "#4CAF50",
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 10,
        marginTop: 10,
    },
    loginButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
    closeButton: {
        position: 'absolute',
        bottom: 20,
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
