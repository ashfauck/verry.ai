// Test server configuration for deep linking
// Add this to your test server (https://54n8hcsj-3000.inc1.devtunnels.ms/)

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// Serve AASA file for iOS Universal Links
app.get('/.well-known/apple-app-site-association', (req, res) => {
  const aasaContent = {
    "applinks": {
      "details": [
        {
          "appIDs": [
            "Z3VKCZH574.com.appnoize.verry.ai"
          ],
          "components": [
            {
              "/": "/verify/*",
              "comment": "Verification deep links - test environment"
            },
            {
              "/": "/verification/*", 
              "comment": "Alternative verification path - test environment"
            },
            {
              "/": "/v/*",
              "comment": "Short verification path - test environment"
            }
          ]
        }
      ]
    },
    "webcredentials": {
      "apps": [
        "Z3VKCZH574.com.appnoize.verry.ai"
      ]
    }
  };
  
  res.setHeader('Content-Type', 'application/json');
  res.json(aasaContent);
});

// Serve Android Asset Links file
app.get('/.well-known/assetlinks.json', (req, res) => {
  const assetLinksContent = [
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
  ];
  
  res.setHeader('Content-Type', 'application/json');
  res.json(assetLinksContent);
});

// Test endpoint for deep linking
app.get('/verify/:token', (req, res) => {
  const { token } = req.params;
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Verry.ai Test - Verification</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
        .container { max-width: 400px; margin: 0 auto; }
        .button { 
          display: inline-block; 
          padding: 15px 30px; 
          margin: 10px; 
          background: #007AFF; 
          color: white; 
          text-decoration: none; 
          border-radius: 8px; 
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Verry.ai Verification</h1>
        <p>Token: <strong>${token}</strong></p>
        <p>This page should open in the Verry.ai app if deep linking is configured correctly.</p>
        
        <a href="verryapp://verify/${token}" class="button">Open in App (Custom Scheme)</a>
        
        <h3>Debug Info:</h3>
        <p><strong>URL:</strong> ${req.protocol}://${req.get('host')}${req.originalUrl}</p>
        <p><strong>User Agent:</strong> ${req.get('User-Agent')}</p>
        
        <h3>Troubleshooting:</h3>
        <ul style="text-align: left;">
          <li>Make sure the Verry.ai app is installed</li>
          <li>Try opening this URL in Safari (iOS) or Chrome (Android)</li>
          <li>Check that Universal Links are enabled in iOS Settings > Screen Time > Content & Privacy Restrictions</li>
        </ul>
      </div>
    </body>
    </html>
  `);
});

module.exports = app;