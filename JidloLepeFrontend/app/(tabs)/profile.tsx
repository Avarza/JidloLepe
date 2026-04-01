import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, Image, ScrollView,
    TouchableOpacity, Alert, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/authContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import icons from '@/constants/icons';
import { API_BASE_URL } from "@/config/api";

// Deduplicate history by code, keeping most recent occurrence
function deduplicateHistory(items: HistoryProduct[]): HistoryProduct[] {
    const seen = new Set<string>();
    return items.filter(p => {
        if (seen.has(p.code)) return false;
        seen.add(p.code);
        return true;
    });
}

interface HistoryProduct {
    code: string;
    name: string;
    image: string;
}

// ── Small allergen chip ───────────────────────────────────────────────────────
function AllergenChip({ name }: { name: string }) {
    return (
        <View className="bg-[#764534] rounded-full px-3 py-1 mr-2 mb-2">
            <Text className="text-white text-xs font-semibold">{name}</Text>
        </View>
    );
}

// ── Action row button ─────────────────────────────────────────────────────────
function ActionRow({
                       icon, label, onPress, danger,
                   }: {
    icon: any; label: string; onPress: () => void; danger?: boolean;
}) {
    return (
        <TouchableOpacity
            onPress={onPress}
            className={`flex-row items-center px-4 py-3.5 rounded-2xl mb-3 border ${
                danger
                    ? 'bg-red-50 border-red-200'
                    : 'bg-white border-[#EDE3D6]'
            }`}
        >
            <Image
                source={icon}
                style={{ width: 22, height: 22, marginRight: 12, tintColor: danger ? '#DC2626' : '#764534' }}
                resizeMode="contain"
            />
            <Text className={`flex-1 font-semibold text-sm ${danger ? 'text-red-600' : 'text-[#3D2314]'}`}>
                {label}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={danger ? '#DC2626' : '#C8B8A2'} />
        </TouchableOpacity>
    );
}

export default function ProfileTabScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { isLoggedIn, login, logout } = useAuth();

    // Login form
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loggingIn, setLoggingIn] = useState(false);
    const [authTab, setAuthTab] = useState<'login' | 'register'>('login');

    // Register form
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regConfirm, setRegConfirm] = useState('');
    const [registering, setRegistering] = useState(false);

    // Profile data
    const [userEmail, setUserEmail] = useState('');
    const [userAllergens, setUserAllergens] = useState<string[]>([]);
    const [avatarUri, setAvatarUri] = useState<string | null>(null);

    // History
    const [history, setHistory] = useState<HistoryProduct[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    // Change password modal state
    const [showPwForm, setShowPwForm] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPw, setChangingPw] = useState(false);

    // ── Login ─────────────────────────────────────────────────────────────────
    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Chyba', 'Vyplňte email a heslo.');
            return;
        }
        setLoggingIn(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            if (!res.ok) throw new Error((await res.text()) || 'Neplatné přihlašovací údaje');
            const data = await res.json();
            await AsyncStorage.setItem('token', data.token);
            setUserEmail(email);
            login();
        } catch (e: any) {
            Alert.alert('Chyba přihlášení', e.message || 'Neznámá chyba');
        } finally {
            setLoggingIn(false);
        }
    };

    // ── Register ──────────────────────────────────────────────────────────────
    const handleRegister = async () => {
        if (!regEmail.trim() || !regPassword.trim() || !regConfirm.trim()) {
            Alert.alert('Chyba', 'Vyplňte všechna pole.');
            return;
        }
        if (regPassword !== regConfirm) {
            Alert.alert('Chyba', 'Hesla se neshodují.');
            return;
        }
        if (regPassword.length < 6) {
            Alert.alert('Chyba', 'Heslo musí mít alespoň 6 znaků.');
            return;
        }
        setRegistering(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: regEmail, password: regPassword }),
            });
            if (!res.ok) throw new Error((await res.text()) || 'Registrace selhala');
            const data = await res.json();
            await AsyncStorage.setItem('token', data.token);
            setUserEmail(regEmail);
            login();
        } catch (e: any) {
            Alert.alert('Chyba registrace', e.message || 'Neznámá chyba');
        } finally {
            setRegistering(false);
        }
    };

    // ── Logout ────────────────────────────────────────────────────────────────
    const handleLogout = async () => {
        Alert.alert('Odhlásit se', 'Opravdu se chcete odhlásit?', [
            { text: 'Zrušit', style: 'cancel' },
            {
                text: 'Odhlásit', style: 'destructive', onPress: async () => {
                    await AsyncStorage.multiRemove(['token', 'user_allergens']);
                    logout();
                    setEmail('');
                    setPassword('');
                    setUserAllergens([]);
                    setHistory([]);
                    setAvatarUri(null);
                }
            },
        ]);
    };

    // ── Change password ───────────────────────────────────────────────────────
    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            Alert.alert('Chyba', 'Vyplňte všechna pole.');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Chyba', 'Nová hesla se neshodují.');
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert('Chyba', 'Nové heslo musí mít alespoň 6 znaků.');
            return;
        }
        setChangingPw(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api//change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ oldPassword, newPassword }),
            });
            if (!res.ok) throw new Error((await res.text()) || 'Chyba při změně hesla');
            Alert.alert('Hotovo', 'Heslo bylo úspěšně změněno.');
            setShowPwForm(false);
            setOldPassword(''); setNewPassword(''); setConfirmPassword('');
        } catch (e: any) {
            Alert.alert('Chyba', e.message);
        } finally {
            setChangingPw(false);
        }
    };

    // ── Avatar picker ─────────────────────────────────────────────────────────
    const handleChangeAvatar = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Oprávnění', 'Pro výběr fotky potřebujeme přístup k fotogalerii.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'] as any,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            setAvatarUri(result.assets[0].uri);
        }
    };

    // ── Fetch allergens on focus ──────────────────────────────────────────────
    useFocusEffect(
        React.useCallback(() => {
            if (!isLoggedIn) {
                setUserAllergens([]);
                return;
            }
            (async () => {
                try {
                    const token = await AsyncStorage.getItem('token');
                    if (!token) {
                        setUserAllergens([]);
                        return;
                    }
                    const res = await fetch(`${API_BASE_URL}/api/users/allergens`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (!res.ok) throw new Error();
                    setUserAllergens(await res.json());
                } catch (e) {
                    setUserAllergens([]);
                    console.error('Chyba při načítání alergenů:', e);
                }
            })();
        }, [isLoggedIn])
    );

    // ── Fetch scan history from backend ──────────────────────────────────────
    useEffect(() => {
        if (!isLoggedIn) {
            setHistory([]);
            setUserAllergens([]);
            return;
        }
        (async () => {
            setLoadingHistory(true);
            try {
                const token = await AsyncStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/api/users/history`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error();
                const data = await res.json();
                // Expected: [{ code, product_name, image_front_url }]
                setHistory(
                    deduplicateHistory(
                        (data.products ?? data).map((p: any) => ({
                            code: p.code,
                            name: p.product_name ?? p.name,
                            image: p.image_front_url ?? p.image,
                        }))
                    )
                );
            } catch {
                // Fallback: load from AsyncStorage recent_products
                try {
                    const stored = await AsyncStorage.getItem('recent_products');
                    if (stored) {
                        const parsed = JSON.parse(stored);
                        setHistory(deduplicateHistory(parsed.map((p: any) => ({
                            code: p.code,
                            name: p.product_name ?? p.name,
                            image: p.image_front_url ?? p.image ?? '',
                        }))));
                    }
                } catch {}
            } finally {
                setLoadingHistory(false);
            }
        })();
    }, [isLoggedIn]);

    // ── Not logged in ─────────────────────────────────────────────────────────
    if (!isLoggedIn) {
        return (
            <View className="flex-1 bg-[#F5EFE6]" style={{ paddingTop: insets.top }}>
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 28 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Logo */}
                    <Image source={icons.logo} className="w-32 mx-auto mb-6" resizeMode="contain" />

                    {/* Tab switcher */}
                    <View className="flex-row bg-[#EDE3D6] rounded-2xl p-1 mb-8">
                        <TouchableOpacity
                            className={`flex-1 py-2.5 rounded-xl items-center ${authTab === 'login' ? 'bg-white' : ''}`}
                            onPress={() => setAuthTab('login')}
                        >
                            <Text className={`font-bold text-sm ${authTab === 'login' ? 'text-[#764534]' : 'text-[#A08070]'}`}>
                                Přihlášení
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className={`flex-1 py-2.5 rounded-xl items-center ${authTab === 'register' ? 'bg-white' : ''}`}
                            onPress={() => setAuthTab('register')}
                        >
                            <Text className={`font-bold text-sm ${authTab === 'register' ? 'text-[#764534]' : 'text-[#A08070]'}`}>
                                Registrace
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {authTab === 'login' ? (
                        /* ── Login form ── */
                        <View>
                            <Text className="text-2xl font-extrabold text-[#764534] mb-1">Vítejte zpět</Text>
                            <Text className="text-sm text-[#A08070] mb-6">Přihlaste se ke svému účtu</Text>

                            <View className="bg-white rounded-2xl border border-[#EDE3D6] px-4 mb-3 flex-row items-center">
                                <Ionicons name="mail-outline" size={18} color="#A08070" style={{ marginRight: 10 }} />
                                <TextInput
                                    placeholder="Email"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    placeholderTextColor="#B0A090"
                                    className="flex-1 py-4 text-[#3D2314] text-sm"
                                />
                            </View>

                            <View className="bg-white rounded-2xl border border-[#EDE3D6] px-4 mb-6 flex-row items-center">
                                <Ionicons name="lock-closed-outline" size={18} color="#A08070" style={{ marginRight: 10 }} />
                                <TextInput
                                    placeholder="Heslo"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    placeholderTextColor="#B0A090"
                                    className="flex-1 py-4 text-[#3D2314] text-sm"
                                />
                            </View>

                            <TouchableOpacity
                                className="bg-[#764534] rounded-2xl py-4 items-center"
                                onPress={handleLogin}
                                disabled={loggingIn}
                            >
                                {loggingIn
                                    ? <ActivityIndicator color="white" />
                                    : <Text className="text-white font-bold text-base">Přihlásit se</Text>
                                }
                            </TouchableOpacity>

                            <TouchableOpacity className="mt-4 items-center" onPress={() => setAuthTab('register')}>
                                <Text className="text-[#A08070] text-sm">
                                    Nemáte účet? <Text className="text-[#764534] font-bold">Zaregistrujte se</Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        /* ── Register form ── */
                        <View>
                            <Text className="text-2xl font-extrabold text-[#764534] mb-1">Vytvořit účet</Text>
                            <Text className="text-sm text-[#A08070] mb-6">Zaregistrujte se zdarma</Text>

                            <View className="bg-white rounded-2xl border border-[#EDE3D6] px-4 mb-3 flex-row items-center">
                                <Ionicons name="mail-outline" size={18} color="#A08070" style={{ marginRight: 10 }} />
                                <TextInput
                                    placeholder="Email"
                                    value={regEmail}
                                    onChangeText={setRegEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    placeholderTextColor="#B0A090"
                                    className="flex-1 py-4 text-[#3D2314] text-sm"
                                />
                            </View>

                            <View className="bg-white rounded-2xl border border-[#EDE3D6] px-4 mb-3 flex-row items-center">
                                <Ionicons name="lock-closed-outline" size={18} color="#A08070" style={{ marginRight: 10 }} />
                                <TextInput
                                    placeholder="Heslo (min. 6 znaků)"
                                    value={regPassword}
                                    onChangeText={setRegPassword}
                                    secureTextEntry
                                    placeholderTextColor="#B0A090"
                                    className="flex-1 py-4 text-[#3D2314] text-sm"
                                />
                            </View>

                            <View className="bg-white rounded-2xl border border-[#EDE3D6] px-4 mb-6 flex-row items-center">
                                <Ionicons name="lock-closed-outline" size={18} color="#A08070" style={{ marginRight: 10 }} />
                                <TextInput
                                    placeholder="Potvrdit heslo"
                                    value={regConfirm}
                                    onChangeText={setRegConfirm}
                                    secureTextEntry
                                    placeholderTextColor="#B0A090"
                                    className="flex-1 py-4 text-[#3D2314] text-sm"
                                />
                            </View>

                            <TouchableOpacity
                                className="bg-[#764534] rounded-2xl py-4 items-center"
                                onPress={handleRegister}
                                disabled={registering}
                            >
                                {registering
                                    ? <ActivityIndicator color="white" />
                                    : <Text className="text-white font-bold text-base">Zaregistrovat se</Text>
                                }
                            </TouchableOpacity>

                            <TouchableOpacity className="mt-4 items-center" onPress={() => setAuthTab('login')}>
                                <Text className="text-[#A08070] text-sm">
                                    Máte účet? <Text className="text-[#764534] font-bold">Přihlaste se</Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </View>
        );
    }

    // ── Logged in ─────────────────────────────────────────────────────────────
    return (
        <View className="flex-1 bg-[#F5EFE6]">
            <ScrollView
                contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Hero header ── */}
                <View
                    className="bg-[#764534] items-center pb-8"
                    style={{ paddingTop: insets.top + 20 }}
                >
                    <TouchableOpacity onPress={handleChangeAvatar} className="relative">
                        {avatarUri ? (
                            <Image
                                source={{ uri: avatarUri }}
                                className="w-24 h-24 rounded-full border-4 border-white"
                            />
                        ) : (
                            <View className="w-24 h-24 rounded-full border-4 border-white bg-[#9B6854] items-center justify-center">
                                <Ionicons name="person" size={42} color="rgba(255,255,255,0.8)" />
                            </View>
                        )}
                        <View className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 border-2 border-[#764534]">
                            <Ionicons name="camera" size={13} color="#764534" />
                        </View>
                    </TouchableOpacity>

                    <Text className="text-white text-xl font-extrabold mt-3">
                        {userEmail || email || 'Můj profil'}
                    </Text>
                    <Text className="text-white/60 text-xs mt-1">
                        {userAllergens.length > 0
                            ? `${userAllergens.length} sledovaných alergenů`
                            : 'Žádné alergeny nastaveny'}
                    </Text>
                </View>

                <View className="px-5 pt-5 gap-5">

                    {/* ── Allergens ── */}
                    <View className="bg-white rounded-2xl p-4 border border-[#EDE3D6]">
                        <View className="flex-row items-center justify-between mb-3">
                            <Text className="font-bold text-[#3D2314] text-base">Moje alergeny</Text>
                            <TouchableOpacity onPress={() => router.push('/(tabs)/fav')}>
                                <Text className="text-[#764534] text-xs font-semibold">Upravit →</Text>
                            </TouchableOpacity>
                        </View>
                        {userAllergens.length > 0 ? (
                            <View className="flex-row flex-wrap">
                                {userAllergens.map(a => <AllergenChip key={a} name={a} />)}
                            </View>
                        ) : (
                            <Text className="text-[#A08070] text-sm">Žádné alergeny uložené.</Text>
                        )}
                    </View>

                    {/* ── Scan history ── */}
                    <View className="bg-white rounded-2xl p-4 border border-[#EDE3D6]">
                        <Text className="font-bold text-[#3D2314] text-base mb-3">
                            Historie skenování
                        </Text>
                        {loadingHistory ? (
                            <ActivityIndicator color="#764534" />
                        ) : history.length === 0 ? (
                            <Text className="text-[#A08070] text-sm">
                                Zatím žádná historie skenování.
                            </Text>
                        ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {history.map((product, index) => (
                                    <TouchableOpacity
                                        key={`${product.code}-${index}`}
                                        className="mr-4 items-center"
                                        style={{ width: 90 }}
                                        onPress={() => router.push({
                                            pathname: '/Product/[id]',
                                            params: { id: product.code },
                                        })}
                                    >
                                        {product.image ? (
                                            <Image
                                                source={{ uri: product.image }}
                                                className="w-20 h-20 rounded-2xl mb-1 bg-[#F0E8DC]"
                                                resizeMode="contain"
                                            />
                                        ) : (
                                            <View className="w-20 h-20 rounded-2xl mb-1 bg-[#F0E8DC] items-center justify-center">
                                                <Text className="text-2xl">🛒</Text>
                                            </View>
                                        )}
                                        <Text
                                            className="text-[#3D2314] text-xs text-center font-medium"
                                            numberOfLines={2}
                                        >
                                            {product.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                    </View>

                    {/* ── Change password form ── */}
                    {showPwForm && (
                        <View className="bg-white rounded-2xl p-4 border border-[#EDE3D6]">
                            <Text className="font-bold text-[#3D2314] text-base mb-3">Změna hesla</Text>

                            {[
                                { placeholder: 'Současné heslo', value: oldPassword, onChange: setOldPassword },
                                { placeholder: 'Nové heslo', value: newPassword, onChange: setNewPassword },
                                { placeholder: 'Potvrdit nové heslo', value: confirmPassword, onChange: setConfirmPassword },
                            ].map(({ placeholder, value, onChange }) => (
                                <View
                                    key={placeholder}
                                    className="flex-row items-center bg-[#F5EFE6] rounded-xl border border-[#E0D4C4] px-3 mb-3"
                                >
                                    <Ionicons name="lock-closed-outline" size={16} color="#A08070" style={{ marginRight: 8 }} />
                                    <TextInput
                                        placeholder={placeholder}
                                        value={value}
                                        onChangeText={onChange}
                                        secureTextEntry
                                        placeholderTextColor="#B0A090"
                                        className="flex-1 py-3 text-sm text-[#3D2314]"
                                    />
                                </View>
                            ))}

                            <View className="flex-row gap-3">
                                <TouchableOpacity
                                    className="flex-1 bg-[#F5EFE6] border border-[#D4C4B0] rounded-xl py-3 items-center"
                                    onPress={() => { setShowPwForm(false); setOldPassword(''); setNewPassword(''); setConfirmPassword(''); }}
                                >
                                    <Text className="text-[#764534] font-semibold text-sm">Zrušit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="flex-1 bg-[#764534] rounded-xl py-3 items-center"
                                    onPress={handleChangePassword}
                                    disabled={changingPw}
                                >
                                    {changingPw
                                        ? <ActivityIndicator color="white" size="small" />
                                        : <Text className="text-white font-bold text-sm">Uložit</Text>
                                    }
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* ── Actions ── */}
                    <View>
                        <Text className="text-xs font-semibold text-[#A08070] uppercase tracking-widest mb-3">
                            Nastavení účtu
                        </Text>
                        <ActionRow icon={icons.changePassword} label="Změnit heslo" onPress={() => setShowPwForm(v => !v)} />
                        <ActionRow icon={icons.fiber} label="Upravit alergeny" onPress={() => router.push('/(tabs)/fav')} />
                        <ActionRow icon={icons.changeAvatar} label="Změnit avatar" onPress={handleChangeAvatar} />
                        <ActionRow icon={icons.logout} label="Odhlásit se" onPress={handleLogout} danger />
                    </View>

                </View>
            </ScrollView>
        </View>
    );
}
