#!/bin/bash

echo "🔐 Generating Android App Signing Certificate Fingerprints for All Flavors"
echo "========================================================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to get SHA256 fingerprint
get_sha256_fingerprint() {
    local keystore_path=$1
    local alias=$2
    local storepass=$3
    local keypass=$4
    local environment=$5
    
    echo -e "\n${BLUE}🔑 Getting fingerprint for $environment environment...${NC}"
    echo "Keystore: $keystore_path"
    echo "Alias: $alias"
    
    if [ ! -f "$keystore_path" ]; then
        echo -e "${RED}❌ Keystore not found: $keystore_path${NC}"
        return 1
    fi
    
    # Get SHA256 fingerprint
    fingerprint=$(keytool -list -v \
        -keystore "$keystore_path" \
        -alias "$alias" \
        -storepass "$storepass" \
        -keypass "$keypass" 2>/dev/null | \
        grep "SHA256:" | \
        cut -d' ' -f3)
    
    if [ -z "$fingerprint" ]; then
        echo -e "${RED}❌ Failed to get fingerprint for $alias${NC}"
        echo "Try running manually:"
        echo "keytool -list -v -keystore \"$keystore_path\" -alias \"$alias\""
        return 1
    fi
    
    echo -e "${GREEN}✅ SHA256 Fingerprint: $fingerprint${NC}"
    echo "$fingerprint"
}

# Function to generate asset links for a flavor
generate_asset_links() {
    local package_name=$1
    local fingerprint=$2
    local environment=$3
    local filename=$4
    
    echo -e "\n${PURPLE}📄 Generating Asset Links for $environment...${NC}"
    
    cat > "$filename" << EOF
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "$package_name",
      "sha256_cert_fingerprints": [
        "$fingerprint"
      ]
    }
  }
]
EOF
    
    # Validate JSON
    if jq . "$filename" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Asset Links file created: $filename${NC}"
    else
        echo -e "${RED}❌ Invalid JSON generated for $filename${NC}"
    fi
}

# Create .well-known directory if it doesn't exist
mkdir -p .well-known

echo -e "${YELLOW}📱 Starting fingerprint generation for all flavors...${NC}"

# =============================================================================
# DEVELOPMENT FLAVOR (Debug Keystore)
# =============================================================================
echo -e "\n${YELLOW}=== DEVELOPMENT FLAVOR ===${NC}"
DEBUG_KEYSTORE="$HOME/.android/debug.keystore"
DEV_PACKAGE="dev.appnoize.verry.ai"

if [ -f "$DEBUG_KEYSTORE" ]; then
    DEV_FINGERPRINT=$(get_sha256_fingerprint "$DEBUG_KEYSTORE" "androiddebugkey" "android" "android" "Development")
    
    if [ ! -z "$DEV_FINGERPRINT" ]; then
        generate_asset_links "$DEV_PACKAGE" "$DEV_FINGERPRINT" "Development" ".well-known/assetlinks-dev.json"
    fi
else
    echo -e "${RED}❌ Debug keystore not found at $DEBUG_KEYSTORE${NC}"
    echo "Please ensure Android SDK is properly installed"
fi

# =============================================================================
# STAGING FLAVOR (Release Keystore or Custom)
# =============================================================================
echo -e "\n${YELLOW}=== STAGING FLAVOR ===${NC}"
STAGING_PACKAGE="staging.appnoize.verry.ai"

echo "Please provide staging keystore information:"
read -p "Staging keystore path (or press Enter to use debug): " STAGING_KEYSTORE
STAGING_KEYSTORE=${STAGING_KEYSTORE:-$DEBUG_KEYSTORE}

if [ "$STAGING_KEYSTORE" = "$DEBUG_KEYSTORE" ]; then
    read -p "Staging keystore alias [androiddebugkey]: " STAGING_ALIAS
    STAGING_ALIAS=${STAGING_ALIAS:-"androiddebugkey"}
    STAGING_STOREPASS="android"
    STAGING_KEYPASS="android"
else
    read -p "Staging keystore alias: " STAGING_ALIAS
    read -s -p "Staging keystore password: " STAGING_STOREPASS
    echo ""
    read -s -p "Staging key password [same as keystore]: " STAGING_KEYPASS
    STAGING_KEYPASS=${STAGING_KEYPASS:-$STAGING_STOREPASS}
    echo ""
fi

STAGING_FINGERPRINT=$(get_sha256_fingerprint "$STAGING_KEYSTORE" "$STAGING_ALIAS" "$STAGING_STOREPASS" "$STAGING_KEYPASS" "Staging")

if [ ! -z "$STAGING_FINGERPRINT" ]; then
    generate_asset_links "$STAGING_PACKAGE" "$STAGING_FINGERPRINT" "Staging" ".well-known/assetlinks-staging.json"
fi

# =============================================================================
# PRODUCTION FLAVOR (Release Keystore)
# =============================================================================
echo -e "\n${YELLOW}=== PRODUCTION FLAVOR ===${NC}"
PROD_PACKAGE="com.appnoize.verry.ai"

echo "Please provide production keystore information:"
read -p "Production keystore path: " PROD_KEYSTORE

if [ -z "$PROD_KEYSTORE" ]; then
    echo -e "${YELLOW}⚠️  No production keystore provided. Using debug keystore for testing.${NC}"
    PROD_KEYSTORE="$DEBUG_KEYSTORE"
    PROD_ALIAS="androiddebugkey"
    PROD_STOREPASS="android"
    PROD_KEYPASS="android"
else
    read -p "Production keystore alias: " PROD_ALIAS
    read -s -p "Production keystore password: " PROD_STOREPASS
    echo ""
    read -s -p "Production key password [same as keystore]: " PROD_KEYPASS
    PROD_KEYPASS=${PROD_KEYPASS:-$PROD_STOREPASS}
    echo ""
fi

PROD_FINGERPRINT=$(get_sha256_fingerprint "$PROD_KEYSTORE" "$PROD_ALIAS" "$PROD_STOREPASS" "$PROD_KEYPASS" "Production")

if [ ! -z "$PROD_FINGERPRINT" ]; then
    generate_asset_links "$PROD_PACKAGE" "$PROD_FINGERPRINT" "Production" ".well-known/assetlinks.json"
fi

# =============================================================================
# COMBINED ASSET LINKS (All Flavors)
# =============================================================================
echo -e "\n${PURPLE}📄 Generating combined Asset Links file...${NC}"

cat > .well-known/assetlinks-all.json << EOF
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "$PROD_PACKAGE",
      "sha256_cert_fingerprints": [
        "$PROD_FINGERPRINT"
      ]
    }
  },
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "$STAGING_PACKAGE",
      "sha256_cert_fingerprints": [
        "$STAGING_FINGERPRINT"
      ]
    }
  },
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "$DEV_PACKAGE",
      "sha256_cert_fingerprints": [
        "$DEV_FINGERPRINT"
      ]
    }
  }
]
EOF

if jq . .well-known/assetlinks-all.json > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Combined Asset Links file created${NC}"
fi

# =============================================================================
# SUMMARY REPORT
# =============================================================================
echo -e "\n${YELLOW}📋 FINGERPRINT SUMMARY REPORT${NC}"
echo "=============================="

echo -e "\n${BLUE}📱 Development Flavor:${NC}"
echo "Package: $DEV_PACKAGE"
echo "Fingerprint: $DEV_FINGERPRINT"
echo "Keystore: $DEBUG_KEYSTORE"

echo -e "\n${BLUE}📱 Staging Flavor:${NC}"
echo "Package: $STAGING_PACKAGE"
echo "Fingerprint: $STAGING_FINGERPRINT"
echo "Keystore: $STAGING_KEYSTORE"

echo -e "\n${BLUE}📱 Production Flavor:${NC}"
echo "Package: $PROD_PACKAGE"
echo "Fingerprint: $PROD_FINGERPRINT"
echo "Keystore: $PROD_KEYSTORE"

# =============================================================================
# GENERATED FILES
# =============================================================================
echo -e "\n${PURPLE}📁 Generated Files:${NC}"
echo "├── .well-known/assetlinks.json           (Production)"
echo "├── .well-known/assetlinks-staging.json   (Staging)"  
echo "├── .well-known/assetlinks-dev.json       (Development)"
echo "└── .well-known/assetlinks-all.json       (All Flavors Combined)"

# =============================================================================
# DEPLOYMENT INSTRUCTIONS
# =============================================================================
echo -e "\n${YELLOW}🚀 DEPLOYMENT INSTRUCTIONS${NC}"
echo "=========================="

echo -e "\n${BLUE}📤 Upload to your web servers:${NC}"
echo "Production:  .well-known/assetlinks.json → https://verry.ai/.well-known/assetlinks.json"
echo "Staging:     .well-known/assetlinks-staging.json → https://staging.verry.ai/.well-known/assetlinks.json"
echo "Development: .well-known/assetlinks-dev.json → https://dev.verry.ai/.well-known/assetlinks.json"

echo -e "\n${BLUE}🧪 Test the deployment:${NC}"
echo "curl -H 'Accept: application/json' https://verry.ai/.well-known/assetlinks.json"
echo "curl -H 'Accept: application/json' https://staging.verry.ai/.well-known/assetlinks.json"
echo "curl -H 'Accept: application/json' https://dev.verry.ai/.well-known/assetlinks.json"

echo -e "\n${BLUE}📱 Test deep links:${NC}"
echo "# Production"
echo "adb shell am start -W -a android.intent.action.VIEW -d 'https://verry.ai/verify/test123' $PROD_PACKAGE"
echo ""
echo "# Staging"  
echo "adb shell am start -W -a android.intent.action.VIEW -d 'https://staging.verry.ai/verify/test123' $STAGING_PACKAGE"
echo ""
echo "# Development"
echo "adb shell am start -W -a android.intent.action.VIEW -d 'https://dev.verry.ai/verify/test123' $DEV_PACKAGE"

# =============================================================================
# NEXT STEPS
# =============================================================================
echo -e "\n${YELLOW}🔧 NEXT STEPS${NC}"
echo "============"
echo "1. Deploy Asset Links files to your web servers"
echo "2. Configure web server to serve JSON files with correct Content-Type"
echo "3. Run validation script: ./scripts/validate-android-links.sh"
echo "4. Test on physical Android devices"
echo "5. Use Google's validation tool: https://developers.google.com/digital-asset-links/tools/generator"

# =============================================================================
# SAVE FINGERPRINTS TO FILE
# =============================================================================
echo -e "\n${PURPLE}💾 Saving fingerprints to file...${NC}"

cat > android-fingerprints.txt << EOF
Android App Signing Certificate Fingerprints
Generated on: $(date)
============================================

Development Flavor:
  Package: $DEV_PACKAGE  
  SHA256: $DEV_FINGERPRINT
  Keystore: $DEBUG_KEYSTORE

Staging Flavor:
  Package: $STAGING_PACKAGE
  SHA256: $STAGING_FINGERPRINT  
  Keystore: $STAGING_KEYSTORE

Production Flavor:
  Package: $PROD_PACKAGE
  SHA256: $PROD_FINGERPRINT
  Keystore: $PROD_KEYSTORE

Generated Files:
  - .well-known/assetlinks.json
  - .well-known/assetlinks-staging.json
  - .well-known/assetlinks-dev.json
  - .well-known/assetlinks-all.json
EOF

echo -e "${GREEN}✅ Fingerprints saved to android-fingerprints.txt${NC}"
echo -e "${GREEN}🎉 Fingerprint generation complete!${NC}"