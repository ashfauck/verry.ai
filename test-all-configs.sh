#!/bin/bash

# Test All iOS Configurations Script
# Run this after completing the 6-configuration setup in Xcode

PROJECT_DIR="/Users/ashfauck/Development/Projects/Personal/Verry.ai/ios"
WORKSPACE="$PROJECT_DIR/VerryApp.xcworkspace"

echo "🧪 Testing All iOS Configurations"
echo "================================="

test_config() {
    local scheme=$1
    local config=$2
    local expected_name=$3
    local expected_bundle=$4
    
    echo ""
    echo "Testing: $scheme with $config"
    echo "Expected: $expected_name | $expected_bundle"
    echo "----------------------------------------"
    
    result=$(xcodebuild -workspace "$WORKSPACE" -scheme "$scheme" -configuration "$config" -showBuildSettings 2>/dev/null | grep -E "(APP_DISPLAY_NAME|PRODUCT_BUNDLE_IDENTIFIER)")
    
    if [ -n "$result" ]; then
        echo "$result"
        
        # Check if results match expectations
        if echo "$result" | grep -q "$expected_name" && echo "$result" | grep -q "$expected_bundle"; then
            echo "✅ PASS"
        else
            echo "❌ FAIL - Values don't match expectations"
        fi
    else
        echo "❌ FAIL - No build settings found"
    fi
}

echo ""
echo "🏗️  Development Environment Tests:"
test_config "VerryAppDevelopment" "Dev.Debug" "VerryApp Dev" "dev.appnoize.verryai.dev"
test_config "VerryAppDevelopment" "Dev.Release" "VerryApp Dev" "dev.appnoize.verryai.dev"

echo ""
echo "🧪 Staging Environment Tests:"
test_config "VerryAppStaging" "QA.Debug" "VerryApp Staging" "dev.appnoize.verryai.staging"
test_config "VerryAppStaging" "QA.Release" "VerryApp Staging" "dev.appnoize.verryai.staging"

echo ""
echo "🚀 Production Environment Tests:"
test_config "VerryAppProduction" "Debug" "VerryApp" "dev.appnoize.verryai"
test_config "VerryAppProduction" "Release" "VerryApp" "dev.appnoize.verryai"

echo ""
echo "======================================="
echo "🎯 Configuration Matrix Summary:"
echo "======================================="
echo "Development:"
echo "  - Dev.Debug: VerryApp Dev (.dev)"
echo "  - Dev.Release: VerryApp Dev (.dev)"
echo ""
echo "Staging:" 
echo "  - QA.Debug: VerryApp Staging (.staging)"
echo "  - QA.Release: VerryApp Staging (.staging)"
echo ""
echo "Production:"
echo "  - Debug: VerryApp (no suffix)"
echo "  - Release: VerryApp (no suffix)"
echo ""
echo "If any tests failed, check the configuration setup in Xcode!"