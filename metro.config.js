const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
const {resolve} = require("node:path");

const config = getDefaultConfig(__dirname, { isCSSEnabled: true })
config.resolver.alias = {
    "@": resolve(__dirname),
};

module.exports = withNativeWind(config, { input: './app/globals.css' })