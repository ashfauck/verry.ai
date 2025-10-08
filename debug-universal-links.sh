#!/bin/bash

# Universal Links Debug Helper
# Run this to help debug Universal Links issues

echo "🔗 Universal Links Debug Helper"
echo "================================"

DOMAIN="54n8hcsj-3000.inc1.devtunnels.ms"
TEST_URL="https://${DOMAIN}/verify/test123"

echo ""
echo "📱 Testing Universal Links for: ${DOMAIN}"
echo ""

# Check AASA file content
echo "🍎 AASA File Content:"
curl -s "https://${DOMAIN}/.well-known/apple-app-site-association" | jq .

echo ""
echo "🔍 Bundle ID Verification:"
echo "Expected Bundle ID: com.appnoize.verry.ai"
echo "Team ID: Z3VKCZH574"

echo ""
echo "📋 Manual Test Steps:"
echo "1. Open Safari on your iOS device"
echo "2. Navigate to: ${TEST_URL}"
echo "3. The page should load"
echo "4. Long-press the URL or any link on the page"
echo "5. Look for 'Open in VerryApp' option"
echo ""
echo "If no 'Open in App' option appears:"
echo "• Check Settings → Safari → Advanced → Website Data → Clear All"
echo "• Restart your iOS device"
echo "• Reinstall the app"
echo "• Check iOS version (Universal Links require iOS 9+)"

echo ""
echo "🎯 Quick Test URLs:"
echo "Custom Scheme (should work): verryapp://verify/test123"
echo "Universal Link (testing): ${TEST_URL}"

echo ""
echo "📊 App Installation Check:"
echo "Make sure the app bundle ID exactly matches: com.appnoize.verry.ai"
echo "Check in Xcode → Project → Bundle Identifier"