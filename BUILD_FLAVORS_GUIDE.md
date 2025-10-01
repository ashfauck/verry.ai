# Build Flavors & Schemes Setup Guide

This guide explains how to set up Android build flavors and iOS schemes for the Verry.ai app with Development, Staging, and Production environments.

## 🤖 Android Build Flavors

### ✅ Completed Setup

Android flavors have been automatically configured with the following:

#### **Product Flavors**
- **Development**: `com.verryai.app.dev` - Verry Dev
- **Staging**: `com.verryai.app.staging` - Verry Staging  
- **Production**: `com.verryai.app` - Verry

#### **Build Variants**
- `developmentDebug` - Development with debug features
- `developmentRelease` - Development optimized build
- `stagingDebug` - Staging with debug features
- `stagingRelease` - Staging optimized build
- `productionDebug` - Production with debug features
- `productionRelease` - Production optimized build

#### **NPM Scripts**
```bash
npm run android:dev      # Development flavor
npm run android:staging  # Staging flavor  
npm run android:prod     # Production flavor
```

#### **Environment Configuration**
Each flavor uses its corresponding environment file:
- Development → `.env.development`
- Staging → `.env.staging`
- Production → `.env.production`

### **Testing Android Flavors**

```bash
# Build development APK
cd android && ./gradlew assembleDevelopmentDebug

# Build staging APK
cd android && ./gradlew assembleStagingRelease

# Build production APK
cd android && ./gradlew assembleProductionRelease
```

## 🍎 iOS Schemes Setup

### **Automated Setup Completed**

The setup script has created:
- `Info-Development.plist` - Development configuration
- `Info-Staging.plist` - Staging configuration  
- `Info-Production.plist` - Production configuration

### **Manual Xcode Configuration Required**

⚠️ **Important**: The following steps must be completed manually in Xcode:

#### **Step 1: Open Xcode**
```bash
cd ios && open VerryApp.xcworkspace
```

#### **Step 2: Create Build Configurations**
1. Select your project in the navigator
2. Go to **Info** tab
3. Under **Configurations**, duplicate existing configurations:
   - Duplicate **Debug** → **Development**
   - Duplicate **Debug** → **Staging**  
   - Duplicate **Release** → **Production**

#### **Step 3: Update Build Settings**
For each new configuration, update:

**Development Configuration:**
- Product Bundle Identifier: `com.verryai.app.dev`
- Info.plist File: `VerryApp/Info-Development.plist`
- Display Name: `Verry Dev`

**Staging Configuration:**
- Product Bundle Identifier: `com.verryai.app.staging`
- Info.plist File: `VerryApp/Info-Staging.plist`
- Display Name: `Verry Staging`

**Production Configuration:**
- Product Bundle Identifier: `com.verryai.app`
- Info.plist File: `VerryApp/Info-Production.plist`
- Display Name: `Verry`

#### **Step 4: Create Schemes**
1. Go to **Product** → **Scheme** → **Manage Schemes**
2. Duplicate the existing scheme 3 times:
   - `VerryAppDevelopment` (uses Development configuration)
   - `VerryAppStaging` (uses Staging configuration)
   - `VerryAppProduction` (uses Production configuration)

3. For each scheme, update:
   - Build Configuration for Run/Test/Profile/Analyze/Archive

#### **NPM Scripts**
Once schemes are created:
```bash
npm run ios:dev      # Development scheme
npm run ios:staging  # Staging scheme
npm run ios:prod     # Production scheme
```

## 🌍 Environment Files

Each environment uses its specific configuration:

### `.env.development`
- Development API endpoints
- Debug mode enabled
- Console logging enabled
- Lower security settings

### `.env.staging`
- Staging API endpoints
- Analytics enabled
- Crash reporting enabled
- Production-like settings

### `.env.production`
- Production API endpoints
- Analytics enabled
- Crash reporting enabled
- Maximum security
- No debug features

## 🚀 Build Commands Summary

### **Development Builds**
```bash
# Android
npm run android:dev

# iOS (after Xcode setup)
npm run ios:dev
```

### **Staging Builds**
```bash
# Android
npm run android:staging

# iOS (after Xcode setup)
npm run ios:staging
```

### **Production Builds**
```bash
# Android
npm run android:prod

# iOS (after Xcode setup)
npm run ios:prod
```

## 🎯 Benefits of This Setup

1. **Parallel Installation**: Install multiple versions on the same device
2. **Environment Isolation**: Separate API endpoints and configurations
3. **Easy Testing**: Quick switching between environments
4. **CI/CD Ready**: Automated builds for different environments
5. **App Store Distribution**: Clean production builds
6. **Visual Distinction**: Different app names and icons for each flavor

## 🔧 Troubleshooting

### **Android Build Issues**
```bash
# Clean build
cd android && ./gradlew clean
npm start -- --reset-cache
```

### **iOS Build Issues**
```bash
# Clean build
cd ios && xcodebuild clean
rm -rf ~/Library/Developer/Xcode/DerivedData/
```

### **Environment Variables Not Loading**
Ensure the correct ENVFILE is set in package.json scripts and restart Metro bundler.

## 📱 Testing Installation

After setup, you should be able to install multiple versions:
- **Verry Dev** (`com.verryai.app.dev`)
- **Verry Staging** (`com.verryai.app.staging`)
- **Verry** (`com.verryai.app`)

Each will have distinct app icons, names, and configurations while using the same codebase.