const path = require('path');

/**
 * Minimal Metro Configuration
 * Designed to bypass React Native CLI hanging issues
 */
module.exports = {
  projectRoot: __dirname,
  watchFolders: [__dirname],
  
  resolver: {
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
    ],
    platforms: ['ios', 'android', 'native'],
    assetExts: [
      'bmp', 'gif', 'jpg', 'jpeg', 'png', 'psd', 'svg', 'webp',
      'm4v', 'mov', 'mp4', 'mpeg', 'mpg', 'webm',
      'aac', 'aiff', 'caf', 'm4a', 'mp3', 'wav',
      'html', 'pdf', 'yaml', 'yml', 'otf', 'ttf'
    ],
    sourceExts: ['js', 'jsx', 'ts', 'tsx', 'json'],
  },
  
  transformer: {
    babelTransformerPath: require.resolve('@react-native/metro-babel-transformer'),
    assetRegistryPath: 'react-native/Libraries/Image/AssetRegistry',
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  
  serializer: {
    getModulesRunBeforeMainModule: () => [
      require.resolve('@react-native/metro-config/src/defaults/polyfills/require.js'),
    ],
    getPolyfills: require('@react-native/metro-config/src/defaults/polyfills'),
  },
  
  server: {
    port: 8081,
  },
  
  // Optimize for stability
  maxWorkers: 2,
  resetCache: false,
};