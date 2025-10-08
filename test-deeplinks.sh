#!/bin/bash

# Deep Link Testing Script for Verry.ai App
# Usage: ./test-deeplinks.sh

echo "🔗 Deep Link Testing Script for Verry.ai"
echo "========================================"

# Test URLs
VERIFICATION_ID="test-verification-123"
ATTEMPT_ID="test-attempt-456"

# iOS Simulator Testing
echo ""
echo "📱 iOS Simulator Testing:"
echo "------------------------"
echo "1. Custom URL Scheme (with both parameters):"
echo "   xcrun simctl openurl booted \"verryapp://verify?verification_id=${VERIFICATION_ID}&attempt_id=${ATTEMPT_ID}\""
echo ""
echo "2. Custom URL Scheme (verification only):"
echo "   xcrun simctl openurl booted \"verryapp://verify?verification_id=${VERIFICATION_ID}\""
echo ""
echo "3. Universal Link:"
echo "   xcrun simctl openurl booted \"https://verry.ai/verify/${VERIFICATION_ID}?attempt_id=${ATTEMPT_ID}\""

# Android Testing
echo ""
echo "🤖 Android Testing:"
echo "------------------"
echo "1. Custom URL Scheme (with both parameters):"
echo "   adb shell am start -W -a android.intent.action.VIEW -d \"verryapp://verify?verification_id=${VERIFICATION_ID}&attempt_id=${ATTEMPT_ID}\" com.appnoize.verry.ai"
echo ""
echo "2. Custom URL Scheme (verification only):"  
echo "   adb shell am start -W -a android.intent.action.VIEW -d \"verryapp://verify?verification_id=${VERIFICATION_ID}\" com.appnoize.verry.ai"
echo ""
echo "3. App Link:"
echo "   adb shell am start -W -a android.intent.action.VIEW -d \"https://verry.ai/verify/${VERIFICATION_ID}?attempt_id=${ATTEMPT_ID}\" com.appnoize.verry.ai"

# Test all formats
echo ""
echo "🧪 All Supported URL Formats:"
echo "-----------------------------"
echo "• verryapp://verify?verification_id=123&attempt_id=456"
echo "• verryapp://verify?verification_id=123"
echo "• verryapp://verify/123/attempt/456"
echo "• verryapp://verify/123"
echo "• verry://v/123/a/456"
echo "• https://verry.ai/verify/123?attempt_id=456"
echo "• https://app.verry.ai/verification/123"

echo ""
echo "💡 To run iOS simulator test:"
echo "   xcrun simctl openurl booted \"verryapp://verify?verification_id=test123&attempt_id=att456\""
echo ""
echo "💡 To run Android test:"  
echo "   adb shell am start -W -a android.intent.action.VIEW -d \"verryapp://verify?verification_id=test123&attempt_id=att456\" com.appnoize.verry.ai"