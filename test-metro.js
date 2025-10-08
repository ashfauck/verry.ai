const Metro = require('metro');
const { loadConfig } = require('metro-config');

async function testMetro() {
  try {
    console.log('🚀 Testing Metro bundler...');
    
    const config = await loadConfig({
      cwd: __dirname,
      projectRoot: __dirname,
      server: {
        port: 8081,
        host: '0.0.0.0'
      }
    });

    const server = await Metro.runServer(config, {
      host: '0.0.0.0',
      port: 8081,
    });

    console.log('✅ Metro started successfully on http://localhost:8081');
    console.log('🔥 Metro is working! Press Ctrl+C to stop.');
    
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping Metro...');
      server.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Metro failed:', error.message);
    process.exit(1);
  }
}

testMetro();