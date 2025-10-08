#!/bin/bash

echo "🔍 Deep Linking Diagnostic Report"
echo "================================="

echo ""
echo "📱 Current Configuration Analysis:"
echo ""

# Check what bundle IDs are configured
echo "🏗️ Bundle ID Configuration:"
echo "From Dev.Debug.xcconfig:"
DEV_PREFIX=$(grep "BUNDLE_ID_PREFIX" ios/Dev.Debug.xcconfig | cut -d'=' -f2 | xargs)
DEV_SUFFIX=$(grep "BUNDLE_ID_SUFFIX" ios/Dev.Debug.xcconfig | cut -d'=' -f2 | xargs)
echo "   Development Bundle ID: ${DEV_PREFIX}${DEV_SUFFIX}"

echo ""
echo "🌐 Server AASA File Analysis:"
echo "Current AASA on server:"
curl -s "https://54n8hcsj-3000.inc1.devtunnels.ms/.well-known/apple-app-site-association" | jq -r '.applinks.details[0].appIDs[]' | sed 's/^/   /'

echo ""
echo "❌ PROBLEM IDENTIFIED:"
echo "   Server AASA has: Z3VKCZH574.com.appnoize.verry.ai, Z3VKCZH574.staging.appnoize.verry.ai, Z3VKCZH574.dev.appnoize.verry.ai"
echo "   Your app expects: Z3VKCZH574.dev.appnoize.verry.ai"
echo "   ✅ Bundle ID matches! But let's check the entitlements..."

echo ""
echo "📋 Entitlements Check:"
if [ -f "ios/VerryApp/VerryApp-Development.entitlements" ]; then
    echo "Development entitlements contain:"
    grep -A10 "com.apple.developer.associated-domains" ios/VerryApp/VerryApp-Development.entitlements | grep "string" | sed 's/.*<string>\(.*\)<\/string>.*/   \1/'
else
    echo "❌ Development entitlements file not found!"
fi

echo ""
echo "🔧 Universal Links Troubleshooting Steps:"
echo ""
echo "1. 📱 App Installation Check:"
echo "   • Make sure you built and installed with VerryAppDevelopment scheme"
echo "   • The app must be opened at least once after installation"
echo "   • Bundle ID must be: dev.appnoize.verry.ai"

echo ""
echo "2. 🌐 Browser Testing (CRITICAL):"
echo "   • Universal Links ONLY work in Safari on iOS"
echo "   • DO NOT test in Chrome, Firefox, or other browsers"
echo "   • Open Safari and navigate to: https://54n8hcsj-3000.inc1.devtunnels.ms/verify/test123"

echo ""
echo "3. 📱 iOS Universal Links Validation:"
echo "   • iOS automatically validates AASA files when app is installed"
echo "   • Long-press the URL in Safari to see 'Open in VerryApp' option"
echo "   • If no option appears, clear Safari data: Settings → Safari → Clear History and Website Data"

echo ""
echo "4. 🔄 Reset Steps if Still Not Working:"
echo "   • Delete the app completely"
echo "   • Clear Safari data: Settings → Safari → Clear History and Website Data"
echo "   • Restart your iOS device"
echo "   • Rebuild and reinstall with VerryAppDevelopment scheme"
echo "   • Open the app once, then test the URL in Safari"

echo ""
echo "🎯 Quick Tests:"
echo ""
echo "✅ Custom Scheme Test (should work):"
echo "   verryapp://verify/test123"
echo ""
echo "❓ Universal Link Test (troubleshoot this):"
echo "   https://54n8hcsj-3000.inc1.devtunnels.ms/verify/test123"
echo "   (Must test in Safari, not other browsers)"

echo ""
echo "📊 Current Status Summary:"
echo "✅ Custom scheme working: verryapp:// opens the app"
echo "✅ AASA file being served by server"
echo "✅ Bundle ID configuration appears correct"
echo "❌ Universal Links not working"
echo ""
echo "→ Most likely cause: Need to test in Safari specifically"
echo "→ Or need to clear Safari cache and reinstall app"

echo ""
echo "🔥 Action Items:"
echo "1. Build with VerryAppDevelopment scheme"
echo "2. Install and open the app once"
echo "3. Test ONLY in Safari: https://54n8hcsj-3000.inc1.devtunnels.ms/verify/test123"
echo "4. Long-press the URL to see if 'Open in VerryApp' appears"