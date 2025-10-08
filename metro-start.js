#!/usr/bin/env node

const Metro = require('metro');
const { loadConfig } = require('metro-config');
const path = require('path');

async function startMetro() {
  try {
    console.log('🚀 Starting Metro bundler...');
    
    // Load Metro configuration
    const config = await loadConfig({
      cwd: __dirname,
      projectRoot: __dirname,
      watchFolders: [],
      reporter: {
        update: (event) => {
          if (event.type === 'bundle_build_done') {
            console.log(`📦 Bundle built in ${event.buildTime}ms`);
          } else if (event.type === 'bundle_build_started') {
            console.log(`🔨 Building bundle for ${event.entryFile}...`);
          } else if (event.type === 'global_cache_disabled') {
            console.log('⚠️  Global cache disabled');
          } else if (event.type === 'transform_cache_reset') {
            console.log('🔄 Transform cache reset');
          }
        }
      },
      server: {
        port: 8081,
        host: '0.0.0.0'
      }
    });

    // Start Metro server
    const server = await Metro.runServer(config, {
      host: '0.0.0.0',
      port: 8081,
      secure: false,
      secureCert: undefined,
      secureKey: undefined,
      hmrEnabled: true,
      resetCache: false,
      maxWorkers: undefined,
    });

    console.log('✅ Metro bundler is running on http://localhost:8081');
    console.log('📱 Ready for React Native app connections');
    
    // Keep the process running
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down Metro bundler...');
      server.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start Metro bundler:', error);
    process.exit(1);
  }
}

startMetro();