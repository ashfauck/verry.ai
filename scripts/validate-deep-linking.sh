#!/bin/bash

# Verry.ai Deep Linking Validation Script
# This script validates that all deep linking components are properly configured

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔗 Verry.ai Deep Linking Validation${NC}"
echo "=================================="

# Check iOS Configuration
echo -e "\n${BLUE}📱 iOS Configuration${NC}"
echo "-------------------"

# Check bundle IDs in xcconfig files
echo -e "${YELLOW}Checking iOS bundle IDs...${NC}"
for config in ios/Config/*.xcconfig ios/*.xcconfig; do
    if [ -f "$config" ]; then
        bundle_id=$(grep "BUNDLE_ID_SUFFIX\|PRODUCT_BUNDLE_IDENTIFIER" "$config" | head -1)
        if [[ $bundle_id == *"verry.ai"* ]]; then
            echo -e "${GREEN}✓${NC} $(basename $config): $bundle_id"
        else
            echo -e "${RED}✗${NC} $(basename $config): $bundle_id"
        fi
    fi
done

# Check iOS Info.plist for URL schemes
echo -e "\n${YELLOW}Checking iOS URL schemes...${NC}"
if [ -f "ios/VerryApp/Info.plist" ]; then
    if grep -q "verryapp" ios/VerryApp/Info.plist && grep -q "verry" ios/VerryApp/Info.plist; then
        echo -e "${GREEN}✓${NC} URL schemes (verryapp://, verry://) configured"
    else
        echo -e "${RED}✗${NC} URL schemes missing or incorrect"
    fi
else
    echo -e "${RED}✗${NC} Info.plist not found"
fi

# Check AASA files
echo -e "\n${YELLOW}Checking Apple App Site Association files...${NC}"
for env in development staging production; do
    aasa_file="web-assets/aasa/apple-app-site-association-${env}.json"
    if [ -f "$aasa_file" ]; then
        echo -e "${GREEN}✓${NC} AASA file exists: $aasa_file"
    else
        echo -e "${RED}✗${NC} AASA file missing: $aasa_file"
    fi
done

# Check Android Configuration
echo -e "\n${BLUE}🤖 Android Configuration${NC}"
echo "----------------------"

# Check Android package names in build.gradle
echo -e "${YELLOW}Checking Android package names...${NC}"
if [ -f "android/app/build.gradle" ]; then
    if grep -q "com.appnoize.verry.ai" android/app/build.gradle; then
        echo -e "${GREEN}✓${NC} Production package name: com.appnoize.verry.ai"
    else
        echo -e "${RED}✗${NC} Production package name incorrect"
    fi
    
    if grep -q "staging.appnoize.verry.ai" android/app/build.gradle; then
        echo -e "${GREEN}✓${NC} Staging package name: staging.appnoize.verry.ai"
    else
        echo -e "${RED}✗${NC} Staging package name incorrect"
    fi
    
    if grep -q "dev.appnoize.verry.ai" android/app/build.gradle; then
        echo -e "${GREEN}✓${NC} Development package name: dev.appnoize.verry.ai"
    else
        echo -e "${RED}✗${NC} Development package name incorrect"
    fi
else
    echo -e "${RED}✗${NC} Android build.gradle not found"
fi

# Check Asset Links files
echo -e "\n${YELLOW}Checking Android Asset Links files...${NC}"
for env in development staging production; do
    asset_links_file="web-assets/assetlinks/assetlinks-${env}.json"
    if [ -f "$asset_links_file" ]; then
        echo -e "${GREEN}✓${NC} Asset Links file exists: $asset_links_file"
        
        # Check if fingerprints are present (not placeholder)
        if grep -q "YOUR_SHA256_FINGERPRINT_HERE" "$asset_links_file"; then
            echo -e "${YELLOW}  ⚠️${NC}  File contains placeholder fingerprints - run fingerprint generation script"
        else
            echo -e "${GREEN}  ✓${NC}  Real fingerprints configured"
        fi
    else
        echo -e "${RED}✗${NC} Asset Links file missing: $asset_links_file"
    fi
done

# Check Scripts
echo -e "\n${BLUE}🔧 Utility Scripts${NC}"
echo "----------------"

scripts=("generate-android-fingerprints.sh" "deploy-web-assets.sh" "test-deep-links.sh")
for script in "${scripts[@]}"; do
    if [ -f "scripts/$script" ]; then
        if [ -x "scripts/$script" ]; then
            echo -e "${GREEN}✓${NC} $script (executable)"
        else
            echo -e "${YELLOW}⚠️${NC}  $script (not executable - run: chmod +x scripts/$script)"
        fi
    else
        echo -e "${RED}✗${NC} $script missing"
    fi
done

# Summary
echo -e "\n${BLUE}📋 Next Steps${NC}"
echo "============"
echo "1. If Asset Links show placeholder fingerprints:"
echo "   Run: ./scripts/generate-android-fingerprints.sh"
echo ""
echo "2. Deploy web assets to your server:"
echo "   Run: ./scripts/deploy-web-assets.sh"
echo ""
echo "3. Test deep linking functionality:"
echo "   Run: ./scripts/test-deep-links.sh"
echo ""
echo -e "${GREEN}Deep linking validation complete!${NC}"