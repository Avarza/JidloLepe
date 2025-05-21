import { View, TextInput, Image, Pressable, StyleSheet } from 'react-native';
import icons from "@/constants/icons";

interface Props {
    placeholder: string;
    onPress?: () => void;
}

const SearchBar = ({ placeholder, onPress }: Props) => {
    return (
        <Pressable onPress={onPress}>
            <View style={styles.container}>
                <Image source={icons.search} style={styles.icon} resizeMode="contain" />
                <TextInput
                    placeholder={placeholder}
                    placeholderTextColor="white"
                    editable={false}
                    pointerEvents="none"
                    style={styles.input}
                />
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: "color.primary",
        borderRadius: 999,
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    icon: {
        width: 20,
        height: 20,
    },
    input: {
        flex: 1,
        marginLeft: 10,
        color: 'white',
        fontSize: 16,
    },
});

export default SearchBar;
