import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const ProductDetails = ({ route }: { route: any }) => {
    const product = JSON.parse(route.params.product);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{product.product?.product_name || 'Unknown Product'}</Text>
            {product.product?.image_url && (
                <Image source={{ uri: product.product.image_url }} style={styles.image} />
            )}
            <Text>Brand: {product.product?.brands || 'Unknown'}</Text>
            <Text>Categories: {product.product?.categories || 'Unknown'}</Text>
            {/* Add more product information as needed */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    image: {
        width: '100%',
        height: 200,
        resizeMode: 'contain',
        marginBottom: 20,
    },
});

export default ProductDetails;