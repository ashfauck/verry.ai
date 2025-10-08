#!/bin/bash

echo "🔍 Team ID Verification & Final Configuration Check"
echo "=================================================="

echo ""
echo "📱 Team ID Analysis:"
echo ""

# Check Xcode project team ID
XCODE_TEAM_ID=$(grep "DEVELOPMENT_TEAM" ios/VerryApp.xcodeproj/project.pbxproj | head -1 | sed 's/.*= \(.*\);/\1/' | tr -d ' ')
echo "✅ Xcode Project Team ID: $XCODE_TEAM_ID"

# Check server AASA
echo ""
echo "🌐 Server AASA File:"
SERVER_AASA=$(curl -s "https://54n8hcsj-3000.inc1.devtunnels.ms/.well-known/apple-app-site-association")
if echo "$SERVER_AASA" | grep -q "$XCODE_TEAM_ID"; then
    echo "✅ Server AASA uses correct Team ID: $XCODE_TEAM_ID"
    echo "   App ID: $(echo "$SERVER_AASA" | grep -o '"appID": "[^"]*"' | cut -d'"' -f4)"
else
    echo "❌ Server AASA Team ID mismatch!"
    echo "   Expected: $XCODE_TEAM_ID"
    echo "   Server has: $(echo "$SERVER_AASA" | grep -o '"appID": "[^"]*"' | cut -d'"' -f4)"
fi

# Check local AASA files
echo ""
echo "📁 Local AASA Files:"

check_local_aasa() {
    local file=$1
    local label=$2
    
    if [ -f "$file" ]; then
        if grep -q "$XCODE_TEAM_ID" "$file"; then
            echo "✅ $label: Correct Team ID ($XCODE_TEAM_ID)"
        else
            echo "❌ $label: Wrong Team ID"
            echo "   Found: $(grep -o '".*\..*\..*\..*"' "$file" | head -1)"
        fi
    else
        echo "❌ $label: File not found"
    fi
}

check_local_aasa "web-assets/aasa/apple-app-site-association-development.json" "Development AASA"
check_local_aasa "web-assets/aasa/apple-app-site-association-staging.json" "Staging AASA"  
check_local_aasa "web-assets/aasa/apple-app-site-association-production.json" "Production AASA"
check_local_aasa "apple-app-site-association" "Main AASA"

echo ""
echo "📋 Bundle ID Configuration:"
DEV_PREFIX=$(grep "BUNDLE_ID_PREFIX.*dev" ios/Dev.Debug.xcconfig | cut -d'=' -f2 | xargs)
DEV_SUFFIX=$(grep "BUNDLE_ID_SUFFIX" ios/Dev.Debug.xcconfig | cut -d'=' -f2 | xargs)
echo "   Development Bundle ID: ${DEV_PREFIX}${DEV_SUFFIX}"
echo "   Expected App ID: ${XCODE_TEAM_ID}.${DEV_PREFIX}${DEV_SUFFIX}"

echo ""
echo "🎯 Configuration Status:"
if echo "$SERVER_AASA" | grep -q "${XCODE_TEAM_ID}.${DEV_PREFIX}${DEV_SUFFIX}"; then
    echo "✅ Perfect! Server AASA matches your app configuration"
    echo ""
    echo "🚀 Ready to Test Universal Links:"
    echo "   1. Build with VerryAppDevelopment scheme"
    echo "   2. Install and open the app once"
    echo "   3. Test in Safari: https://54n8hcsj-3000.inc1.devtunnels.ms/verify/test123"
    echo "   4. Long-press URL to see 'Open in VerryApp' option"
else
    echo "❌ Configuration mismatch detected"
    echo "   Check the details above and fix any mismatches"
fi

echo ""
echo "🔧 Current Team ID Summary:"
echo "   Your Apple Developer Team ID: $XCODE_TEAM_ID"
echo "   This ID must match in all AASA files for Universal Links to work"