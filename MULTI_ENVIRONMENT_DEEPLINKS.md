# Multi-Environment Associated Domains Configuration

## 📋 Overview

Your Verry.ai app now supports **separate associated domains** for each build configuration, allowing clean separation between development, staging, and production environments.

## 🏗️ Build Configurations

### 🧪 Development Configuration
- **Bundle ID**: `dev.appnoize.verry.ai`
- **Entitlements**: `VerryApp-Development.entitlements`
- **Scheme**: `VerryAppDevelopment`
- **Associated Domains**:
  - `applinks:dev.verry.ai`
  - `applinks:54n8hcsj-3000.inc1.devtunnels.ms` *(test tunnel)*
  - `applinks:localhost:3000` *(local development)*
  - `applinks:127.0.0.1:3000` *(local development)*

### 🚧 Staging Configuration
- **Bundle ID**: `staging.appnoize.verry.ai`
- **Entitlements**: `VerryApp-Staging.entitlements`
- **Scheme**: `VerryAppStaging`
- **Associated Domains**:
  - `applinks:staging.verry.ai`
  - `applinks:qa.verry.ai`
  - `applinks:test.verry.ai`

### 🚀 Production Configuration
- **Bundle ID**: `com.appnoize.verry.ai`
- **Entitlements**: `VerryApp-Production.entitlements`
- **Scheme**: `VerryApp`
- **Associated Domains**:
  - `applinks:verry.ai`
  - `applinks:www.verry.ai`
  - `applinks:app.verry.ai`

## 📁 File Structure

```
ios/
├── VerryApp/
│   ├── VerryApp-Development.entitlements    # Dev domains + test URLs
│   ├── VerryApp-Staging.entitlements        # Staging domains
│   └── VerryApp-Production.entitlements     # Production domains only
└── *.xcconfig files                         # Updated with CODE_SIGN_ENTITLEMENTS

web-assets/
├── aasa/
│   ├── apple-app-site-association-development.json
│   ├── apple-app-site-association-staging.json
│   └── apple-app-site-association-production.json
└── assetlinks/
    ├── assetlinks-development.json
    ├── assetlinks-staging.json
    └── assetlinks-production.json
```

## 🔗 Testing URLs

### Development Environment
```bash
# Universal Links (test in Safari)
https://54n8hcsj-3000.inc1.devtunnels.ms/verify/test123
https://localhost:3000/verify/test123

# Custom Scheme (works everywhere)
verryapp://verify/test123
```

### Staging Environment
```bash
# Universal Links (test in Safari)
https://staging.verry.ai/verify/test123
https://qa.verry.ai/verify/test123

# Custom Scheme (works everywhere)  
verryapp://verify/test123
```

### Production Environment
```bash
# Universal Links (test in Safari)
https://verry.ai/verify/test123
https://www.verry.ai/verify/test123

# Custom Scheme (works everywhere)
verryapp://verify/test123
```

## 🧪 How to Test

1. **Select Build Configuration in Xcode**:
   - `VerryAppDevelopment` → for testing with tunnel URLs
   - `VerryAppStaging` → for testing staging domains
   - `VerryApp` → for testing production domains

2. **Build & Install** the app with the selected configuration

3. **Test Deep Links**:
   - **Custom Schemes**: Work immediately in any app/browser
   - **Universal Links**: Must test in Safari (iOS) or Chrome (Android)

4. **Troubleshooting Universal Links**:
   - Clear Safari website data: Settings → Safari → Advanced → Website Data → Remove All
   - Ensure app is installed and opened at least once
   - Long-press URLs in Safari to see "Open in VerryApp" option

## ✅ Benefits

- **🔒 Secure Separation**: Production builds can't accidentally handle dev/test URLs
- **🧪 Flexible Testing**: Development builds support tunnel URLs and localhost
- **📊 Environment Clarity**: Each build clearly shows which domains it handles
- **🚀 Production Ready**: Clean production configuration without dev artifacts
- **🔄 Easy Switching**: Change Xcode scheme to test different environments

## 🎯 Current Status

✅ **Custom Schemes Working**: `verryapp://verify/test123` opens your dev app  
✅ **Multi-Environment Setup**: Separate entitlements for each configuration  
✅ **AASA Files Ready**: Environment-specific AASA files created  
✅ **Asset Links Ready**: Android deep linking files configured  

**Next**: Test Universal Links in Safari with your tunnel URL: `https://54n8hcsj-3000.inc1.devtunnels.ms/verify/test123`

## 📞 Support

If Universal Links still don't work after following the troubleshooting steps:

1. Check that your test server serves the AASA file at: `https://54n8hcsj-3000.inc1.devtunnels.ms/.well-known/apple-app-site-association`
2. Verify the app bundle ID matches the environment configuration
3. Try uninstalling and reinstalling the app
4. Check iOS logs for Universal Links validation errors