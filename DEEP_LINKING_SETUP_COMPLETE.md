# Verry.ai Deep Linking Setup - Complete Implementation Guide

## 🎉 Implementation Status

✅ **COMPLETED:**
- Bundle ID migration from "verryai" to "verry.ai" across all iOS configurations
- Android package name updates for all flavors
- iOS Universal Links (AASA) files for all environments
- Android App Links (Asset Links) files with real fingerprints for dev/staging
- Custom URL scheme configuration (verryapp://, verry://)
- Comprehensive utility scripts for deployment and testing
- Certificate fingerprint extraction for Android debug keystore

⚠️ **PENDING:**
- Production Android keystore fingerprint (placeholder currently used)
- iOS Team ID update in AASA files (replace XXXXXXXXXX)
- Web server deployment of .well-known files
- Domain DNS setup for environment-specific subdomains

## 📱 Configuration Summary

### iOS Bundle IDs
- **Development:** `dev.appnoize.verry.ai`
- **Staging:** `staging.appnoize.verry.ai`  
- **Production:** `com.appnoize.verry.ai`

### Android Package Names
- **Development:** `dev.appnoize.verry.ai`
- **Staging:** `staging.appnoize.verry.ai`
- **Production:** `com.appnoize.verry.ai`

### URL Schemes
- **Custom Schemes:** `verryapp://`, `verry://`
- **Universal/App Links:** 
  - Development: `https://dev.verry.ai`
  - Staging: `https://staging.verry.ai`
  - Production: `https://verry.ai`

### Android Certificate Fingerprint (Debug)
```
4D:42:4D:8C:97:62:C6:0C:CC:D2:C3:BD:96:4F:99:85:FA:05:00:77:B3:EB:47:E3:85:5A:2D:94:9E:F9:3F:F8
```

## 📁 Generated Files Structure

```
├── web-assets/
│   ├── aasa/
│   │   ├── apple-app-site-association-development.json
│   │   ├── apple-app-site-association-staging.json
│   │   └── apple-app-site-association-production.json
│   └── assetlinks/
│       ├── assetlinks-development.json ✅ (with real fingerprint)
│       ├── assetlinks-staging.json ✅ (with real fingerprint)
│       └── assetlinks-production.json ⚠️ (placeholder fingerprint)
├── .well-known/ (ready for deployment)
│   ├── assetlinks-dev.json ✅
│   ├── assetlinks-staging.json ✅
│   └── assetlinks.json ⚠️ (placeholder)
└── scripts/
    ├── generate-android-fingerprints.sh ✅
    ├── deploy-web-assets.sh ✅
    ├── test-deep-links.sh ✅
    └── validate-deep-linking.sh ✅
```

## 🚀 Next Steps (Action Items)

### 1. iOS Team ID Configuration
Update your iOS Team ID in all AASA files:
```bash
# Find your Team ID in Apple Developer Console
# Replace XXXXXXXXXX in all AASA files with your actual Team ID
sed -i '' 's/XXXXXXXXXX/YOUR_TEAM_ID/g' web-assets/aasa/*.json
```

### 2. Production Android Keystore
When you have your production keystore ready:
```bash
# Extract production fingerprint
keytool -list -v -keystore /path/to/production.keystore -alias production_alias -storepass your_password | grep SHA256

# Update production Asset Links file
# Replace REPLACE_WITH_PRODUCTION_FINGERPRINT in:
# - web-assets/assetlinks/assetlinks-production.json
# - .well-known/assetlinks.json
```

### 3. Web Server Deployment
Deploy the .well-known files to your web servers:
```bash
# Use the deployment script
./scripts/deploy-web-assets.sh

# Or manually copy files to:
# https://verry.ai/.well-known/assetlinks.json
# https://staging.verry.ai/.well-known/assetlinks.json  
# https://dev.verry.ai/.well-known/assetlinks.json
# https://verry.ai/.well-known/apple-app-site-association-production
# https://staging.verry.ai/.well-known/apple-app-site-association-staging
# https://dev.verry.ai/.well-known/apple-app-site-association-development
```

### 4. Server Configuration
Ensure your web server serves the files with correct headers:
```nginx
# Nginx example
location /.well-known/apple-app-site-association* {
    add_header Content-Type application/json;
}

location /.well-known/assetlinks*.json {
    add_header Content-Type application/json;
}
```

### 5. Testing
```bash
# Validate deployment
curl -H 'Accept: application/json' https://verry.ai/.well-known/assetlinks.json

# Test deep links
./scripts/test-deep-links.sh

# Run comprehensive validation
./scripts/validate-deep-linking.sh
```

## 🧪 Test URLs for Validation

### Custom URL Schemes
```
verryapp://auth/verify?code=123456
verry://verify/document?id=abc123
verryapp://app/home
```

### Universal/App Links
```
https://dev.verry.ai/auth/verify?code=123456
https://staging.verry.ai/verify/document?id=abc123  
https://verry.ai/app/home
```

### Device Testing Commands
```bash
# iOS Simulator
xcrun simctl openurl booted "verryapp://auth/verify?code=123456"

# Android Device/Emulator
adb shell am start -W -a android.intent.action.VIEW -d "https://verry.ai/verify/test123" com.appnoize.verry.ai
```

## 🔧 Troubleshooting

### Common Issues & Solutions

1. **Deep links not working on iOS**
   - Verify Team ID is correct in AASA files
   - Check AASA files are accessible via HTTPS
   - Ensure Content-Type is application/json

2. **App Links not working on Android**  
   - Verify certificate fingerprints match your keystore
   - Check Asset Links files are accessible via HTTPS
   - Ensure package names match your app flavors

3. **Universal Links not working**
   - Verify domain ownership
   - Check DNS configuration for subdomains
   - Ensure web server serves files without redirects

### Validation Tools
- **iOS:** [Apple App Site Association Validator](https://search.developer.apple.com/appsearch-validation-tool/)
- **Android:** [Digital Asset Links Tester](https://developers.google.com/digital-asset-links/tools/generator)

## 📚 Documentation References
- [iOS Universal Links](https://developer.apple.com/documentation/xcode/defining-a-custom-url-scheme-for-your-app)
- [Android App Links](https://developer.android.com/training/app-links)
- [Digital Asset Links](https://developers.google.com/digital-asset-links/v1/getting-started)

## 🎯 Success Criteria
- [ ] Custom URL schemes work from any app
- [ ] Universal Links work from Safari/Chrome  
- [ ] App Links work from Android browsers
- [ ] Fallback web pages load when app not installed
- [ ] Deep links navigate to correct app screens
- [ ] All environments (dev/staging/production) functional

---

**Generated on:** $(date)  
**Status:** Deep linking infrastructure complete, pending production keystore and deployment