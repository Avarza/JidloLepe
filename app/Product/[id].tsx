import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function ProductDetail() {
    const { id } = useLocalSearchParams();

    return (
        <View>
            <Text>Detail produktu pro ID: {id}</Text>
            {/* tady můžeš načíst data podle id */}
        </View>
    );
}
