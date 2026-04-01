import { Text, View, ScrollView, Image, Pressable, Animated, AppState } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useEffect, useState, useRef, useCallback } from 'react';
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
    allergens?: string[];
}

const allergenEmoji: Record<string, string> = {
    'Lepek':             '🌾',
    'Korýši':            '🦐',
    'Vejce':             '🥚',
    'Ryby':              '🐟',
    'Arašídy':           '🥜',
    'Sója':              '🫘',
    'Mléko':             '🥛',
    'Skořápkové ořechy': '🌰',
    'Celer':             '🥬',
    'Hořčice':           '🌿',
    'Sezam':             '🌱',
    'Oxid siřičitý':     '🧪',
    'Vlčí bob':          '🌸',
    'Měkkýši':           '🐚',
};

const tagToName: Record<string, string> = {
    'en:gluten':          'Lepek',
    'en:wheat':           'Lepek',
    'en:rye':             'Lepek',
    'en:barley':          'Lepek',
    'en:oats':            'Lepek',
    'en:crustaceans':     'Korýši',
    'en:crustacean':      'Korýši',
    'en:eggs':            'Vejce',
    'en:egg':             'Vejce',
    'en:fish':            'Ryby',
    'en:peanuts':         'Arašídy',
    'en:peanut':          'Arašídy',
    'en:soybeans':        'Sója',
    'en:soya':            'Sója',
    'en:soy':             'Sója',
    'en:milk':            'Mléko',
    'en:lactose':         'Mléko',
    'en:nuts':            'Skořápkové ořechy',
    'en:almonds':         'Skořápkové ořechy',
    'en:hazelnuts':       'Skořápkové ořechy',
    'en:walnuts':         'Skořápkové ořechy',
    'en:cashews':         'Skořápkové ořechy',
    'en:pecans':          'Skořápkové ořechy',
    'en:brazil-nuts':     'Skořápkové ořechy',
    'en:pistachios':      'Skořápkové ořechy',
    'en:macadamia-nuts':  'Skořápkové ořechy',
    'en:celery':          'Celer',
    'en:mustard':         'Hořčice',
    'en:sesame-seeds':    'Sezam',
    'en:sesame':          'Sezam',
    'en:sulphur-dioxide': 'Oxid siřičitý',
    'en:sulphites':       'Oxid siřičitý',
    'en:sulfites':        'Oxid siřičitý',
    'en:lupin':           'Vlčí bob',
    'en:molluscs':        'Měkkýši',
    'en:mollusks':        'Měkkýši',
};

const CACHE_KEY = 'recommended_cache';
const CACHE_TTL = 60 * 60 * 1000;

function getDangerousAllergens(product: Product, userAllergens: string[]): string[] {
    if (!product.allergens || userAllergens.length === 0) return [];
    return product.allergens.filter(a => userAllergens.includes(a));
}

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

function ProductCard({
                         product,
                         userAllergens,
                         onPress,
                     }: {
    product: Product;
    userAllergens: string[];
    onPress: () => void;
}) {
    const dangerous = [...new Set(getDangerousAllergens(product, userAllergens))];
    const hasWarning = dangerous.length > 0;

    return (
        <Pressable onPress={onPress}>
            <View
                className={`p-4 rounded-2xl w-48 border-2 ${hasWarning ? 'bg-red-50 border-red-300' : 'bg-white border-transparent'}`}
                style={{ height: 270 }}
            >
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

                <Text
                    className="font-semibold text-[#3D2314] text-sm flex-1"
                    numberOfLines={2}
                    ellipsizeMode="tail"
                >
                    {product.product_name || 'Bez názvu'}
                </Text>

                <View className="flex-row flex-wrap gap-1 mt-1" style={{ minHeight: 20 }}>
                    {hasWarning && dangerous.map((a, i) => (
                        <View key={`${a}-${i}`} className="bg-red-100 rounded-full px-1.5 py-0.5">
                            <Text className="text-xs">{allergenEmoji[a] ?? '⚠️'} {a}</Text>
                        </View>
                    ))}
                </View>
            </View>
        </Pressable>
    );
}

function AllergenChip({ name }: { name: string }) {
    return (
        <View className="flex-row items-center bg-[#764534] rounded-full px-3 py-1 mr-2 mb-2">
            <Text className="text-white text-xs font-semibold">
                {allergenEmoji[name] ?? '⚠️'} {name}
            </Text>
        </View>
    );
}

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

    const pulse = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1.04, duration: 800, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    // ── Produkty z backendu ───────────────────────────────────────────────────
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

    // ── Naposledy prohlížené ──────────────────────────────────────────────────
    useEffect(() => {
        (async () => {
            const stored = await AsyncStorage.getItem("recent_products");
            if (stored) setRecent(JSON.parse(stored));
        })();
    }, []);

    // ── Doporučené produkty z OFF (s cache 1 hodina) ──────────────────────────
    useEffect(() => {
        (async () => {
            try {
                const cached = await AsyncStorage.getItem(CACHE_KEY);
                if (cached) {
                    const { data, ts } = JSON.parse(cached);
                    if (Date.now() - ts < CACHE_TTL) {
                        setRecommended(data);
                        setLoadingRecommended(false);
                        return;
                    }
                }

                const randomPage = Math.floor(Math.random() * 50) + 1;
                const url = `${API_BASE_URL}/api/products/recommended?page=${randomPage}`;
                const res = await fetch(url);

                const text = await res.text();
                if (!text.trim().startsWith('{') && !text.trim().startsWith('[')) {
                    console.warn('OFF API vrátilo neplatnou odpověď (rate limit?)');
                    return;
                }

                const data = JSON.parse(text);
                if (data.products) {
                    const normalised: Product[] = data.products
                        .filter((p: any) => p.product_name && p.image_front_url)
                        .map((p: any) => ({
                            code: p.code,
                            product_name: p.product_name,
                            image_front_url: p.image_front_url,
                            allergens: [...new Set(
                                (p.allergens_tags ?? [])
                                    .map((tag: string) => tagToName[tag])
                                    .filter(Boolean)
                            )] as string[],
                        }));

                    setRecommended(normalised);
                    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
                        data: normalised,
                        ts: Date.now(),
                    }));
                }
            } catch (e) {
                console.error('Chyba při načítání doporučených produktů:', e);
            } finally {
                setLoadingRecommended(false);
            }
        })();
    }, []);

    // ── Načítání alergenů ─────────────────────────────────────────────────────
    const fetchUserAllergens = useCallback(async () => {
        if (!isLoggedIn) { setUserAllergens([]); return; }
        const token = await AsyncStorage.getItem("token");
        if (!token) { setUserAllergens([]); return; }
        try {
            const res = await fetch(`${API_BASE_URL}/api/users/allergens`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setUserAllergens(await res.json());
        } catch {
            console.error('Chyba při načítání alergenů');
        }
    }, [isLoggedIn]);

    // Spustí se pokaždé když uživatel přepne na tento tab
    useFocusEffect(
        useCallback(() => {
            fetchUserAllergens();
        }, [fetchUserAllergens])
    );

    // Spustí se při návratu aplikace do popředí
    useEffect(() => {
        const sub = AppState.addEventListener("change", state => {
            if (state === "active") fetchUserAllergens();
        });
        return () => sub.remove();
    }, [fetchUserAllergens]);

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
                <View className="flex-row items-center justify-center mb-5">
                    <Image source={icons.logo} className="w-32 mt-2 mx-auto" resizeMode="contain" />
                </View>

                <SearchBar
                    onPress={() => router.push("/(tabs)/search")}
                    placeholder="Hledej produkty…"
                />

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

            <View className="mt-10">
                <Text className="text-xl font-bold text-[#3D2314] px-5 mb-4">
                    Doporučené produkty
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-5 gap-4">
                    {loadingRecommended
                        ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                        : recommended.length > 0
                            ? recommended.map((p, i) => (
                                <ProductCard
                                    key={`${p.code}-${i}`}
                                    product={p}
                                    userAllergens={userAllergens}
                                    onPress={() => router.push({ pathname: '/Product/[id]', params: { id: p.code } })}
                                />
                            ))
                            : (
                                <View className="w-64 items-center justify-center py-8">
                                    <Text className="text-[#A08070] text-sm text-center">
                                        Doporučené produkty se nepodařilo načíst.{'\n'}Zkuste to znovu později.
                                    </Text>
                                </View>
                            )
                    }
                </ScrollView>
            </View>

            {recent.length > 0 && (
                <View className="mt-8">
                    <Text className="text-xl font-bold text-[#3D2314] px-5 mb-3">
                        Naposledy prohlížené
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-5">
                        {recent.map((p, i) => (
                            <ProductCard
                                key={`${p.code}-recent-${i}`}
                                product={p}
                                userAllergens={userAllergens}
                                onPress={() => router.push({ pathname: '/Product/[id]', params: { id: p.code } })}
                            />
                        ))}
                    </ScrollView>
                </View>
            )}

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
