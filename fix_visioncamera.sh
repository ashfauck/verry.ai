#!/bin/bash

echo "🔍 VisionCamera Diagnostic and Fix Script"
echo "========================================"

# 1. Check VisionCamera version
echo "📋 Current VisionCamera Version:"
grep -A1 "react-native-vision-camera" package.json

# 2. Check iOS deployment target
echo -e "\n📱 iOS Deployment Target:"
grep -A1 "IPHONEOS_DEPLOYMENT_TARGET" ios/VerryApp.xcodeproj/project.pbxproj | head -2

# 3. Check New Architecture settings
echo -e "\n🏗️ New Architecture Settings:"
echo "- .xcode.env.local:"
cat ios/.xcode.env.local | grep RCT_NEW_ARCH
echo "- Info.plist:"
grep -A1 "RCTNewArchEnabled" ios/VerryApp/Info.plist

# 4. Check VisionCamera pod installation
echo -e "\n📦 VisionCamera Pod Status:"
if [ -d "ios/Pods/VisionCamera" ]; then
    echo "✅ VisionCamera pod is installed"
    ls -la ios/Pods/VisionCamera/ | head -5
else
    echo "❌ VisionCamera pod not found"
fi

# 5. Check for common error patterns in VisionCamera source
echo -e "\n🐛 Checking for UIWindowScene issues:"
if find ios/Pods/VisionCamera -name "*.swift" -o -name "*.m" -o -name "*.mm" 2>/dev/null | xargs grep -l "UIWindowScene" 2>/dev/null; then
    echo "⚠️ Found UIWindowScene references - this might be causing issues"
else
    echo "✅ No UIWindowScene references found"
fi

# 6. Quick fix suggestions
echo -e "\n🛠️ Quick Fix Options:"
echo "1. Try building in Xcode now - VisionCamera 2.16.8 should be more stable"
echo "2. If still errors, clean Xcode: Product → Clean Build Folder"
echo "3. If UIWindowScene errors persist, consider removing VisionCamera temporarily"

# 7. Alternative camera libraries
echo -e "\n📸 Alternative Camera Libraries (if VisionCamera fails):"
echo "- react-native-camera (older but stable)"
echo "- expo-camera (if using Expo)"
echo "- react-native-image-picker (for simple photo capture)"

echo -e "\n✅ Diagnostic complete! Check the output above for issues."