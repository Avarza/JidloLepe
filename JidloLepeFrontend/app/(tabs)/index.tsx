import { Text, View, ScrollView, Image, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
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
    allergens?: string[]; // list of allergen names on the product
}

// Maps allergen names to emoji for quick visual badges
const allergenEmoji: Record<string, string> = {
    Lepek: '🌾', Mléko: '🥛', Ořechy: '🥜', Sója: '🫘',
    Vejce: '🥚', Ryby: '🐟', Celer: '🥬', Hořčice: '🌿',
    Sezam: '🌱', Skořápky: '🦐',
};

// Returns allergens on a product that the user is allergic to
function getDangerousAllergens(product: Product, userAllergens: string[]): string[] {
    if (!product.allergens || userAllergens.length === 0) return [];
    return product.allergens.filter(a => userAllergens.includes(a));
}

// ── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
    const shimmer = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
                Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
            ])
        ).start();
    }, []);
    const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });
    return (
        <Animated.View style={{ opacity }} className="bg-white p-4 rounded-2xl w-48 mr-4">
            <View style={{ height: 140 }} className="w-full rounded-xl mb-2 bg-[#E8DFD0]" />
            <View className="h-3 rounded bg-[#E8DFD0] w-3/4 mb-1" />
            <View className="h-3 rounded bg-[#E8DFD0] w-1/2" />
        </Animated.View>
    );
}

// ── Product card ─────────────────────────────────────────────────────────────
function ProductCard({
                         product,
                         userAllergens,
                         onPress,
                     }: {
    product: Product;
    userAllergens: string[];
    onPress: () => void;
}) {
    const dangerous = getDangerousAllergens(product, userAllergens);
    const hasWarning = dangerous.length > 0;

    return (
        <Pressable onPress={onPress}>
            <View
                className={`p-4 rounded-2xl w-48 border-2 ${hasWarning ? 'bg-red-50 border-red-300' : 'bg-white border-transparent'}`}
                style={{ height: 270 }}
            >
                {/* Warning banner — fixed height so cards without it still align */}
                <View className="h-7 mb-2 justify-center">
                    {hasWarning && (
                        <View className="bg-red-500 rounded-lg px-2 py-1 self-start flex-row items-center">
                            <Text className="text-white text-xs font-bold">⚠️ Alergen</Text>
                        </View>
                    )}
                </View>

                {product.image_front_url ? (
                    <Image
                        source={{ uri: product.image_front_url }}
                        className="w-full rounded-xl mb-2"
                        style={{ height: 140 }}
                        resizeMode="contain"
                    />
                ) : (
                    <View className="w-full rounded-xl mb-2 bg-[#F0E8DC] items-center justify-center" style={{ height: 140 }}>
                        <Text className="text-4xl">🛒</Text>
                    </View>
                )}

                {/* Name — always 2 lines worth of space */}
                <Text
                    className="font-semibold text-[#3D2314] text-sm flex-1"
                    numberOfLines={2}
                    ellipsizeMode="tail"
                >
                    {product.product_name || 'Bez názvu'}
                </Text>

                {/* Allergen emoji badges pinned to bottom */}
                <View className="flex-row flex-wrap gap-1 mt-1" style={{ minHeight: 20 }}>
                    {hasWarning && dangerous.map(a => (
                        <View key={a} className="bg-red-100 rounded-full px-1.5 py-0.5">
                            <Text className="text-xs">{allergenEmoji[a] ?? '⚠️'} {a}</Text>
                        </View>
                    ))}
                </View>
            </View>
        </Pressable>
    );
}

// ── Allergen chip ─────────────────────────────────────────────────────────────
function AllergenChip({ name }: { name: string }) {
    return (
        <View className="flex-row items-center bg-[#764534] rounded-full px-3 py-1 mr-2 mb-2">
            <Text className="text-white text-xs font-semibold">
                {allergenEmoji[name] ?? '⚠️'} {name}
            </Text>
        </View>
    );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function Home() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { isLoggedIn } = useAuth();

    const [products, setProducts] = useState<Product[]>([]);
    const [recommended, setRecommended] = useState<Product[]>([]);
    const [recent, setRecent] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingRecommended, setLoadingRecommended] = useState(true);
    const [userAllergens, setUserAllergens] = useState<string[]>([]);

    // Pulse animation for scan button
    const pulse = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1.04, duration: 800, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/products/`);
                const data = await res.json();
                if (data.products) setProducts(data.products);
            } catch (e) {
                console.error('Chyba při načítání produktů:', e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            const stored = await AsyncStorage.getItem("recent_products");
            if (stored) setRecent(JSON.parse(stored));
        })();
    }, []);

    // Fetch random popular products from Open Food Facts
    useEffect(() => {
        (async () => {
            try {
                // Use a random page (1–50) of popular products for variety each visit
                const randomPage = Math.floor(Math.random() * 50) + 1;
                const url =
                    `https://world.openfoodfacts.org/api/v2/search` +
                    `?sort_by=unique_scans_n` +
                    `&page=${randomPage}` +
                    `&page_size=10` +
                    `&fields=code,product_name,image_front_url,allergens_tags` +
                    `&countries_tags=en:czechia`;   // bias toward Czech products; remove if you want global

                const res = await fetch(url, {
                    headers: { 'User-Agent': 'AllergenChecker/1.0 (your@email.com)' },
                });
                const data = await res.json();

                if (data.products) {
                    // Normalise allergens_tags ("en:gluten" → "Lepek") using a lookup
                    const tagToName: Record<string, string> = {
                        'en:gluten': 'Lepek',
                        'en:milk': 'Mléko',
                        'en:nuts': 'Ořechy',
                        'en:soybeans': 'Sója',
                        'en:eggs': 'Vejce',
                        'en:fish': 'Ryby',
                        'en:celery': 'Celer',
                        'en:mustard': 'Hořčice',
                        'en:sesame-seeds': 'Sezam',
                        'en:crustaceans': 'Skořápky',
                    };

                    const normalised: Product[] = data.products
                        .filter((p: any) => p.product_name && p.image_front_url)
                        .map((p: any) => ({
                            code: p.code,
                            product_name: p.product_name,
                            image_front_url: p.image_front_url,
                            allergens: (p.allergens_tags ?? [])
                                .map((tag: string) => tagToName[tag])
                                .filter(Boolean),
                        }));

                    setRecommended(normalised);
                }
            } catch (e) {
                console.error('Chyba při načítání doporučených produktů:', e);
            } finally {
                setLoadingRecommended(false);
            }
        })();
    }, []);

    useEffect(() => {
        if (!isLoggedIn) return;
        (async () => {
            const token = await AsyncStorage.getItem("token");
            if (!token) return;
            const res = await fetch(`${API_BASE_URL}/api/users/allergens`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setUserAllergens(await res.json());
        })();
    }, [isLoggedIn]);

    // Count how many recommended products contain user allergens
    const warningCount = recommended.filter(
        p => getDangerousAllergens(p, userAllergens).length > 0
    ).length;

    return (
        <ScrollView
            className="flex-1 bg-[#F5EFE6]"
            contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingTop: insets.top + 16 }}
            showsVerticalScrollIndicator={false}
        >
            <View className="px-5">
                {/* Logo + greeting */}
                <View className="flex-row items-center justify-center mb-5">
                    <Image source={icons.logo} className="w-12 h-10" />
                </View>

                {/* Search */}
                <SearchBar
                    onPress={() => router.push("/(tabs)/search")}
                    placeholder="Hledej produkty…"
                />

                {/* Scan button — animated pulse */}
                <Animated.View className="mt-4">
                    <Pressable
                        onPress={() => router.push("/scan")}
                        className="bg-[#764534] p-4 rounded-2xl items-center flex-row justify-center gap-3"
                    >
                        <Image source={icons.camera} className="w-8 h-8" resizeMode="contain" />
                        <View>
                            <Text className="text-white font-bold text-base">Skenovat produkt</Text>
                            <Text className="text-white/60 text-xs">Naskenujte čárový kód</Text>
                        </View>
                    </Pressable>
                </Animated.View>

                {/* Allergen warning summary banner */}
                {isLoggedIn && userAllergens.length > 0 && warningCount > 0 && (
                    <View className="mt-4 bg-red-50 border border-red-200 rounded-2xl p-4 flex-row items-start gap-3">
                        <Text className="text-2xl">⚠️</Text>
                        <View className="flex-1">
                            <Text className="font-bold text-red-700 text-sm">Pozor na alergeny!</Text>
                            <Text className="text-red-600 text-xs mt-0.5">
                                {warningCount} z doporučených produktů obsahuje vaše alergeny.
                            </Text>
                        </View>
                    </View>
                )}

                {/* My allergens */}
                {isLoggedIn && (
                    <View className="mt-6 bg-white rounded-2xl p-4 border border-[#E8DFD0]">
                        <View className="flex-row items-center justify-between mb-3">
                            <Text className="font-bold text-[#3D2314] text-base">Moje alergeny</Text>
                            <Pressable onPress={() => router.push("/(tabs)/fav")}>
                                <Text className="text-[#764534] text-xs font-semibold">Upravit →</Text>
                            </Pressable>
                        </View>
                        {userAllergens.length > 0 ? (
                            <View className="flex-row flex-wrap">
                                {userAllergens.map(a => <AllergenChip key={a} name={a} />)}
                            </View>
                        ) : (
                            <Text className="text-[#A08070] text-sm">
                                Nemáš uložené žádné alergeny.
                            </Text>
                        )}
                    </View>
                )}
            </View>

            {/* Recommended products */}
            <View className="mt-10">
                <Text className="text-xl font-bold text-[#3D2314] px-5 mb-4">
                    Doporučené produkty
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-5 gap-4">
                    {loadingRecommended
                        ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                        : recommended.map(p => (
                            <ProductCard
                                key={p.code}
                                product={p}
                                userAllergens={userAllergens}
                                onPress={() => router.push({ pathname: '/Product/[id]', params: { id: p.code } })}
                            />
                        ))
                    }
                </ScrollView>
            </View>

            {/* Recently viewed */}
            {recent.length > 0 && (
                <View className="mt-8">
                    <Text className="text-xl font-bold text-[#3D2314] px-5 mb-3">
                        Naposledy prohlížené
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-5">
                        {recent.map(p => (
                            <ProductCard
                                key={p.code}
                                product={p}
                                userAllergens={userAllergens}
                                onPress={() => router.push({ pathname: '/Product/[id]', params: { id: p.code } })}
                            />
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Stats */}
            <View className="mx-5 mt-8 bg-white rounded-2xl p-4 border border-[#E8DFD0]">
                <Text className="font-bold text-[#3D2314] text-base mb-3">Statistiky</Text>
                <View className="gap-2">
                    <View className="flex-row items-center gap-2">
                        <Image source={icons.box} className="w-4 h-4" resizeMode="contain" />
                        <Text className="text-[#5C4033] text-sm">
                            Produktů v databázi: <Text className="font-bold">{products.length}</Text>
                        </Text>
                    </View>
                    {recent.length > 0 && (
                        <View className="flex-row items-center gap-2">
                            <Text className="text-lg">🕒</Text>
                            <Text className="text-[#5C4033] text-sm">
                                Zkontrolované produkty: <Text className="font-bold">{recent.length}</Text>
                            </Text>
                        </View>
                    )}
                    {userAllergens.length > 0 && (
                        <View className="flex-row items-center gap-2">
                            <Image source={icons.error} className="w-4 h-4" resizeMode="contain" />
                            <Text className="text-[#5C4033] text-sm">
                                Sledované alergeny: <Text className="font-bold">{userAllergens.length}</Text>
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </ScrollView>
    );
}