#!/bin/bash

echo "🔧 Advanced Universal Links Debugging"
echo "====================================="

echo ""
echo "Since your configuration is perfect, try these iOS-specific fixes:"
echo ""

echo "🚨 Method 1: Force AASA Re-validation"
echo "• Put device in Airplane Mode"
echo "• Install VerryApp while offline (this skips AASA validation)"
echo "• Turn on Wi-Fi/Cellular"
echo "• Delete and reinstall app (forces fresh AASA download)"
echo ""

echo "🚨 Method 2: Check HTTP Headers"
curl -I "https://54n8hcsj-3000.inc1.devtunnels.ms/.well-known/apple-app-site-association"
echo ""

echo "🚨 Method 3: Alternative Test URLs"
echo "Try these variations:"
echo "• https://54n8hcsj-3000.inc1.devtunnels.ms/v/test123"
echo "• https://54n8hcsj-3000.inc1.devtunnels.ms/verification/test123" 
echo ""

echo "🚨 Method 4: iOS Console Debugging"
echo "1. Connect device to Mac"
echo "2. Open Console app"
echo "3. Filter for 'swcd' (Universal Links service)"
echo "4. Install app and check for AASA validation logs"
echo ""

echo "🚨 Method 5: Check iOS Version"
echo "Universal Links have known issues on some iOS versions:"
echo "• iOS 13-14: Sometimes buggy"
echo "• iOS 15+: More reliable"
echo "• Consider testing on different iOS version if available"
echo ""

echo "🚨 Method 6: Verify Server Content-Type"
echo "AASA file must be served with correct headers:"
curl -H "Accept: application/json" -v "https://54n8hcsj-3000.inc1.devtunnels.ms/.well-known/apple-app-site-association" 2>&1 | grep -i "content-type"
echo ""

echo "💡 Last Resort: Manual AASA Validation"
echo "Apple has an AASA validator (though it's unofficial):"
echo "https://branch.io/resources/aasa-validator/"
echo "Test your URL: https://54n8hcsj-3000.inc1.devtunnels.ms"