import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { useAuth } from '@/context/authContext';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from "@/config/api";

const allAllergens = [
    { name: 'Lepek',     emoji: '🌾' },
    { name: 'Mléko',    emoji: '🥛' },
    { name: 'Ořechy',   emoji: '🥜' },
    { name: 'Sója',     emoji: '🫘' },
    { name: 'Vejce',    emoji: '🥚' },
    { name: 'Ryby',     emoji: '🐟' },
    { name: 'Celer',    emoji: '🥬' },
    { name: 'Hořčice',  emoji: '🌿' },
    { name: 'Sezam',    emoji: '🌱' },
    { name: 'Skořápky', emoji: '🦐' },
];

const allergenIdMap: { [key: string]: number } = {
    Lepek: 1, Mléko: 2, Ořechy: 3, Sója: 4, Vejce: 5,
    Ryby: 6, Celer: 7, Hořčice: 8, Sezam: 9, Skořápky: 10,
};

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function FavScreen() {
    const { isLoggedIn } = useAuth();
    const router = useRouter();
    const [selected, setSelected] = useState<string[]>([]);
    const [search, setSearch] = useState('');
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!isLoggedIn) return;
        (async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (!token) return;
                const res = await fetch(`${API_BASE_URL}/api/users/allergens`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error();
                setSelected(await res.json());
            } catch {
                console.error('Chyba při načítání alergenů');
            }
        })();
    }, [isLoggedIn]);

    const persistAllergens = useCallback(async (names: string[]) => {
        try {
            setSaveStatus('saving');
            const token = await AsyncStorage.getItem('token');
            if (!token) throw new Error('Uživatel není přihlášen');

            const allergenIds = names.map(n => allergenIdMap[n]).filter(Boolean);
            const email = getEmailFromToken(token);

            const res = await fetch(`${API_BASE_URL}/api/users/allergens`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ email, allergenIds }),
            });
            if (!res.ok) throw new Error();
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch {
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    }, []);

    const toggleAllergen = (name: string) => {
        setSelected(prev => {
            const next = prev.includes(name)
                ? prev.filter(i => i !== name)
                : [...prev, name];
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => persistAllergens(next), 800);
            return next;
        });
    };

    const getEmailFromToken = (token: string): string => {
        try {
            const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            const payload = decodeURIComponent(
                atob(base64).split('').map(c =>
                    `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`
                ).join('')
            );
            return JSON.parse(payload).sub;
        } catch { return ''; }
    };

    const filtered = allAllergens.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase())
    );

    const pluralize = (n: number) => {
        if (n === 1) return 'alergen vybrán';
        if (n < 5)  return 'alergeny vybrány';
        return 'alergenů vybráno';
    };

    // ── not logged in ───────────────────────────────────────────────────────
    if (!isLoggedIn) {
        return (
            <View className="flex-1 items-center justify-center px-8 bg-[#F5EFE6]">
                <Text className="text-5xl mb-4">🔒</Text>
                <Text className="text-lg text-[#5C4033] text-center mb-6 leading-6">
                    Pro úpravu alergenů se musíte přihlásit.
                </Text>
                <TouchableOpacity
                    className="bg-[#764534] px-8 py-4 rounded-xl"
                    onPress={() => router.replace('/(tabs)/profile')}
                >
                    <Text className="text-[#F5EFE6] text-base font-bold">
                        Přejít na přihlášení
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ── status pill config ──────────────────────────────────────────────────
    const pillConfig: Record<SaveStatus, { label: string; bg: string } | null> = {
        idle:   null,
        saving: { label: 'Ukládám…',             bg: 'bg-[#A0845C]' },
        saved:  { label: '✓ Uloženo',             bg: 'bg-[#5A8A5A]' },
        error:  { label: '✗ Chyba při ukládání',  bg: 'bg-red-600'   },
    };
    const pill = pillConfig[saveStatus];

    return (
        <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                className="flex-1 bg-[#F5EFE6]"
                contentContainerClassName="px-5 pt-4 pb-16"
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View className="mb-5">
                    <Text className="text-3xl font-extrabold text-[#764534] tracking-tight">
                        Moje alergeny
                    </Text>
                    <Text className="text-sm text-[#A08070] mt-1">
                        Klepni na alergen — uloží se automaticky
                    </Text>

                    {pill && (
                        <View className={`flex-row items-center self-start mt-2 px-3 py-1 rounded-full ${pill.bg}`}>
                            {saveStatus === 'saving' && (
                                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />
                            )}
                            <Text className="text-white text-xs font-semibold">{pill.label}</Text>
                        </View>
                    )}
                </View>

                {/* Search */}
                <View className="flex-row items-center bg-white rounded-xl border border-[#D4C4B0] px-3 mb-4">
                    <Text className="text-base mr-2">🔍</Text>
                    <TextInput
                        placeholder="Hledej alergen…"
                        placeholderTextColor="#A09080"
                        value={search}
                        onChangeText={setSearch}
                        className="flex-1 py-3 text-base text-gray-800"
                    />
                </View>

                {/* Count badge */}
                {selected.length > 0 && (
                    <View className="self-start bg-[#764534] px-3 py-1 rounded-full mb-4">
                        <Text className="text-[#F5EFE6] text-xs font-semibold">
                            {selected.length} {pluralize(selected.length)}
                        </Text>
                    </View>
                )}

                {/* Allergen chip grid */}
                <View className="flex-row flex-wrap gap-2.5">
                    {filtered.map((item) => {
                        const isSelected = selected.includes(item.name);
                        return (
                            <TouchableOpacity
                                key={item.name}
                                onPress={() => toggleAllergen(item.name)}
                                activeOpacity={0.75}
                                className={`flex-row items-center rounded-full px-4 py-2.5 border-2 gap-1.5 ${
                                    isSelected
                                        ? 'bg-[#764534] border-[#764534]'
                                        : 'bg-[#EDE3D6] border-[#C8B8A2]'
                                }`}
                            >
                                <Text className="text-base">{item.emoji}</Text>
                                <Text className={`text-sm font-semibold ${
                                    isSelected ? 'text-[#F5EFE6]' : 'text-[#5C4033]'
                                }`}>
                                    {item.name}
                                </Text>
                                {isSelected && (
                                    <Text className="text-[#F5EFE6] text-xs font-extrabold">✓</Text>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Empty state */}
                {filtered.length === 0 && (
                    <Text className="text-center text-[#A08070] mt-8 text-base">
                        Žádný výsledek pro „{search}"
                    </Text>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}