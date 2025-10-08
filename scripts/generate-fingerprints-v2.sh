#!/bin/bash

# Updated Android Fingerprint Generation Script
# This script generates fingerprints for all environments with proper fallbacks

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 Android Certificate Fingerprint Generator v2${NC}"
echo "================================================="

# Function to extract fingerprint from keystore
extract_fingerprint() {
    local keystore_path="$1"
    local alias="$2"
    local password="$3"
    
    if [ ! -f "$keystore_path" ]; then
        echo -e "${RED}❌ Keystore not found: $keystore_path${NC}"
        return 1
    fi
    
    echo -e "${BLUE}🔑 Extracting fingerprint from: $keystore_path${NC}"
    echo "   Alias: $alias"
    
    # Extract fingerprint
    fingerprint=$(keytool -list -v -keystore "$keystore_path" -alias "$alias" -storepass "$password" 2>/dev/null | grep "SHA256:" | cut -d' ' -f3)
    
    if [ -n "$fingerprint" ]; then
        echo -e "${GREEN}✅ SHA256: $fingerprint${NC}"
        echo "$fingerprint"
        return 0
    else
        echo -e "${RED}❌ Failed to extract fingerprint${NC}"
        return 1
    fi
}

# Function to create asset links file
create_asset_links() {
    local package_name="$1"
    local fingerprint="$2"
    local output_file="$3"
    
    cat > "$output_file" << EOF
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
    
    echo -e "${GREEN}✅ Created: $output_file${NC}"
}

# Default debug keystore path
DEBUG_KEYSTORE="$HOME/.android/debug.keystore"
DEBUG_ALIAS="androiddebugkey"
DEBUG_PASSWORD="android"

echo -e "\n${YELLOW}📋 Environment Configuration${NC}"
echo "==========================="

# Extract debug fingerprint (used for dev and staging)
echo -e "\n${BLUE}1. Development & Staging Fingerprint (Debug Keystore)${NC}"
if [ -f "$DEBUG_KEYSTORE" ]; then
    DEBUG_FINGERPRINT=$(extract_fingerprint "$DEBUG_KEYSTORE" "$DEBUG_ALIAS" "$DEBUG_PASSWORD")
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Debug fingerprint extracted successfully${NC}"
    else
        echo -e "${RED}❌ Failed to extract debug fingerprint${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Debug keystore not found at: $DEBUG_KEYSTORE${NC}"
    echo "Please generate debug keystore first or check the path."
    exit 1
fi

# Production keystore
echo -e "\n${BLUE}2. Production Fingerprint (Release Keystore)${NC}"
echo -e "${YELLOW}Do you have a production/release keystore? (y/n):${NC}"
read -r has_prod_keystore

PROD_FINGERPRINT=""
if [[ "$has_prod_keystore" =~ ^[Yy]$ ]]; then
    echo "Enter production keystore path:"
    read -r prod_keystore_path
    
    echo "Enter production keystore alias:"
    read -r prod_alias
    
    echo "Enter production keystore password:"
    read -rs prod_password
    echo
    
    if [ -f "$prod_keystore_path" ]; then
        PROD_FINGERPRINT=$(extract_fingerprint "$prod_keystore_path" "$prod_alias" "$prod_password")
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Production fingerprint extracted successfully${NC}"
        else
            echo -e "${YELLOW}⚠️ Using debug fingerprint for production (temporary)${NC}"
            PROD_FINGERPRINT="$DEBUG_FINGERPRINT"
        fi
    else
        echo -e "${YELLOW}⚠️ Production keystore not found. Using debug fingerprint (temporary)${NC}"
        PROD_FINGERPRINT="$DEBUG_FINGERPRINT"
    fi
else
    echo -e "${YELLOW}⚠️ Using debug fingerprint for production (temporary)${NC}"
    PROD_FINGERPRINT="$DEBUG_FINGERPRINT"
fi

# Create Asset Links files
echo -e "\n${BLUE}📄 Generating Asset Links Files${NC}"
echo "==============================="

mkdir -p .well-known web-assets/assetlinks

# Development
create_asset_links "dev.appnoize.verry.ai" "$DEBUG_FINGERPRINT" ".well-known/assetlinks-dev.json"
create_asset_links "dev.appnoize.verry.ai" "$DEBUG_FINGERPRINT" "web-assets/assetlinks/assetlinks-development.json"

# Staging  
create_asset_links "staging.appnoize.verry.ai" "$DEBUG_FINGERPRINT" ".well-known/assetlinks-staging.json"
create_asset_links "staging.appnoize.verry.ai" "$DEBUG_FINGERPRINT" "web-assets/assetlinks/assetlinks-staging.json"

# Production
create_asset_links "com.appnoize.verry.ai" "$PROD_FINGERPRINT" ".well-known/assetlinks.json"
create_asset_links "com.appnoize.verry.ai" "$PROD_FINGERPRINT" "web-assets/assetlinks/assetlinks-production.json"

# Create combined file
echo -e "\n${BLUE}📄 Creating Combined Asset Links File${NC}"
cat > .well-known/assetlinks-all.json << EOF
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "dev.appnoize.verry.ai",
      "sha256_cert_fingerprints": [
        "$DEBUG_FINGERPRINT"
      ]
    }
  },
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app", 
      "package_name": "staging.appnoize.verry.ai",
      "sha256_cert_fingerprints": [
        "$DEBUG_FINGERPRINT"
      ]
    }
  },
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.appnoize.verry.ai", 
      "sha256_cert_fingerprints": [
        "$PROD_FINGERPRINT"
      ]
    }
  }
]
EOF

echo -e "${GREEN}✅ Created: .well-known/assetlinks-all.json${NC}"

# Update fingerprints file
echo -e "\n${BLUE}💾 Updating Fingerprints Record${NC}"
cat > android-fingerprints.txt << EOF
Android App Signing Certificate Fingerprints
Generated on: $(date)
============================================

Development Flavor:
  Package: dev.appnoize.verry.ai  
  SHA256: $DEBUG_FINGERPRINT
  Keystore: $DEBUG_KEYSTORE

Staging Flavor:
  Package: staging.appnoize.verry.ai
  SHA256: $DEBUG_FINGERPRINT
  Keystore: $DEBUG_KEYSTORE

Production Flavor:
  Package: com.appnoize.verry.ai
  SHA256: $PROD_FINGERPRINT
EOF

if [[ "$PROD_FINGERPRINT" == "$DEBUG_FINGERPRINT" ]]; then
    echo "  Keystore: $DEBUG_KEYSTORE (TEMPORARY - Replace with production keystore)" >> android-fingerprints.txt
else
    echo "  Keystore: $prod_keystore_path" >> android-fingerprints.txt
fi

echo "" >> android-fingerprints.txt
echo "Generated Files:" >> android-fingerprints.txt
echo "  - .well-known/assetlinks-dev.json" >> android-fingerprints.txt
echo "  - .well-known/assetlinks-staging.json" >> android-fingerprints.txt
echo "  - .well-known/assetlinks.json" >> android-fingerprints.txt
echo "  - .well-known/assetlinks-all.json" >> android-fingerprints.txt
echo "  - web-assets/assetlinks/assetlinks-development.json" >> android-fingerprints.txt
echo "  - web-assets/assetlinks/assetlinks-staging.json" >> android-fingerprints.txt
echo "  - web-assets/assetlinks/assetlinks-production.json" >> android-fingerprints.txt

echo -e "${GREEN}✅ Updated: android-fingerprints.txt${NC}"

# Summary
echo -e "\n${BLUE}📋 SUMMARY${NC}"
echo "=========="
echo -e "${GREEN}✅ Development:${NC} $DEBUG_FINGERPRINT"
echo -e "${GREEN}✅ Staging:${NC}     $DEBUG_FINGERPRINT"
if [[ "$PROD_FINGERPRINT" == "$DEBUG_FINGERPRINT" ]]; then
    echo -e "${YELLOW}⚠️ Production:${NC}   $PROD_FINGERPRINT (using debug - update when you have release keystore)"
else
    echo -e "${GREEN}✅ Production:${NC}   $PROD_FINGERPRINT"
fi

echo -e "\n${BLUE}🚀 Next Steps${NC}"
echo "============"
echo "1. Deploy .well-known files to your web servers"
echo "2. Test with: ./scripts/test-deep-links.sh"
echo "3. Validate with: ./scripts/validate-deep-linking.sh"

if [[ "$PROD_FINGERPRINT" == "$DEBUG_FINGERPRINT" ]]; then
    echo -e "\n${YELLOW}⚠️ IMPORTANT: Production is using debug fingerprint${NC}"
    echo "When you have your production keystore:"
    echo "1. Re-run this script with your production keystore"
    echo "2. Update the deployed assetlinks.json on your production server"
fi

echo -e "\n${GREEN}🎉 Fingerprint generation complete!${NC}"