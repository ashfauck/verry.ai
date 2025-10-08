#!/bin/bash

# iOS 6-Configuration Auto Setup Script
# This script helps validate and complete the 6-configuration setup

PROJECT_DIR="/Users/ashfauck/Development/Projects/Personal/Verry.ai/ios"
WORKSPACE="$PROJECT_DIR/VerryApp.xcworkspace"

echo "🔧 iOS 6-Configuration Setup Assistant"
echo "======================================"

# Check if all xcconfig files exist
echo ""
echo "📁 Checking configuration files..."
configs=(
    "Debug.xcconfig"
    "Release.xcconfig"
    "Dev.Debug.xcconfig"
    "Dev.Release.xcconfig"
    "QA.Debug.xcconfig"
    "QA.Release.xcconfig"
)

all_exist=true
for config in "${configs[@]}"; do
    if [ -f "$PROJECT_DIR/$config" ]; then
        echo "✅ $config"
    else
        echo "❌ $config - MISSING"
        all_exist=false
    fi
done

if [ "$all_exist" = true ]; then
    echo ""
    echo "✅ All configuration files are ready!"
else
    echo ""
    echo "❌ Some configuration files are missing. Please create them first."
    exit 1
fi

echo ""
echo "🎯 Current Setup Status:"
echo "========================"

# Test current working configurations
echo ""
echo "Testing VerryAppDevelopment (Debug config):"
xcodebuild -workspace "$WORKSPACE" -scheme VerryAppDevelopment -configuration Debug -showBuildSettings 2>/dev/null | grep -E "(APP_DISPLAY_NAME|PRODUCT_BUNDLE_IDENTIFIER)" | head -2

echo ""
echo "📋 Next Steps in Xcode:"
echo "======================"
echo ""
echo "1. Open Xcode project: VerryApp.xcworkspace"
echo "2. Select VerryApp project → Info tab"
echo "3. Add 4 new configurations:"
echo "   - Duplicate Debug → 'Dev.Debug'"
echo "   - Duplicate Release → 'Dev.Release'"
echo "   - Duplicate Debug → 'QA.Debug'"  
echo "   - Duplicate Release → 'QA.Release'"
echo ""
echo "4. Set Configuration Files:"
echo "   - Debug: Debug.xcconfig"
echo "   - Release: Release.xcconfig"
echo "   - Dev.Debug: Dev.Debug.xcconfig"
echo "   - Dev.Release: Dev.Release.xcconfig"
echo "   - QA.Debug: QA.Debug.xcconfig"
echo "   - QA.Release: QA.Release.xcconfig"
echo ""
echo "5. Update schemes to use new configs:"
echo "   - VerryAppDevelopment → Dev.Debug/Dev.Release"
echo "   - VerryAppStaging → QA.Debug/QA.Release"
echo "   - VerryAppProduction → Debug/Release"
echo ""
echo "📖 Full guide available in: iOS-6-Config-Setup.md"
echo ""
echo "🚀 After setup, run this script again to test all configurations!"