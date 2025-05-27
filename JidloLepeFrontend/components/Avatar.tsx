import React from 'react';
import { Image, View, StyleSheet } from 'react-native';

type AvatarProps = {
    uri?: string;           // URL nebo local path na obrázek (může být undefined)
    size?: number;          // Velikost (šířka i výška)
};

const Avatar: React.FC<AvatarProps> = ({ uri, size = 100 }) => {
    const fallbackImage = require('../assets/avatar-placeholder.png'); // Náhradní avatar

    return (
        <View
            style={[
                styles.avatarContainer,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                },
            ]}
        >
            <Image
                source={uri ? { uri } : fallbackImage}
                style={{ width: size, height: size, borderRadius: size / 2 }}
                resizeMode="cover"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    avatarContainer: {
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#ccc',
        backgroundColor: '#eee',
    },
});

export default Avatar;
