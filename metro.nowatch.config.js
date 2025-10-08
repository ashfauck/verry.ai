const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * No-watch Metro configuration for testing
 */
const config = {
  // Disable file watching entirely
  server: {
    useGlobalHotkey: false,
  },
  
  // Minimal resolver to avoid file system issues
  resolver: {
    blockList: [
      /node_modules\/.*\/Pods\/.*/,
      /.*\/Pods\/.*/,
      /.*\.xcworkspace\/.*/,
      /.*\.xcodeproj\/.*/,
      /.*\/build\/.*/,
      /\.git\/.*/,
    ]
  }
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);