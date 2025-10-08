#!/bin/bash

# Verification script to show the multi-environment configuration

echo "🔍 Multi-Environment Associated Domains Verification"
echo "===================================================="

echo ""
echo "📱 Build Configuration → Entitlements Mapping:"
echo ""

# Function to show entitlements for a specific file
show_entitlements() {
    local file=$1
    local label=$2
    
    echo "🏷️  $label"
    echo "   File: $file"
    
    if [ -f "$file" ]; then
        echo "   Associated Domains:"
        # Extract associated domains from the entitlements file
        domains=$(grep -A10 "com.apple.developer.associated-domains" "$file" | grep "string" | sed 's/.*<string>\(.*\)<\/string>.*/\1/' | sed 's/^/      • /')
        if [ -n "$domains" ]; then
            echo "$domains"
        else
            echo "      (none found)"
        fi
    else
        echo "   ❌ File not found!"
    fi
    echo ""
}

echo "🧪 DEVELOPMENT Configuration:"
show_entitlements "ios/VerryApp/VerryApp-Development.entitlements" "Dev.Debug & Dev.Release"

echo "🚧 STAGING Configuration:"
show_entitlements "ios/VerryApp/VerryApp-Staging.entitlements" "QA.Debug & QA.Release"

echo "🚀 PRODUCTION Configuration:"
show_entitlements "ios/VerryApp/VerryApp-Production.entitlements" "Debug & Release"

echo "🔗 Test URLs for Each Configuration:"
echo ""
echo "Development (use VerryAppDevelopment scheme):"
echo "   • https://54n8hcsj-3000.inc1.devtunnels.ms/verify/test123"
echo "   • https://localhost:3000/verify/test123"
echo "   • verryapp://verify/test123"
echo ""
echo "Staging (use VerryAppStaging scheme):"
echo "   • https://staging.verry.ai/verify/test123"
echo "   • https://qa.verry.ai/verify/test123"
echo "   • verryapp://verify/test123"
echo ""
echo "Production (use VerryApp scheme):"
echo "   • https://verry.ai/verify/test123"
echo "   • https://www.verry.ai/verify/test123"
echo "   • verryapp://verify/test123"

echo ""
echo "✅ Configuration Status:"

# Check if Xcode project has the right entitlements
if grep -q "VerryApp-Development.entitlements" ios/VerryApp.xcodeproj/project.pbxproj; then
    echo "   ✅ Development entitlements configured in Xcode"
else
    echo "   ❌ Development entitlements NOT found in Xcode"
fi

if grep -q "VerryApp-Staging.entitlements" ios/VerryApp.xcodeproj/project.pbxproj; then
    echo "   ✅ Staging entitlements configured in Xcode"
else
    echo "   ❌ Staging entitlements NOT found in Xcode"
fi

if grep -q "VerryApp-Production.entitlements" ios/VerryApp.xcodeproj/project.pbxproj; then
    echo "   ✅ Production entitlements configured in Xcode"
else
    echo "   ❌ Production entitlements NOT found in Xcode"
fi

echo ""
echo "🎯 How to Test:"
echo "1. Open Xcode workspace: ios/VerryApp.xcworkspace"
echo "2. Select scheme based on what you want to test:"
echo "   • VerryAppDevelopment → Tests tunnel URL and dev domains"
echo "   • VerryAppStaging → Tests staging domains"
echo "   • VerryApp → Tests production domains only"
echo "3. Build and install with the selected scheme"
echo "4. Test the appropriate URLs for that environment"
echo ""
echo "🔥 Your tunnel URL should now work with VerryAppDevelopment scheme!"
echo "   Test: https://54n8hcsj-3000.inc1.devtunnels.ms/verify/test123"