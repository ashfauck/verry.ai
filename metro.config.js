const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  transformer: {
    babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
  },
  resolver: {
    assetExts: [
      ...defaultConfig.resolver.assetExts,
      'bin',
    ],
  },
};

module.exports = mergeConfig(defaultConfig, config);