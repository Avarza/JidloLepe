import React, { useState, useEffect, useRef } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    Text, View, Image, ScrollView, TouchableOpacity,
    AppState, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import icons from "@/constants/icons";
import allergensData from "@/assets/data/allergens.json";
import { API_BASE_URL } from "@/config/api";

interface Nutriments {
    energy_100g?: number;
    energy_kcal_100g?: number;
    fat_100g?: number;
    'saturated-fat_100g'?: number;
    carbohydrates_100g?: number;
    sugars_100g?: number;
    fiber_100g?: number;
    proteins_100g?: number;
    salt_100g?: number;
}

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
    brands?: string;
    quantity?: string;
    nutriscore_grade?: string;
    nutriments?: Nutriments;
}

const NUTRISCORE: Record<string, { bg: string; text: string; label: string }> = {
    a: { bg: '#1E8F4E', text: '#fff', label: 'Výborné' },
    b: { bg: '#80C040', text: '#fff', label: 'Dobré' },
    c: { bg: '#FFCC00', text: '#333', label: 'Průměrné' },
    d: { bg: '#FF8C00', text: '#fff', label: 'Špatné' },
    e: { bg: '#E63312', text: '#fff', label: 'Velmi špatné' },
};

// ── Vrací pouze alergeny skutečně nalezené ve složení ─────────────────────────
function getFoundAllergens(productData: ProductData, userAllergens: string[]): string[] {
    if (userAllergens.length === 0) return [];
    const ingredients =
        productData.ingredients_text_cz || productData.ingredients_text ||
        productData.ingredients_text_en || productData.ingredients_text_de ||
        productData.ingredients_text_fr || productData.ingredients_text_pl ||
        productData.ingredients_text_sk || null;
    if (!ingredients) return [];

    const lower = ingredients.toLowerCase();
    const found: string[] = [];

    for (const item of allergensData) {
        if (!userAllergens.includes(item.cz)) continue;
        const terms = [
            item.cz,
            ...(item.en || []),
            ...(item.de || []),
            ...(item.fr || []),
            ...(item.pl || []),
            ...(item.sk || []),
            ...(item.variants || []),
        ].map(t => t.toLowerCase());

        if (terms.some(t => lower.includes(t))) {
            found.push(item.cz);
        }
    }

    return found;
}

function LoadingSkeleton() {
    const shimmer = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
                Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
            ])
        ).start();
    }, []);
    const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.85] });
    return (
        <Animated.View style={{ opacity }} className="flex-1 bg-[#F5EFE6] px-5 pt-12">
            <View className="w-2/3 h-6 rounded-full bg-[#E0D4C4] mb-3" />
            <View className="w-1/3 h-4 rounded-full bg-[#E0D4C4] mb-6" />
            <View className="w-full h-64 rounded-3xl bg-[#E0D4C4] mb-6" />
            <View className="w-full h-4 rounded-full bg-[#E0D4C4] mb-2" />
            <View className="w-5/6 h-4 rounded-full bg-[#E0D4C4] mb-2" />
            <View className="w-4/6 h-4 rounded-full bg-[#E0D4C4]" />
        </Animated.View>
    );
}

function NutriRow({ label, value, unit, bold }: { label: string; value?: number; unit: string; bold?: boolean }) {
    if (value === undefined || value === null) return null;
    return (
        <View className={`flex-row justify-between items-center py-2.5 border-b border-[#F0E8DC] ${bold ? 'bg-[#FAF5EF]' : ''}`}>
            <Text className={`text-sm text-[#5C4033] ${bold ? 'font-bold' : 'pl-4'}`}>{label}</Text>
            <Text className={`text-sm text-[#3D2314] ${bold ? 'font-bold' : ''}`}>
                {value % 1 === 0 ? value : value.toFixed(1)} {unit}
            </Text>
        </View>
    );
}

function NutriScoreBar({ grade }: { grade: string }) {
    const grades = ['a', 'b', 'c', 'd', 'e'];
    return (
        <View className="flex-row items-center gap-1">
            {grades.map(g => {
                const cfg = NUTRISCORE[g];
                const active = g === grade;
                return (
                    <View key={g} style={{
                        backgroundColor: cfg.bg,
                        opacity: active ? 1 : 0.25,
                        paddingHorizontal: active ? 14 : 10,
                        paddingVertical: active ? 8 : 5,
                        borderRadius: 8,
                    }}>
                        <Text style={{ color: cfg.text, fontWeight: active ? '900' : '600', fontSize: active ? 15 : 11 }}>
                            {g.toUpperCase()}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
}

export default function ProductDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [productData, setProductData] = useState<ProductData | null>(null);
    const [foundAllergens, setFoundAllergens] = useState<string[]>([]); // jen ty co jsou v produktu
    const [hasAllergen, setHasAllergen] = useState<boolean | null>(null);
    const [userAllergens, setUserAllergens] = useState<string[]>([]);
    const [overlayVisible, setOverlayVisible] = useState(true);
    const [loginRequired, setLoginRequired] = useState(false);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;

        (async () => {
            const token = await AsyncStorage.getItem('token');
            const productPromise = fetchProduct(id as string, token);
            const allergensPromise = token ? fetchAllergens(token) : Promise.resolve(null);
            const [product, allergens] = await Promise.all([productPromise, allergensPromise]);
            if (cancelled) return;

            if (product) setProductData(product);

            if (allergens === null) {
                setLoginRequired(!token ? true : false);
                setUserAllergens([]);
                setHasAllergen(null);
                setFoundAllergens([]);
                setOverlayVisible(true);
            } else {
                setLoginRequired(false);
                setUserAllergens(allergens);
                if (product && allergens.length > 0) {
                    const found = getFoundAllergens(product, allergens);
                    setFoundAllergens(found);
                    setHasAllergen(found.length > 0);
                    setOverlayVisible(true);
                }
            }
        })();

        return () => { cancelled = true; };
    }, [id]);

    useEffect(() => {
        const sub = AppState.addEventListener("change", async (state) => {
            if (state !== "active") return;
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                setLoginRequired(true);
                setUserAllergens([]);
                setHasAllergen(null);
                setFoundAllergens([]);
                setOverlayVisible(true);
                return;
            }
            const allergens = await fetchAllergens(token);
            if (allergens === null) { setLoginRequired(true); return; }
            setLoginRequired(false);
            setUserAllergens(allergens);
            if (productData) {
                const found = getFoundAllergens(productData, allergens);
                setFoundAllergens(found);
                setHasAllergen(found.length > 0);
                setOverlayVisible(true);
            }
        });
        return () => sub.remove();
    }, [productData]);

    if (!productData) return <LoadingSkeleton />;

    const ingredients =
        productData.ingredients_text_cz || productData.ingredients_text ||
        productData.ingredients_text_en || 'Složení není k dispozici.';

    const nutriGrade = productData.nutriscore_grade?.toLowerCase();
    const nutriCfg = nutriGrade ? NUTRISCORE[nutriGrade] : null;
    const n = productData.nutriments ?? {};

    return (
        <View className="flex-1 bg-[#F5EFE6]">

            {loginRequired && (
                <View className="absolute inset-0 z-20 bg-black/90 items-center justify-center p-5">
                    <Ionicons name="lock-closed" size={50} color="white" />
                    <Text className="text-white text-lg font-bold text-center mb-5 mt-2">
                        Pro zobrazení alergenů se musíte přihlásit.
                    </Text>
                    <TouchableOpacity
                        className="bg-[#4CAF50] py-3 px-6 rounded-xl mt-2"
                        onPress={() => router.push("/profile")}
                    >
                        <Text className="text-white text-base font-bold">Přejít na přihlášení</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="absolute bottom-5" onPress={() => setLoginRequired(false)}>
                        <Ionicons name="close" size={30} color="white" />
                    </TouchableOpacity>
                </View>
            )}

            {overlayVisible && hasAllergen !== null && !loginRequired && (
                <View className="absolute inset-0 z-20 bg-black/90 items-center justify-center p-5">
                    <Image
                        source={hasAllergen ? icons.bad : icons.good}
                        className="w-12 h-12 mb-5"
                        resizeMode="contain"
                    />
                    <Text className={`text-lg font-bold text-center mb-5 ${hasAllergen ? 'text-red-500' : 'text-green-500'}`}>
                        {hasAllergen
                            ? 'Obsahuje alergeny, které jste zadali'
                            : 'Bez alergenů, které jste zadali'}
                    </Text>
                    <TouchableOpacity className="absolute bottom-5" onPress={() => setOverlayVisible(false)}>
                        <Ionicons name="close" size={30} color="white" />
                    </TouchableOpacity>
                </View>
            )}

            <TouchableOpacity
                className="absolute z-10 left-4 bg-white/80 rounded-full p-2"
                style={{ top: insets.top + 8 }}
                onPress={() => router.back()}
            >
                <Ionicons name="arrow-back" size={22} color="#764534" />
            </TouchableOpacity>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
                showsVerticalScrollIndicator={false}
            >
                <View className="bg-white items-center px-8 pb-6" style={{ paddingTop: insets.top + 52 }}>
                    {productData.image_url ? (
                        <Image
                            source={{ uri: productData.image_url }}
                            className="w-full rounded-2xl"
                            style={{ height: 260 }}
                            resizeMode="contain"
                        />
                    ) : (
                        <View className="w-full h-56 rounded-2xl bg-[#F0E8DC] items-center justify-center">
                            <Text className="text-6xl">🛒</Text>
                        </View>
                    )}
                </View>

                <View className="px-5 pt-5 gap-4">

                    <View>
                        <Text className="text-2xl font-extrabold text-[#3D2314] leading-tight">
                            {productData.product_name || 'Neznámý produkt'}
                        </Text>
                        {productData.brands && (
                            <Text className="text-sm text-[#A08070] mt-1">{productData.brands}</Text>
                        )}
                        <View className="flex-row flex-wrap gap-2 mt-3">
                            {productData.quantity && (
                                <View className="bg-white border border-[#E0D4C4] rounded-full px-3 py-1.5 flex-row items-center gap-1">
                                    <Image source={icons.box} className="w-4 h-4" resizeMode="contain" />
                                    <Text className="text-xs text-[#5C4033] font-medium">{productData.quantity}</Text>
                                </View>
                            )}
                            {hasAllergen !== null && !loginRequired && (
                                <View className={`rounded-full px-3 py-1.5 flex-row items-center gap-1 ${hasAllergen ? 'bg-red-100' : 'bg-green-100'}`}>
                                    <Text className="text-xs">{hasAllergen ? '⚠️' : '✅'}</Text>
                                    <Text className={`text-xs font-bold ${hasAllergen ? 'text-red-600' : 'text-green-700'}`}>
                                        {hasAllergen ? 'Obsahuje vaše alergeny' : 'Bezpečné pro vás'}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {nutriGrade && nutriCfg && (
                        <View className="bg-white rounded-2xl p-4 border border-[#EDE3D6]">
                            <Text className="text-base font-bold text-[#3D2314] mb-3">Nutri-Score</Text>
                            <View className="flex-row items-center justify-between">
                                <NutriScoreBar grade={nutriGrade} />
                                <View className="rounded-xl px-3 py-1.5 ml-3" style={{ backgroundColor: nutriCfg.bg }}>
                                    <Text style={{ color: nutriCfg.text }} className="text-xs font-bold">
                                        {nutriCfg.label}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    <View className="bg-white rounded-2xl p-4 border border-[#EDE3D6]">
                        <Text className="text-base font-bold text-[#3D2314] mb-3">Složení</Text>
                        <Text className="text-sm text-[#5C4033] leading-5">{ingredients}</Text>
                    </View>

                    {/* ── Pouze nalezené alergeny ───────────────────────────── */}
                    {foundAllergens.length > 0 && (
                        <View className="bg-red-50 border border-red-200 rounded-2xl p-4">
                            <Text className="text-sm font-bold text-red-700 mb-2">⚠️ Vaše alergeny v tomto produktu</Text>
                            <View className="flex-row flex-wrap gap-2">
                                {foundAllergens.map(a => (
                                    <View key={a} className="bg-red-100 rounded-full px-3 py-1">
                                        <Text className="text-xs font-semibold text-red-700">{a}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {productData.nutriments && (
                        <View className="bg-white rounded-2xl border border-[#EDE3D6] overflow-hidden mb-2">
                            <View className="px-4 py-3 border-b border-[#F0E8DC]">
                                <Text className="text-base font-bold text-[#3D2314]">Nutriční hodnoty</Text>
                                <Text className="text-xs text-[#A08070] mt-0.5">na 100 g / 100 ml</Text>
                            </View>
                            <View className="px-4 pb-2">
                                <NutriRow
                                    label="Energetická hodnota"
                                    value={n.energy_kcal_100g ?? (n.energy_100g ? Math.round(n.energy_100g / 4.184) : undefined)}
                                    unit="kcal" bold
                                />
                                <NutriRow label="Tuky" value={n.fat_100g} unit="g" bold />
                                <NutriRow label="z toho nasycené mastné kyseliny" value={n['saturated-fat_100g']} unit="g" />
                                <NutriRow label="Sacharidy" value={n.carbohydrates_100g} unit="g" bold />
                                <NutriRow label="z toho cukry" value={n.sugars_100g} unit="g" />
                                <NutriRow label="Vláknina" value={n.fiber_100g} unit="g" bold />
                                <NutriRow label="Bílkoviny" value={n.proteins_100g} unit="g" bold />
                                <NutriRow label="Sůl" value={n.salt_100g} unit="g" bold />
                            </View>
                        </View>
                    )}

                </View>
            </ScrollView>
        </View>
    );
}

async function fetchProduct(id: string, token: string | null): Promise<ProductData | null> {
    try {
        const res = await fetch(
            `https://world.openfoodfacts.org/api/v2/product/${id}?fields=product_name,image_url,ingredients_text,ingredients_text_cz,ingredients_text_en,ingredients_text_de,ingredients_text_fr,ingredients_text_pl,ingredients_text_sk,brands,quantity,nutriscore_grade,nutriments`
        );
        const data = await res.json();
        const product = data.product ?? null;
        if (token) {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 4000);
            fetch(`${API_BASE_URL}/api/products/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
                signal: controller.signal,
            })
                .then(() => clearTimeout(timeout))
                .catch(() => clearTimeout(timeout));
        }
        return product;
    } catch (err) {
        console.error('Chyba při načítání produktu z OFF:', err);
        return null;
    }
}

async function fetchAllergens(token: string): Promise<string[] | null> {
    try {
        const res = await fetch(`${API_BASE_URL}/api/users/allergens`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}