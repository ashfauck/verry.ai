# Deep Linking Implementation Guide

## 🔗 Overview

This implementation provides comprehensive deep linking support for the Verry.ai React Native app on both iOS and Android platforms.

## 📱 Platform Configurations

### iOS Configuration

#### Info.plist URL Schemes
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>com.appnoize.verryai.deeplink</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>verryapp</string>
      <string>verry</string>
    </array>
  </dict>
  <dict>
    <key>CFBundleURLName</key>
    <string>com.appnoize.verryai.universallink</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>https</string>
    </array>
  </dict>
</array>
```

#### Universal Links (Associated Domains)
```xml
<key>com.apple.developer.associated-domains</key>
<array>
  <string>applinks:verry.ai</string>
  <string>applinks:www.verry.ai</string>
  <string>applinks:app.verry.ai</string>
</array>
```

#### Entitlements File: `ios/VerryApp/VerryApp.entitlements`
- Automatically added to Xcode project
- Configured with CODE_SIGN_ENTITLEMENTS build setting

### Android Configuration

#### AndroidManifest.xml Intent Filters
```xml
<!-- Custom URL Schemes -->
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="verryapp" />
</intent-filter>

<!-- App Links (Universal Links) -->
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="https" android:host="verry.ai" />
</intent-filter>
```

## 🌐 Supported URL Formats

### Custom URL Schemes
```bash
# Primary scheme with query parameters
verryapp://verify?verification_id=abc123&attempt_id=def456
verryapp://verify?verification_id=abc123

# Alternative scheme
verry://verify?verification_id=abc123&attempt_id=def456

# Path-based parameters
verryapp://verify/abc123/attempt/def456
verryapp://verify/abc123

# Short form paths
verry://v/abc123/a/def456
verry://v/abc123
```

### Universal Links / App Links
```bash
# Primary domain
https://verry.ai/verify/abc123?attempt_id=def456
https://verry.ai/verify/abc123

# Alternative domains
https://www.verry.ai/verification/abc123
https://app.verry.ai/v/abc123/a/def456
```

## 🏗 Implementation Architecture

### Core Components

1. **`useDeepLinking` Hook** (`src/hooks/useDeepLinking.ts`)
   - Listens for deep link events
   - Extracts verification_id and attempt_id from URLs
   - Updates Recoil state with parsed parameters

2. **Deep Link Handler** (`App.tsx`)
   - Handles initial URL when app launches
   - Listens for URL changes while app is running
   - Integrates with React Navigation

3. **Onboarding Screen Logic** (`src/screens/OnboardingScreen.tsx`)
   - Checks for deep link parameters
   - Optimizes API calls based on available data
   - Routes users to appropriate screens

### URL Parsing Logic

```typescript
const extractDeepLinkParams = (url: string) => {
  // Supports multiple patterns:
  // - Query parameters: ?verification_id=123&attempt_id=456
  // - Path patterns: /verify/123/attempt/456
  // - Short forms: /v/123/a/456
  // - Mixed formats: /verify/123?attempt_id=456
};
```

### Navigation Flow

```typescript
if (!verificationId) {
  // No deep link - normal app flow
  navigation.navigate('EmailVerification');
} else if (verificationId && attemptId) {
  // Both parameters from deep link - skip API call
  navigation.navigate('EmailVerification'); 
} else {
  // Only verification_id - validate with API
  const result = await checkVerificationStatus(verificationId);
  // Route based on API response...
}
```

## 🧪 Testing

### iOS Simulator Testing
```bash
# Test with verification and attempt IDs
xcrun simctl openurl booted "verryapp://verify?verification_id=test123&attempt_id=att456"

# Test with verification ID only
xcrun simctl openurl booted "verryapp://verify?verification_id=test123"

# Test universal link
xcrun simctl openurl booted "https://verry.ai/verify/test123?attempt_id=att456"
```

### Android Testing
```bash
# Test with ADB
adb shell am start -W -a android.intent.action.VIEW -d "verryapp://verify?verification_id=test123&attempt_id=att456" com.appnoize.verryai

# Test app link
adb shell am start -W -a android.intent.action.VIEW -d "https://verry.ai/verify/test123" com.appnoize.verryai
```

### Automated Testing Script
```bash
# Run the provided test script
./test-deeplinks.sh
```

## 🌍 Universal Links Setup

### For Production Deployment

1. **Apple App Site Association** (`apple-app-site-association`)
   - Deploy to `https://verry.ai/.well-known/apple-app-site-association`
   - No file extension required
   - Must be served with `application/json` content type

2. **Android Asset Links** (`assetlinks.json`)
   - Deploy to `https://verry.ai/.well-known/assetlinks.json`
   - Update SHA256 fingerprints with actual signing certificates
   - Must be served with `application/json` content type

### Certificate Fingerprints

#### Get Android SHA256 Fingerprint
```bash
# Debug keystore
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# Release keystore  
keytool -list -v -keystore /path/to/release.keystore -alias your-alias
```

#### iOS Team ID
- Team ID: `Z3VKCZH574` (already configured)
- Bundle IDs: `com.appnoize.verry.ai`, `staging.appnoize.verry.ai`, `dev.appnoize.verry.ai`

## 🔧 Debugging

### Enable Debug Logging
The implementation includes comprehensive logging:
```typescript
console.log('🔗 Parsing deep link URL:', url);
console.log('🔍 Extracted params:', { verificationId, attemptId });
```

### Verification Steps
1. Check console logs for deep link events
2. Verify URL parsing with test URLs
3. Confirm state updates in Recoil DevTools
4. Test navigation flow with different parameter combinations

## ⚡ Performance Optimizations

1. **Skip API Calls**: When both verification_id and attempt_id are provided via deep link
2. **Efficient Parsing**: Single-pass URL parsing with multiple pattern support
3. **Lazy Loading**: Deep link handling only activates when needed
4. **Memory Management**: Proper cleanup of event listeners

## 🚀 Deployment Checklist

### iOS App Store
- [ ] Code signing with proper team ID
- [ ] Entitlements file configured
- [ ] Associated domains entitlement
- [ ] Apple App Site Association file deployed

### Android Play Store  
- [ ] Intent filters configured
- [ ] App signing certificate generated
- [ ] SHA256 fingerprint updated in assetlinks.json
- [ ] Asset links file deployed
- [ ] App Links verification enabled

### Domain Configuration
- [ ] Deploy `apple-app-site-association` to `/.well-known/`
- [ ] Deploy `assetlinks.json` to `/.well-known/`
- [ ] Configure HTTPS with valid SSL certificate
- [ ] Test universal links in production environment

## 📋 Troubleshooting

### Common Issues

1. **Links not opening app**
   - Verify URL schemes in platform configs
   - Check intent filter priority on Android
   - Ensure app is installed and signed correctly

2. **Universal links falling back to browser**
   - Verify associated domains configuration
   - Check `.well-known` file deployment and accessibility
   - Validate JSON syntax in association files

3. **Parameters not being parsed**
   - Check console logs for parsing errors
   - Verify URL format matches supported patterns
   - Test with different URL encoding

### Debug Commands
```bash
# Test iOS universal link validation
xcrun simctl openurl booted "https://verry.ai/verify/test123"

# Test Android app link verification
adb shell dumpsys package domain-preferred-apps

# Check Android intent resolution
adb shell am start -W -a android.intent.action.VIEW -d "verryapp://verify?verification_id=test123"
```