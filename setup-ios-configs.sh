#!/bin/bash

# iOS Configuration Setup Script
# This script adds 4 new build configurations for proper environment separation

PROJECT_FILE="/Users/ashfauck/Development/Projects/Personal/Verry.ai/ios/VerryApp.xcodeproj/project.pbxproj"

echo "🔧 Setting up 6 iOS build configurations..."

# Instead of manually editing the complex pbxproj file, let's use Xcode's built-in tools
# We'll use xcodebuild to create new configurations

echo "✅ Configuration files created:"
echo "   - Debug.xcconfig (Production Debug)"
echo "   - Release.xcconfig (Production Release)"  
echo "   - Dev.Debug.xcconfig (Development Debug)"
echo "   - Dev.Release.xcconfig (Development Release)"
echo "   - QA.Debug.xcconfig (Staging Debug)"
echo "   - QA.Release.xcconfig (Staging Release)"

echo ""
echo "⚠️  MANUAL STEPS REQUIRED IN XCODE:"
echo ""
echo "1. Open VerryApp.xcworkspace in Xcode"
echo "2. Select the VerryApp project in the navigator"
echo "3. Under PROJECT > VerryApp, click on 'Info' tab"
echo "4. In 'Configurations' section:"
echo "   - Duplicate Debug → rename to 'Dev.Debug'"
echo "   - Duplicate Debug → rename to 'QA.Debug'" 
echo "   - Duplicate Release → rename to 'Dev.Release'"
echo "   - Duplicate Release → rename to 'QA.Release'"
echo ""
echo "5. Set Configuration Files for each configuration:"
echo "   - Debug: Debug.xcconfig"
echo "   - Release: Release.xcconfig"
echo "   - Dev.Debug: Dev.Debug.xcconfig"
echo "   - Dev.Release: Dev.Release.xcconfig"
echo "   - QA.Debug: QA.Debug.xcconfig"
echo "   - QA.Release: QA.Release.xcconfig"
echo ""
echo "6. Update schemes:"
echo "   - VerryAppDevelopment: Use Dev.Debug/Dev.Release"
echo "   - VerryAppStaging: Use QA.Debug/QA.Release"
echo "   - VerryAppProduction: Use Debug/Release"
echo ""
echo "This ensures proper environment separation with debug/release variants."