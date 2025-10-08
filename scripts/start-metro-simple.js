#!/usr/bin/env node

/**
 * Ultra Simple Metro Starter
 * Direct Metro CLI execution with minimal overhead
 */

const { spawn } = require('child_process');
const path = require('path');

// Configuration
const PORT = process.env.PORT || 8081;
const PROJECT_ROOT = path.resolve(__dirname, '..');

console.log('🚀 Starting Ultra Simple Metro...');
console.log(`📁 Project: ${PROJECT_ROOT}`);
console.log(`🌐 Port: ${PORT}`);

// Change to project directory
process.chdir(PROJECT_ROOT);

// Start Metro using direct CLI
const args = [
  'metro',
  'serve',
  '--port', PORT.toString(),
  '--max-workers', '1',
  '--config', 'metro.pure.config.js'
];

if (process.argv.includes('--reset-cache')) {
  args.push('--reset-cache');
}

console.log('🎯 Starting Metro CLI...');
console.log(`Command: npx ${args.join(' ')}`);

const metro = spawn('npx', args, {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: '--max-old-space-size=4096'
  }
});

metro.on('error', (error) => {
  console.error('❌ Metro CLI error:', error);
  process.exit(1);
});

metro.on('close', (code) => {
  console.log(`\n🛑 Metro exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Metro...');
  metro.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down Metro...');
  metro.kill('SIGTERM');
});