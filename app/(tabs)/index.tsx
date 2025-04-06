import {Image, ScrollView,Text, View } from "react-native";
import {images} from "@/constants/images";
import icons from "@/constants/icons";
import SearchBar from "@/components/searchBar";
import {useRouter} from "expo-router";


export default function Index() {
    const router = useRouter();

    return (
    <View className="flex-1 bg-accent">
        {/*<Image source={images.jumbotron} className="absolute w-full z-0" />*/}
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} contentContainerStyle={
            {minHeight:"100%", paddingBottom:10}} >
                <Image source={icons.logo} className="w-12 h-10 mt-20 mb-5 mx-auto" />
                <View className=" flex-1 mt-5">
                    <SearchBar onPress={()=> router.push("/(tabs)/search")}
                               placeholder="Hledej alergeny"
                    /></View>
            </ScrollView>

    </View>
  );
}
