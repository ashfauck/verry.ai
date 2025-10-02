# Bundle ID Separation Guide

This document explains how to use separate bundle IDs for different environments, allowing you to install multiple versions of the app on the same device simultaneously.

## Overview

The Verry.ai app now supports separate bundle identifiers for each environment:

- **Development**: `dev.appnoize.verryai` (Verry Dev)
- **Staging**: `staging.appnoize.verryai` (Verry Staging)
- **Production**: `com.appnoize.verryai` (Verry)

This allows you to:
- Test different versions simultaneously on the same device
- Deploy to app stores with proper production bundle IDs
- Maintain separate app data for each environment

## iOS Configuration

### Xcconfig Files

The iOS configuration uses xcconfig files located in `ios/Config/`:

- `Development.xcconfig` - Development environment settings
- `Staging.xcconfig` - Staging environment settings
- `Production.xcconfig` - Production environment settings

### Key Settings

Each xcconfig file defines:
```
PRODUCT_BUNDLE_IDENTIFIER = {env}.appnoize.verryai (or com.appnoize.verryai for production)
DISPLAY_NAME = Verry {Environment}
APP_ENVIRONMENT = {environment}
ENVFILE = .env.{environment}
```

### Building for iOS

```bash
# Build development version
npx react-native run-ios --scheme VerryAppDevelopment

# Build staging version
npx react-native run-ios --scheme VerryAppStaging

# Build production version
npx react-native run-ios --scheme VerryAppProduction
```

## Android Configuration

### Product Flavors

Android uses product flavors defined in `android/app/build.gradle`:

```gradle
productFlavors {
    development {
        applicationId "dev.appnoize.verryai"
        versionNameSuffix "-dev"
        resValue "string", "app_name", "Verry Dev"
    }
    
    staging {
        applicationId "staging.appnoize.verryai"
        versionNameSuffix "-staging"
        resValue "string", "app_name", "Verry Staging"
    }
    
    production {
        applicationId "com.appnoize.verryai"
        resValue "string", "app_name", "Verry"
    }
}
```

### Building for Android

```bash
# Build development version
npx react-native run-android --variant developmentDebug

# Build staging version
npx react-native run-android --variant stagingDebug

# Build production version
npx react-native run-android --variant productionDebug
```

## Environment Configuration

Each environment loads its corresponding `.env` file:

- Development: `.env.development`
- Staging: `.env.staging`
- Production: `.env.production`

These files contain environment-specific settings like API URLs, feature flags, and configuration values.

## Testing Multiple Versions

With separate bundle IDs, you can:

1. Install development version: `dev.appnoize.verryai`
2. Install staging version: `staging.appnoize.verryai`
3. Install production version: `com.appnoize.verryai`

All three versions will appear as separate apps with different names and icons on your device.

## App Store Deployment

### iOS App Store

- Use the **Production** scheme (`VerryAppProduction`) for App Store builds
- Bundle ID: `com.appnoize.verryai`
- Display Name: "Verry"

### Google Play Store

- Use the **production** flavor for Play Store builds
- Application ID: `com.appnoize.verryai`
- App Name: "Verry"

## Troubleshooting

### Common Issues

1. **Bundle ID conflicts**: Make sure you're using the correct scheme/flavor
2. **Certificate issues**: Ensure your Apple Developer account has the correct bundle IDs registered
3. **Build failures**: Clean builds with `npx react-native clean` if switching between environments

### Verifying Bundle IDs

You can verify the bundle ID in built apps:

**iOS**: Check in Xcode organizer or device logs
**Android**: Check with `adb shell dumpsys package dev.appnoize.verryai`

## Next Steps

1. Register bundle IDs in Apple Developer Console
2. Configure app icons for each environment
3. Set up CI/CD pipelines for automated builds
4. Configure app distribution (TestFlight, Firebase App Distribution, etc.)

---

This setup provides a robust multi-environment deployment system that scales from development to production.