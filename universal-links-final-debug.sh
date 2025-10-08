#!/bin/bash

echo "🔍 Universal Links Final Troubleshooting"
echo "========================================"

echo ""
echo "📱 Current Configuration Check:"

# Check Xcode team ID
TEAM_ID=$(grep "DEVELOPMENT_TEAM" ios/VerryApp.xcodeproj/project.pbxproj | head -1 | sed 's/.*= \(.*\);/\1/' | tr -d ' ')
echo "   Xcode Team ID: $TEAM_ID"

# Check bundle ID configuration
DEV_PREFIX=$(grep "BUNDLE_ID_PREFIX.*dev" ios/Dev.Debug.xcconfig | cut -d'=' -f2 | xargs)
DEV_SUFFIX=$(grep "BUNDLE_ID_SUFFIX" ios/Dev.Debug.xcconfig | cut -d'=' -f2 | xargs)
EXPECTED_BUNDLE="${DEV_PREFIX}${DEV_SUFFIX}"
EXPECTED_APP_ID="${TEAM_ID}.${EXPECTED_BUNDLE}"

echo "   Expected Bundle ID: $EXPECTED_BUNDLE"
echo "   Expected App ID: $EXPECTED_APP_ID"

echo ""
echo "🌐 Server AASA Validation:"

# Get server AASA content
SERVER_AASA=$(curl -s "https://54n8hcsj-3000.inc1.devtunnels.ms/.well-known/apple-app-site-association")
if [ -z "$SERVER_AASA" ]; then
    echo "❌ Cannot fetch AASA from server!"
    echo "   URL: https://54n8hcsj-3000.inc1.devtunnels.ms/.well-known/apple-app-site-association"
    exit 1
fi

echo "   Server AASA Content:"
echo "$SERVER_AASA" | jq . 2>/dev/null || echo "$SERVER_AASA"

# Check if our app ID is in the server AASA
if echo "$SERVER_AASA" | grep -q "$EXPECTED_APP_ID"; then
    echo "✅ Server AASA contains our App ID: $EXPECTED_APP_ID"
else
    echo "❌ Server AASA does NOT contain our App ID: $EXPECTED_APP_ID"
    echo "   Server contains:"
    echo "$SERVER_AASA" | grep -o '"appID": "[^"]*"' || echo "$SERVER_AASA" | grep -o '"appIDs": \[[^\]]*\]'
fi

echo ""
echo "📋 Local Entitlements Check:"
if [ -f "ios/VerryApp/VerryApp-Development.entitlements" ]; then
    echo "   Development entitlements domains:"
    grep -A10 "com.apple.developer.associated-domains" ios/VerryApp/VerryApp-Development.entitlements | grep "string" | sed 's/.*<string>\(.*\)<\/string>.*/      \1/'
else
    echo "❌ Development entitlements file not found!"
fi

echo ""
echo "🔧 Troubleshooting Steps:"

# Check if paths match
if echo "$SERVER_AASA" | grep -q "/verify/"; then
    echo "✅ Server AASA includes /verify/* paths"
else
    echo "❌ Server AASA missing /verify/* paths"
fi

echo ""
echo "🎯 Universal Links Testing Checklist:"
echo ""
echo "1. 📱 Build Configuration:"
echo "   • Use VerryAppDevelopment scheme in Xcode"
echo "   • Build for device (not simulator recommended)"
echo "   • Install and open app at least once"
echo ""
echo "2. 🌐 Browser Requirements:"
echo "   • MUST use Safari on iOS (Universal Links don't work in Chrome/Firefox)"
echo "   • Navigate to: https://54n8hcsj-3000.inc1.devtunnels.ms/verify/test123"
echo "   • Wait for page to fully load"
echo ""
echo "3. 🔍 Universal Link Recognition:"
echo "   • Long-press the URL in Safari address bar"
echo "   • Look for 'Open in VerryApp' option"
echo "   • Or look for smart app banner at top of webpage"
echo ""
echo "4. 🧹 If Still Not Working - Reset Steps:"
echo "   a) Settings → Safari → Clear History and Website Data"
echo "   b) Delete VerryApp completely"  
echo "   c) Restart iPhone/iPad"
echo "   d) Rebuild with VerryAppDevelopment scheme"
echo "   e) Install and open app once"
echo "   f) Test URL in Safari again"
echo ""
echo "5. 📊 Alternative Validation:"
echo "   • Custom scheme should work: verryapp://verify/test123"
echo "   • Try different path: https://54n8hcsj-3000.inc1.devtunnels.ms/v/test123"

echo ""
echo "🚨 Most Common Issues:"
echo "• Testing in wrong browser (must be Safari)"
echo "• App not opened after installation"
echo "• iOS cached old AASA file (clear Safari data)"
echo "• Server not serving AASA with correct Content-Type: application/json"

echo ""
echo "💡 Debug Tips:"
echo "• Check iOS Console logs for 'swcd' (Universal Links service)"
echo "• Verify server returns HTTP 200 for AASA file"
echo "• Test on fresh iOS device if available"
echo "• Some iOS versions have Universal Links bugs - try iOS 15+ if possible"