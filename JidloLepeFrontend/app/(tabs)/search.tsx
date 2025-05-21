import {View, Text, ScrollView, Image} from 'react-native'
import React from 'react'
import icons from "@/constants/icons";
import SearchBar from "@/components/searchBar";
import {useRouter} from "expo-router";
import images from "@/constants/images";

const Search = () => {

    return(
        <View className="flex-1 bg-accent">
            <Image source={images.background} className="flex-1 absolute w-full z-0" resizeMode="cover"/>

        </View>
    )
}
export default Search