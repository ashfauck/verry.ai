#!/usr/bin/env node

/**
 * Pure Metro Server Starter
 * Bypasses React Native CLI entirely and starts Metro directly
 */

console.log('🚀 Starting Pure Metro Server...');

try {
  const Metro = require('metro');
  const { getDefaultConfig } = require('@react-native/metro-config');
  const path = require('path');
  const fs = require('fs');

  // Configuration
  const PORT = process.env.PORT || 8081;
  const PROJECT_ROOT = path.resolve(__dirname, '..');
  const RESET_CACHE = process.argv.includes('--reset-cache');
  const VERBOSE = process.argv.includes('--verbose');

  console.log(`📁 Project Root: ${PROJECT_ROOT}`);
  console.log(`🌐 Port: ${PORT}`);
  console.log(`🔄 Reset Cache: ${RESET_CACHE}`);
  
} catch (error) {
  console.error('❌ Failed to load Metro dependencies:', error.message);
  console.log('💡 Trying alternative approach...');
}

async function startMetro() {
  try {
    console.log('📦 Initializing Metro server...');
    
    // Load our minimal config
    const configPath = path.join(PROJECT_ROOT, 'metro.pure.config.js');
    let config;
    
    if (fs.existsSync(configPath)) {
      console.log('📋 Loading minimal Metro config...');
      config = require(configPath);
    } else {
      console.log('📋 Using default Metro config...');
      config = await getDefaultConfig(PROJECT_ROOT);
    }
    
    // Override with runtime settings
    const enhancedConfig = {
      ...config,
      projectRoot: PROJECT_ROOT,
      server: {
        ...config.server,
        port: PORT,
      },
      resetCache: RESET_CACHE,
      maxWorkers: 1, // Single worker to prevent hanging
    };

    console.log('🔧 Enhanced config created');
    console.log('📦 Creating Metro server...');
    
    // Create Metro server
    const server = await Metro.createServer(enhancedConfig);
    
    console.log('🎯 Starting server on port', PORT);
    
    // Start the server
    await server.serve({
      host: 'localhost',
      port: PORT,
      secure: false,
    });

    console.log('✅ Metro server started successfully!');
    console.log(`📱 Metro Bundler ready at http://localhost:${PORT}`);
    console.log('🔗 To connect your app:');
    console.log(`   • Android: adb reverse tcp:${PORT} tcp:${PORT}`);
    console.log(`   • iOS: Connect to same WiFi network`);
    console.log('\n💡 Press Ctrl+C to stop the server');

  } catch (error) {
    console.error('❌ Failed to start Metro server:');
    console.error(error.message);
    console.error(error.stack);
    
    // Try fallback approach
    console.log('\n🔄 Trying fallback Metro approach...');
    try {
      await startMetroFallback();
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError.message);
      process.exit(1);
    }
  }
}

// Fallback method using direct Metro CLI
async function startMetroFallback() {
  console.log('📦 Using Metro CLI fallback...');
  const { spawn } = require('child_process');
  
  const metroProcess = spawn('npx', ['metro', 'serve', '--port', PORT.toString(), '--max-workers', '1'], {
    cwd: PROJECT_ROOT,
    stdio: 'inherit'
  });

  metroProcess.on('error', (error) => {
    console.error('❌ Metro process error:', error);
    process.exit(1);
  });

  metroProcess.on('close', (code) => {
    console.log(`Metro process exited with code ${code}`);
    process.exit(code);
  });
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Metro server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down Metro server...');
  process.exit(0);
});

// Start the server
startMetro().catch((error) => {
  console.error('❌ Startup failed:', error);
  process.exit(1);
});
