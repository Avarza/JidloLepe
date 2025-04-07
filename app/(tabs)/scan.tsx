import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useRouter } from 'expo-router';
import colors from "@/tailwind.config";

const ScanScreen = () => {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [facing, setFacing] = useState<'front' | 'back'>('back');
    const router = useRouter();

    const handleBarCodeScanned = (result: BarcodeScanningResult) => {
        if (!scanned && result?.data) {
            setScanned(true);
            const productId = result.data;

            // ⏩ přesměrování na detail produktu
            router.push({
                pathname: '/Product/[id]',
                params: { id: productId }
            });
        }
    };

    if (!permission) {
        return <View style={styles.container}><Text>Načítání oprávnění...</Text></View>;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text>Nemáte přístup ke kameře</Text>
                <TouchableOpacity onPress={requestPermission} style={styles.button}>
                    <Text style={styles.buttonText}>Povolit přístup ke kameře</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFillObject}
                facing={facing}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'qr'],
                }}
            />
            {scanned && (
                <View style={styles.overlay}>
                    <TouchableOpacity onPress={() => setScanned(false)} style={styles.button}>
                        <Text style={styles.buttonText}>Skenovat znovu</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
    },
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.primary,
        padding: 20,
        alignItems: 'center',
    },
    button: {
        backgroundColor: colors.primary, // změň barvu pozadí na požadovanou
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    buttonText: {
        color: 'white', // změň barvu textu na požadovanou
        fontSize: 16,
        fontWeight: 'bold',
    }
});

export default ScanScreen;
