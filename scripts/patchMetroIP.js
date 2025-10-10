// Replace `const ip = require('ip');` with:
const os = require('os');
const interfaces = os.networkInterfaces();
let localIP = 'localhost';

for (const name of Object.keys(interfaces)) {
  for (const iface of interfaces[name]) {
    if (iface.family === 'IPv4' && !iface.internal) {
      localIP = iface.address;
      break;
    }
  }
}