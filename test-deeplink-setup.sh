#!/bin/bash

# Test Deep Linking Configuration
# This script tests both the local AASA files and the test server configuration

echo "🔍 Testing Deep Linking Configuration for Verry.ai"
echo "================================================="

TEST_DOMAIN="54n8hcsj-3000.inc1.devtunnels.ms"
TEST_URL="https://${TEST_DOMAIN}/verify/test123"

echo ""
echo "📱 Test Configuration:"
echo "Domain: ${TEST_DOMAIN}"
echo "Test URL: ${TEST_URL}"
echo ""

# Test if the domain is accessible
echo "🌐 Testing domain accessibility..."
if curl -s --head --request GET "${TEST_URL}" | grep "200 OK" > /dev/null; then
    echo "✅ Test domain is accessible"
else
    echo "❌ Test domain is not accessible"
    echo "   Make sure your test server is running on port 3000"
fi

echo ""
echo "🍎 Testing iOS Universal Links (AASA)..."
AASA_URL="https://${TEST_DOMAIN}/.well-known/apple-app-site-association"
echo "Checking: ${AASA_URL}"

if curl -s "${AASA_URL}" | jq . > /dev/null 2>&1; then
    echo "✅ AASA file is served correctly"
    curl -s "${AASA_URL}" | jq .
else
    echo "❌ AASA file is not accessible or invalid JSON"
    echo "   Expected location: ${AASA_URL}"
    echo "   Make sure your server serves the AASA file at this path"
fi

echo ""
echo "🤖 Testing Android Asset Links..."
ASSETLINKS_URL="https://${TEST_DOMAIN}/.well-known/assetlinks.json"
echo "Checking: ${ASSETLINKS_URL}"

if curl -s "${ASSETLINKS_URL}" | jq . > /dev/null 2>&1; then
    echo "✅ Asset Links file is served correctly"
    curl -s "${ASSETLINKS_URL}" | jq .
else
    echo "❌ Asset Links file is not accessible or invalid JSON"
    echo "   Expected location: ${ASSETLINKS_URL}"
    echo "   Make sure your server serves the Asset Links file at this path"
fi

echo ""
echo "🔗 Deep Link Test Instructions:"
echo "1. Make sure the Verry.ai app is installed on your device"
echo "2. Open this URL in Safari (iOS) or Chrome (Android): ${TEST_URL}"
echo "3. The app should open automatically if deep linking is configured correctly"
echo ""
echo "📱 Alternative test (Custom Scheme):"
echo "   verryapp://verify/test123"
echo ""
echo "🛠 Troubleshooting:"
echo "• iOS: Check Settings > Screen Time > Content & Privacy Restrictions"
echo "• Android: Check that Chrome is set as default browser"
echo "• Both: Try uninstalling and reinstalling the app"
echo "• Check that the bundle ID matches: com.appnoize.verry.ai"
echo ""

# Test local AASA files
echo "📋 Local AASA Files Status:"
if [ -f "apple-app-site-association" ]; then
    echo "✅ Main AASA file exists"
else
    echo "❌ Main AASA file missing"
fi

if [ -f "web-assets/aasa/apple-app-site-association-test.json" ]; then
    echo "✅ Test AASA file exists"
else
    echo "❌ Test AASA file missing"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Add the server configuration from test-server-config.js to your Node.js server"
echo "2. Restart your test server"
echo "3. Test the URLs above"
echo "4. If still not working, check the iOS/Android logs for deep linking errors"