import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const CORNER_SIZE = 36;
const FRAME_SIZE = 260;

const ScanScreen = () => {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const router = useRouter();

    // Breathing animation — scale + opacity pulse
    const breathe = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(breathe, {
                    toValue: 1,
                    duration: 1200,
                    useNativeDriver: true,
                }),
                Animated.timing(breathe, {
                    toValue: 0,
                    duration: 1200,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const frameScale = breathe.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.06],
    });

    const cornerOpacity = breathe.interpolate({
        inputRange: [0, 1],
        outputRange: [0.6, 1],
    });

    const handleBarCodeScanned = (result: BarcodeScanningResult) => {
        if (!scanned && result?.data) {
            setScanned(true);
            router.push({ pathname: '/Product/[id]', params: { id: result.data } });
            setTimeout(() => setScanned(false), 3000);
        }
    };

    if (!permission) {
        return (
            <View className="flex-1 items-center justify-center bg-black">
                <Text className="text-white text-base">Načítání oprávnění...</Text>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View className="flex-1 items-center justify-center bg-black px-8 gap-6">
                <Text className="text-4xl">📷</Text>
                <Text className="text-white text-lg text-center leading-6">
                    Pro skenování potřebujeme přístup k vaší kameře.
                </Text>
                <TouchableOpacity
                    onPress={requestPermission}
                    className="bg-[#764534] px-6 py-3 rounded-xl"
                >
                    <Text className="text-white text-base font-bold">
                        Povolit přístup ke kameře
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-black">
            {/* Camera fills the screen */}
            <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'qr'],
                }}
            />

            {/* Dark overlay with a transparent cutout feel */}
            <View className="flex-1 items-center justify-center">

                {/* Hint text above frame */}
                <Text className="text-white/70 text-sm mb-6 tracking-widest uppercase">
                    Namiřte na čárový kód
                </Text>

                {/* Animated frame wrapper */}
                <Animated.View
                    style={{
                        width: FRAME_SIZE,
                        height: FRAME_SIZE,
                        transform: [{ scale: frameScale }],
                    }}
                >
                    <Animated.View style={[styles.corner, styles.topLeft,     { opacity: cornerOpacity }]} />
                    <Animated.View style={[styles.corner, styles.topRight,    { opacity: cornerOpacity }]} />
                    <Animated.View style={[styles.corner, styles.bottomLeft,  { opacity: cornerOpacity }]} />
                    <Animated.View style={[styles.corner, styles.bottomRight, { opacity: cornerOpacity }]} />
                </Animated.View>

                {/* Hint text below frame */}
                {scanned && (
                    <Text className="text-white/80 text-sm mt-6 tracking-wide">
                        Načítám produkt…
                    </Text>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    corner: {
        position: 'absolute',
        width: CORNER_SIZE,
        height: CORNER_SIZE,
        borderColor: 'white',
        borderWidth: 4,
        borderRadius: 3,
    },
    topLeft: {
        top: 0, left: 0,
        borderRightWidth: 0, borderBottomWidth: 0,
    },
    topRight: {
        top: 0, right: 0,
        borderLeftWidth: 0, borderBottomWidth: 0,
    },
    bottomLeft: {
        bottom: 0, left: 0,
        borderRightWidth: 0, borderTopWidth: 0,
    },
    bottomRight: {
        bottom: 0, right: 0,
        borderLeftWidth: 0, borderTopWidth: 0,
    },
});

export default ScanScreen;