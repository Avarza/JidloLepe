import { View, Text, ScrollView, Image, TextInput, Pressable, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import icons from "@/constants/icons";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE_URL } from "@/config/api";

interface Product {
    code: string;
    product_name: string;
    image_front_url?: string;
}

// ── Skeleton row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
    return (
        <View className="flex-row items-center bg-white rounded-2xl p-3 mb-3 gap-3">
            <View className="w-16 h-16 rounded-xl bg-[#E8DFD0]" />
            <View className="flex-1 gap-2">
                <View className="h-3.5 rounded bg-[#E8DFD0] w-3/4" />
                <View className="h-3 rounded bg-[#E8DFD0] w-1/2" />
            </View>
        </View>
    );
}

// ── Product row card ──────────────────────────────────────────────────────────
function ProductRow({ product, onPress }: { product: Product; onPress: () => void }) {
    return (
        <Pressable onPress={onPress}>
            {({ pressed }) => (
                <View
                    className="flex-row items-center bg-white rounded-2xl p-3 mb-3 border border-[#EDE3D6]"
                    style={{ opacity: pressed ? 0.75 : 1 }}
                >
                    {product.image_front_url ? (
                        <Image
                            source={{ uri: product.image_front_url }}
                            className="w-16 h-16 rounded-xl mr-3"
                            resizeMode="contain"
                        />
                    ) : (
                        <View className="w-16 h-16 rounded-xl mr-3 bg-[#F0E8DC] items-center justify-center">
                            <Text className="text-2xl">🛒</Text>
                        </View>
                    )}
                    <View className="flex-1">
                        <Text className="text-[#3D2314] font-semibold text-sm" numberOfLines={2}>
                            {product.product_name || 'Bez názvu'}
                        </Text>
                        <Text className="text-[#A08070] text-xs mt-1">#{product.code}</Text>
                    </View>
                    <Text className="text-[#C8B8A2] text-lg ml-2">›</Text>
                </View>
            )}
        </Pressable>
    );
}

const Search = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const inputRef = useRef<TextInput>(null);

    // 🔥 FIXES
    const isFetchingRef = useRef(false);
    const searchCache = useRef<Record<string, Product[]>>({});

    const [query, setQuery] = useState('');
    const [randomProducts, setRandomProducts] = useState<Product[]>([]);
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [searched, setSearched] = useState(false);

    // ── Load backend products ────────────────────────────────────────────────
    useEffect(() => {
        (async () => {
            try {
                let loaded = false;

                // OFF byva nestabilni na nekterych pages, proto zkusime vice pokusu.
                for (let i = 0; i < 5 && !loaded; i++) {
                    const randomPage = Math.floor(Math.random() * 50) + 1;
                    const res = await fetch(`${API_BASE_URL}/api/products/recommended?page=${randomPage}`);
                    if (!res.ok) continue;

                    const data = await res.json();
                    const products = (data.products ?? []).filter((p: Product) => p.code);
                    if (products.length > 0) {
                        setRandomProducts(products);
                        loaded = true;
                    }
                }

                // Nouzovy fallback, aby search page nebyla prazdna.
                if (!loaded) {
                    const fallbackRes = await fetch(`${API_BASE_URL}/api/products/snacks`);
                    if (fallbackRes.ok) {
                        const fallbackData = await fallbackRes.json();
                        const fallbackProducts = (fallbackData.products ?? []).filter((p: Product) => p.code);
                        setRandomProducts(fallbackProducts);
                    }
                }
            } catch (e) {
                console.error('Chyba při načítání náhodných produktů:', e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // ── SEARCH ───────────────────────────────────────────────────────────────
    const handleSearch = async () => {
        if (!query.trim()) return;

        // 🚫 zabrání spam klikům
        if (isFetchingRef.current) return;

        // 🧠 cache
        if (searchCache.current[query]) {
            setSearchResults(searchCache.current[query]);
            setSearched(true);
            return;
        }

        isFetchingRef.current = true;

        inputRef.current?.blur();
        setSearching(true);
        setSearchResults([]);
        setSearched(true);

        try {
            const url = `${API_BASE_URL}/api/products/search?query=${encodeURIComponent(query)}`;
            const res = await fetch(url);

            const text = await res.text();

            // 🔍 debug (klidně nech)
            console.log('STATUS:', res.status);
            console.log('RAW:', text.slice(0, 100));

            // 🛡️ ochrana proti HTML / špatné odpovědi
            if (!text || text.startsWith('<')) {
                console.warn('OFF vrátil HTML nebo prázdno');
                return;
            }

            const data = JSON.parse(text);
            const products = data.products || [];

            // 🧠 cache
            searchCache.current[query] = products;

            setSearchResults(products);
        } catch (e) {
            console.error('Chyba při hledání:', e);
        } finally {
            setSearching(false);
            isFetchingRef.current = false;
        }
    };

    const clearSearch = () => {
        setQuery('');
        setSearchResults([]);
        setSearched(false);
    };

    const showRandom = !query && !loading;
    const showResults = !!query;
    const isEmpty = searched && !searching && searchResults.length === 0;

    return (
        <View className="flex-1 bg-[#F5EFE6]">
            {/* ── Header ── */}
            <View className="px-5 pb-4 bg-[#F5EFE6]" style={{ paddingTop: insets.top + 16 }}>
                <Text className="text-2xl font-extrabold text-[#764534] mb-4 tracking-tight">
                    Hledat produkty
                </Text>

                {/* Search input */}
                <View className="flex-row items-center bg-white rounded-2xl border-2 border-[#D4C4B0] px-4 gap-3">
                    <Image source={icons.search} className="w-4 h-4 opacity-40" resizeMode="contain" />
                    <TextInput
                        ref={inputRef}
                        placeholder="Název produktu nebo čárový kód…"
                        placeholderTextColor="#B0A090"
                        value={query}
                        onChangeText={(t) => {
                            setQuery(t);
                            if (!t) clearSearch();
                        }}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                        className="flex-1 py-3.5 text-[#3D2314] text-sm"
                    />
                    {query.length > 0 && (
                        <Pressable onPress={clearSearch} className="p-1">
                            <Text className="text-[#A08070] text-base font-bold">✕</Text>
                        </Pressable>
                    )}
                </View>

                {/* Search button */}
                <Pressable
                    onPress={handleSearch}
                    disabled={searching}
                    style={{ opacity: searching ? 0.6 : 1 }}
                    className="bg-[#764534] rounded-2xl py-3 items-center mt-3"
                >
                    <Text className="text-white font-bold text-sm tracking-wide">Hledat</Text>
                </Pressable>
            </View>

            {/* ── Results ── */}
            <ScrollView
                className="flex-1 px-5"
                contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingTop: 8 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Loading backend */}
                {loading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}

                {/* Searching spinner */}
                {searching && (
                    <View className="items-center mt-10 gap-3">
                        <ActivityIndicator size="large" color="#764534" />
                        <Text className="text-[#A08070] text-sm">Hledám produkty…</Text>
                    </View>
                )}

                {/* Empty state */}
                {isEmpty && (
                    <View className="items-center mt-16 gap-3">
                        <Text className="text-4xl">🔍</Text>
                        <Text className="text-[#3D2314] font-semibold text-base">Nic nenalezeno</Text>
                        <Text className="text-[#A08070] text-sm text-center">
                            Zkuste jiný název nebo naskenujte čárový kód
                        </Text>
                    </View>
                )}

                {/* Section label */}
                {!searching && (showRandom || (showResults && searchResults.length > 0)) && (
                    <Text className="text-xs font-semibold text-[#A08070] uppercase tracking-widest mb-3">
                        {showResults
                            ? `${searchResults.length} výsledků pro „${query}"`
                            : `${randomProducts.length} náhodných produktů`}
                    </Text>
                )}

                {/* Random products */}
                {showRandom &&
                    randomProducts.map(p =>
                        p.code ? (
                            <ProductRow
                                key={p.code}
                                product={p}
                                onPress={() => router.push({ pathname: '/Product/[id]', params: { id: p.code } })}
                            />
                        ) : null
                    )
                }

                {/* Search results */}
                {showResults && !searching &&
                    searchResults.map(p =>
                        p.code ? (
                            <ProductRow
                                key={p.code}
                                product={p}
                                onPress={() => router.push({ pathname: '/Product/[id]', params: { id: p.code } })}
                            />
                        ) : null
                    )
                }
            </ScrollView>
        </View>
    );
};

export default Search;
