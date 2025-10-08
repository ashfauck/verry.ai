// Add this to your Node.js server running on port 3000
// This will serve the Android Asset Links file

app.get('/.well-known/assetlinks.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json([
    {
      "relation": ["delegate_permission/common.handle_all_urls"],
      "target": {
        "namespace": "android_app",
        "package_name": "com.appnoize.verry.ai",
        "sha256_cert_fingerprints": [
          "4D:42:4D:8C:97:62:C6:0C:CC:D2:C3:BD:96:4F:99:85:FA:05:00:77:B3:EB:47:E3:85:5A:2D:94:9E:F9:3F:F8"
        ]
      }
    }
  ]);
});

// Also add a working /verify/:token endpoint
app.get('/verify/:token', (req, res) => {
  const { token } = req.params;
  res.send(`
    <h1>Verification Token: ${token}</h1>
    <p>This should open the Verry.ai app!</p>
    <a href="verryapp://verify/${token}">Open in App (Fallback)</a>
  `);
});