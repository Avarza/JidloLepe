import {View, Text} from 'react-native'
import React from 'react'
import {Tabs} from "expo-router";

const _Layout = () => {
    return (
        <Tabs>
            <Tabs.Screen name="index" options={{
                title:'Home', headerShown: false
            }}/>
            <Tabs.Screen name="search" options={{title: 'Hledat',headerShown: false}}/>
            <Tabs.Screen name="scan" options={{title: 'Skenuj!',headerShown: false}}/>
            <Tabs.Screen name="fav" options={{title: 'Oblíbené',headerShown: false}}/>
            <Tabs.Screen name="profile" options={{title: 'Profil',headerShown: false}}/>

        </Tabs>
            )
}
export default _Layout