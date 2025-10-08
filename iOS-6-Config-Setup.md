# iOS 6-Configuration Setup Guide

## 🎯 Target Structure
You want 6 total build configurations:

**Development Environment:**
- `Dev.Debug` → Development Debug (VerryApp Dev, .dev)
- `Dev.Release` → Development Release (VerryApp Dev, .dev)

**Staging Environment:**
- `QA.Debug` → Staging Debug (VerryApp Staging, .staging)
- `QA.Release` → Staging Release (VerryApp Staging, .staging)

**Production Environment:**
- `Debug` → Production Debug (VerryApp, no suffix)
- `Release` → Production Release (VerryApp, no suffix)

## ✅ Files Already Created
- `Debug.xcconfig` (Production Debug)
- `Release.xcconfig` (Production Release)
- `Dev.Debug.xcconfig` (Development Debug)
- `Dev.Release.xcconfig` (Development Release)
- `QA.Debug.xcconfig` (Staging Debug)
- `QA.Release.xcconfig` (Staging Release)

## 🔧 Manual Steps in Xcode

### Step 1: Add New Build Configurations
1. In Xcode, select the **VerryApp project** (top level in navigator)
2. Under **PROJECT → VerryApp**, click the **Info** tab
3. In the **Configurations** section:
   - Click **+** → **Duplicate "Debug" Configuration** → Name: `Dev.Debug`
   - Click **+** → **Duplicate "Release" Configuration** → Name: `Dev.Release`
   - Click **+** → **Duplicate "Debug" Configuration** → Name: `QA.Debug`
   - Click **+** → **Duplicate "Release" Configuration** → Name: `QA.Release`

### Step 2: Assign Configuration Files
For each configuration, set the **Configuration File**:
- **Debug**: `Debug.xcconfig`
- **Release**: `Release.xcconfig`
- **Dev.Debug**: `Dev.Debug.xcconfig`
- **Dev.Release**: `Dev.Release.xcconfig`
- **QA.Debug**: `QA.Debug.xcconfig`
- **QA.Release**: `QA.Release.xcconfig`

### Step 3: Update Schemes
Edit each scheme to use the appropriate configurations:

**VerryAppDevelopment scheme:**
- Build Configuration for Run: `Dev.Debug`
- Build Configuration for Test: `Dev.Debug`
- Build Configuration for Profile: `Dev.Release`
- Build Configuration for Analyze: `Dev.Debug`
- Build Configuration for Archive: `Dev.Release`

**VerryAppStaging scheme:**
- Build Configuration for Run: `QA.Debug`
- Build Configuration for Test: `QA.Debug`
- Build Configuration for Profile: `QA.Release`
- Build Configuration for Analyze: `QA.Debug`
- Build Configuration for Archive: `QA.Release`

**VerryAppProduction scheme:**
- Build Configuration for Run: `Debug`
- Build Configuration for Test: `Debug`
- Build Configuration for Profile: `Release`
- Build Configuration for Analyze: `Debug`
- Build Configuration for Archive: `Release`

## 🧪 Testing Commands
After setup, test each configuration:

```bash
# Development Debug
xcodebuild -workspace VerryApp.xcworkspace -scheme VerryAppDevelopment -configuration Dev.Debug -showBuildSettings | grep -E "(DISPLAY_NAME|PRODUCT_BUNDLE_IDENTIFIER)"

# Development Release
xcodebuild -workspace VerryApp.xcworkspace -scheme VerryAppDevelopment -configuration Dev.Release -showBuildSettings | grep -E "(DISPLAY_NAME|PRODUCT_BUNDLE_IDENTIFIER)"

# Staging Debug
xcodebuild -workspace VerryApp.xcworkspace -scheme VerryAppStaging -configuration QA.Debug -showBuildSettings | grep -E "(DISPLAY_NAME|PRODUCT_BUNDLE_IDENTIFIER)"

# Staging Release
xcodebuild -workspace VerryApp.xcworkspace -scheme VerryAppStaging -configuration QA.Release -showBuildSettings | grep -E "(DISPLAY_NAME|PRODUCT_BUNDLE_IDENTIFIER)"

# Production Debug
xcodebuild -workspace VerryApp.xcworkspace -scheme VerryAppProduction -configuration Debug -showBuildSettings | grep -E "(DISPLAY_NAME|PRODUCT_BUNDLE_IDENTIFIER)"

# Production Release
xcodebuild -workspace VerryApp.xcworkspace -scheme VerryAppProduction -configuration Release -showBuildSettings | grep -E "(DISPLAY_NAME|PRODUCT_BUNDLE_IDENTIFIER)"
```

## 🎯 Expected Results
- **Development**: "VerryApp Dev" with `dev.appnoize.verryai.dev`
- **Staging**: "VerryApp Staging" with `dev.appnoize.verryai.staging`
- **Production**: "VerryApp" with `dev.appnoize.verryai`

This gives you proper debug/release variants for each environment!