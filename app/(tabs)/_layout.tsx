import { View, TouchableOpacity, Image, Animated } from "react-native";
import React, { useState, useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { icons } from "@/constants/icons";
import { Tabs } from "expo-router";
import colors from "tailwindcss/colors";

type TabBarIconProps = {
    focused: boolean;
    color: string;
    size: number;
};

const _Layout = () => {
    const router = useRouter();
    const segments = useSegments();
    const [scale] = useState(new Animated.Value(1));
    const [isAnimating, setIsAnimating] = useState(false);

    const isScanPage = segments[segments.length - 1] === "scan";

    const handleScanPress = () => {
        if (isAnimating) return;

        setIsAnimating(true);
        Animated.spring(scale, {
            toValue: 0.7,
            useNativeDriver: true,
        }).start(() => {
            setIsAnimating(false);
            if (!isScanPage) {
                router.push("/scan");
            }
        });
    };

    // Reset scale when leaving scan page
    useEffect(() => {
        if (!isScanPage) {
            Animated.spring(scale, {
                toValue: 1,
                useNativeDriver: true,
            }).start();
        }
    }, [isScanPage]);

    const renderTabBarIcon = (
        iconSource: any,
        focusedIconSource: any,
        { focused }: TabBarIconProps
    ) => (
        <Image
            source={focused ? focusedIconSource : iconSource}
            className="w-5 h-5"
            resizeMode="contain"
        />
    );

    return (
        <Tabs
            screenOptions={{
                tabBarShowLabel: false,
                headerShown: false,
                tabBarStyle: {
                    position: 'absolute',
                    bottom: -5,
                    left: 0,
                    right: 0,
                    elevation: 0,
                    height: 50,
                    backgroundColor: '#E8DFD0',
                    borderTopWidth: 0,
                }
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    tabBarIcon: (props: TabBarIconProps) =>
                        renderTabBarIcon(icons.home, icons.home_active, props)
                }}
            />
            <Tabs.Screen
                name="search"
                options={{
                    tabBarIcon: (props: TabBarIconProps) =>
                        renderTabBarIcon(icons.search, icons.search_active, props)
                }}
            />
            <Tabs.Screen
                name="product-details"
                options={{
                    href: null, // Tato stránka nebude v tab navigaci
                }}
            />
            <Tabs.Screen
                name="scan"
                options={{
                    tabBarButton: () => (
                        <View className="absolute bottom-0 left-0 right-0 items-center">
                            <TouchableOpacity
                                onPress={handleScanPress}
                                activeOpacity={0.9}
                                className="w-14 h-14 rounded-full justify-center items-center shadow-md shadow-gray-400"
                                style={{
                                    transform: [{ translateY: -20 }],
                                    backgroundColor: '#E8DFD0',
                                }}
                            >
                                <Animated.View style={{
                                    transform: [{ scale }],
                                    width: 28,
                                    height: 28,
                                }}>
                                    <Image
                                        source={icons.scan}
                                        className="w-full h-full"
                                        resizeMode="contain"
                                    />
                                </Animated.View>
                            </TouchableOpacity>
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="fav"
                options={{
                    tabBarIcon: (props: TabBarIconProps) =>
                        renderTabBarIcon(icons.add, icons.add_active, props)
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    tabBarIcon: (props: TabBarIconProps) =>
                        renderTabBarIcon(icons.user, icons.user_active, props)
                }}
            />
        </Tabs>
    );
};

export default _Layout;