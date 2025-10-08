#!/bin/bash

# Asset Links Verification Script for Verry.ai
# Verifies all Asset Links files have correct fingerprints

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔗 Verry.ai Asset Links Final Verification${NC}"
echo "=========================================="

# Expected fingerprints
PROD_FINGERPRINT="07:4C:B1:1C:DB:B8:54:6A:8A:3B:27:EC:6A:19:D0:4A:6B:18:60:4E:E8:AB:E0:6F:ED:7B:09:E3:FC:B5:49:6C"
DEBUG_FINGERPRINT="4D:42:4D:8C:97:62:C6:0C:CC:D2:C3:BD:96:4F:99:85:FA:05:00:77:B3:EB:47:E3:85:5A:2D:94:9E:F9:3F:F8"

# Function to verify Asset Links file
verify_asset_links() {
    local file="$1"
    local env_name="$2"
    local expected_package="$3"
    local expected_fingerprint="$4"
    
    echo -e "\n${YELLOW}📄 Verifying $env_name Environment${NC}"
    echo "File: $file"
    
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ File not found${NC}"
        return 1
    fi
    
    # Check JSON validity
    if ! jq . "$file" > /dev/null 2>&1; then
        echo -e "${RED}❌ Invalid JSON format${NC}"
        return 1
    fi
    
    # Extract values
    local package=$(jq -r '.[0].target.package_name' "$file" 2>/dev/null)
    local fingerprint=$(jq -r '.[0].target.sha256_cert_fingerprints[0]' "$file" 2>/dev/null)
    local relation=$(jq -r '.[0].relation[0]' "$file" 2>/dev/null)
    
    # Verify package name
    if [ "$package" = "$expected_package" ]; then
        echo -e "${GREEN}✅ Package: $package${NC}"
    else
        echo -e "${RED}❌ Package mismatch. Expected: $expected_package, Found: $package${NC}"
        return 1
    fi
    
    # Verify fingerprint
    if [ "$fingerprint" = "$expected_fingerprint" ]; then
        echo -e "${GREEN}✅ Fingerprint: ${fingerprint:0:20}...${NC}"
    else
        echo -e "${RED}❌ Fingerprint mismatch${NC}"
        echo -e "Expected: $expected_fingerprint"
        echo -e "Found: $fingerprint"
        return 1
    fi
    
    # Verify relation
    if [ "$relation" = "delegate_permission/common.handle_all_urls" ]; then
        echo -e "${GREEN}✅ URL delegation permission configured${NC}"
    else
        echo -e "${RED}❌ Missing or incorrect URL delegation permission${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ $env_name verification complete${NC}"
    return 0
}

# Verify individual environment files
echo -e "\n${BLUE}🧪 Individual Environment Verification${NC}"
echo "====================================="

verify_asset_links ".well-known/assetlinks.json" "Production" "com.appnoize.verry.ai" "$PROD_FINGERPRINT"
prod_status=$?

verify_asset_links ".well-known/assetlinks-staging.json" "Staging" "staging.appnoize.verry.ai" "$DEBUG_FINGERPRINT"
staging_status=$?

verify_asset_links ".well-known/assetlinks-dev.json" "Development" "dev.appnoize.verry.ai" "$DEBUG_FINGERPRINT"
dev_status=$?

verify_asset_links "web-assets/assetlinks/assetlinks-production.json" "Production (web-assets)" "com.appnoize.verry.ai" "$PROD_FINGERPRINT"
web_prod_status=$?

verify_asset_links "web-assets/assetlinks/assetlinks-staging.json" "Staging (web-assets)" "staging.appnoize.verry.ai" "$DEBUG_FINGERPRINT"
web_staging_status=$?

verify_asset_links "web-assets/assetlinks/assetlinks-development.json" "Development (web-assets)" "dev.appnoize.verry.ai" "$DEBUG_FINGERPRINT"
web_dev_status=$?

# Verify combined file
echo -e "\n${BLUE}📋 Combined Asset Links Verification${NC}"
echo "==================================="

if [ -f ".well-known/assetlinks-all.json" ]; then
    if jq . ".well-known/assetlinks-all.json" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Combined file JSON valid${NC}"
        
        # Count entries
        count=$(jq '. | length' ".well-known/assetlinks-all.json")
        if [ "$count" = "3" ]; then
            echo -e "${GREEN}✅ Contains all 3 environments${NC}"
            
            # Check each environment in combined file
            prod_pkg=$(jq -r '.[] | select(.target.package_name == "com.appnoize.verry.ai") | .target.package_name' ".well-known/assetlinks-all.json")
            staging_pkg=$(jq -r '.[] | select(.target.package_name == "staging.appnoize.verry.ai") | .target.package_name' ".well-known/assetlinks-all.json")
            dev_pkg=$(jq -r '.[] | select(.target.package_name == "dev.appnoize.verry.ai") | .target.package_name' ".well-known/assetlinks-all.json")
            
            if [ "$prod_pkg" = "com.appnoize.verry.ai" ]; then
                echo -e "${GREEN}✅ Production entry found${NC}"
            else
                echo -e "${RED}❌ Production entry missing${NC}"
            fi
            
            if [ "$staging_pkg" = "staging.appnoize.verry.ai" ]; then
                echo -e "${GREEN}✅ Staging entry found${NC}"
            else
                echo -e "${RED}❌ Staging entry missing${NC}"
            fi
            
            if [ "$dev_pkg" = "dev.appnoize.verry.ai" ]; then
                echo -e "${GREEN}✅ Development entry found${NC}"
            else
                echo -e "${RED}❌ Development entry missing${NC}"
            fi
        else
            echo -e "${RED}❌ Expected 3 entries, found $count${NC}"
        fi
    else
        echo -e "${RED}❌ Combined file has invalid JSON${NC}"
    fi
else
    echo -e "${RED}❌ Combined Asset Links file not found${NC}"
fi

# Summary
echo -e "\n${BLUE}📊 Verification Summary${NC}"
echo "======================"

if [ $prod_status -eq 0 ]; then
    echo -e "${GREEN}✅ Production Asset Links${NC}"
else
    echo -e "${RED}❌ Production Asset Links${NC}"
fi

if [ $staging_status -eq 0 ]; then
    echo -e "${GREEN}✅ Staging Asset Links${NC}"
else
    echo -e "${RED}❌ Staging Asset Links${NC}"
fi

if [ $dev_status -eq 0 ]; then
    echo -e "${GREEN}✅ Development Asset Links${NC}"
else
    echo -e "${RED}❌ Development Asset Links${NC}"
fi

echo -e "\n${BLUE}🔐 Keystore Summary${NC}"
echo "=================="
echo -e "${CYAN}Production Keystore:${NC}"
echo "  • Path: android/app/verry-release.keystore"
echo "  • Alias: verry-release"
echo "  • Fingerprint: $PROD_FINGERPRINT"

echo -e "\n${CYAN}Debug Keystore:${NC}"
echo "  • Path: ~/.android/debug.keystore"
echo "  • Alias: androiddebugkey" 
echo "  • Fingerprint: $DEBUG_FINGERPRINT"

echo -e "\n${BLUE}🚀 Deployment Instructions${NC}"
echo "========================="
echo "Deploy these Asset Links files to your web servers:"
echo ""
echo -e "${YELLOW}Production (verry.ai):${NC}"
echo "  Source: .well-known/assetlinks.json"
echo "  Deploy to: https://verry.ai/.well-known/assetlinks.json"
echo ""
echo -e "${YELLOW}Staging (staging.verry.ai):${NC}"
echo "  Source: .well-known/assetlinks-staging.json"
echo "  Deploy to: https://staging.verry.ai/.well-known/assetlinks.json"
echo ""
echo -e "${YELLOW}Development (dev.verry.ai):${NC}"
echo "  Source: .well-known/assetlinks-dev.json"
echo "  Deploy to: https://dev.verry.ai/.well-known/assetlinks.json"

echo -e "\n${BLUE}🧪 Testing Commands${NC}"
echo "=================="
echo "After deployment, test with:"
echo ""
echo "# Test production"
echo "curl -H 'Accept: application/json' https://verry.ai/.well-known/assetlinks.json"
echo ""
echo "# Test Android deep link"
echo "adb shell am start -W -a android.intent.action.VIEW -d 'https://verry.ai/verify/test123' com.appnoize.verry.ai"

echo -e "\n${GREEN}🎉 Asset Links verification complete!${NC}"