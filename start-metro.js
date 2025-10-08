#!/usr/bin/env node

const Metro = require('@react-native/metro-config');
const { getDefaultConfig } = require('@react-native/metro-config');
const { createServer } = require('metro');

async function startMetro() {
  try {
    console.log('Starting Metro bundler manually...');
    
    const config = getDefaultConfig(__dirname);
    
    // Create Metro server
    const server = await createServer(config, {
      port: 8081,
    });
    
    // Start server
    await server.listen(8081);
    
    console.log('Metro bundler running on http://localhost:8081');
    console.log('Press Ctrl+C to stop');
    
    // Keep process alive
    process.stdin.resume();
    
  } catch (error) {
    console.error('Failed to start Metro:', error.message);
    process.exit(1);
  }
}

startMetro();