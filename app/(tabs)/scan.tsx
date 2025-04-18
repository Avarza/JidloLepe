import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useRouter } from 'expo-router';
import colors from '@/tailwind.config';

const ScanScreen = () => {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [facing, setFacing] = useState<'front' | 'back'>('back');
    const router = useRouter();

    const handleBarCodeScanned = (result: BarcodeScanningResult) => {
        if (!scanned && result?.data) {
            setScanned(true);
            const productId = result.data;

            router.push({
                pathname: '/Product/[id]',
                params: { id: productId },
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

            {/* Bílé rámečky v rozích */}
            <View style={styles.frameContainer}>
                <View style={styles.frame}>
                    {/* Levý horní roh */}
                    <View style={[styles.corner, styles.topLeft]} />
                    {/* Pravý horní roh */}
                    <View style={[styles.corner, styles.topRight]} />
                    {/* Levý dolní roh */}
                    <View style={[styles.corner, styles.bottomLeft]} />
                    {/* Pravý dolní roh */}
                    <View style={[styles.corner, styles.bottomRight]} />
                </View>
            </View>

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
        justifyContent: 'center',
    },
    frameContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    frame: {
        width: 260,
        height: 260,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: 'white',
        borderWidth: 5,
    },
    topLeft: {
        top: 0,
        left: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    topRight: {
        top: 0,
        right: 0,
        borderLeftWidth: 0,
        borderBottomWidth: 0,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderRightWidth: 0,
        borderTopWidth: 0,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderLeftWidth: 0,
        borderTopWidth: 0,
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
        backgroundColor: colors.primary,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ScanScreen;
