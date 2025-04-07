import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useRouter } from 'expo-router';

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
                <Button title="Povolit přístup ke kameře" onPress={requestPermission} />
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
                    barcodeTypes: ['ean13', 'qr', 'code128', 'upc_a', 'upc_e'],
                }}
            />
            {scanned && (
                <View style={styles.overlay}>
                    <Button title="Skenovat znovu" onPress={() => setScanned(false)} />
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
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 20,
        alignItems: 'center',
    },
});

export default ScanScreen;
