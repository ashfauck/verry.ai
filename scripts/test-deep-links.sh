#!/bin/bash

# Verry.ai Deep Linking Test Script
# This script helps test deep linking functionality across different environments

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔗 Verry.ai Deep Linking Test Suite${NC}"
echo "==================================="

# Test URLs for different environments
declare -A TEST_URLS
TEST_URLS[dev_custom]="verryapp://auth/verify?code=123456"
TEST_URLS[dev_universal]="https://dev.verry.ai/auth/verify?code=123456"
TEST_URLS[staging_custom]="verry://verify/document?id=abc123"  
TEST_URLS[staging_universal]="https://staging.verry.ai/verify/document?id=abc123"
TEST_URLS[prod_custom]="verryapp://app/home"
TEST_URLS[prod_universal]="https://verry.ai/app/home"

# Function to test a URL
test_url() {
    local url="$1"
    local description="$2"
    
    echo -e "\n${YELLOW}Testing: $description${NC}"
    echo "URL: $url"
    
    # Check if it's a custom scheme or universal link
    if [[ $url == http* ]]; then
        echo -e "${CYAN}→ Testing Universal Link (requires deployed web assets)${NC}"
        
        # Extract domain from URL
        domain=$(echo "$url" | sed -E 's|https?://([^/]+).*|\1|')
        
        # Test if AASA/Asset Links are accessible
        aasa_url="https://$domain/.well-known/apple-app-site-association-production"
        assetlinks_url="https://$domain/.well-known/assetlinks-production.json"
        
        echo "  Checking AASA: $aasa_url"
        if command -v curl >/dev/null 2>&1; then
            http_code=$(curl -s -o /dev/null -w "%{http_code}" "$aasa_url" 2>/dev/null)
            if [ "$http_code" = "200" ]; then
                echo -e "  ${GREEN}✓${NC} AASA file accessible (HTTP $http_code)"
            else
                echo -e "  ${RED}✗${NC} AASA file not accessible (HTTP $http_code)"
            fi
        else
            echo -e "  ${YELLOW}⚠️${NC}  curl not available - cannot test AASA accessibility"
        fi
        
        echo "  Checking Asset Links: $assetlinks_url"  
        if command -v curl >/dev/null 2>&1; then
            http_code=$(curl -s -o /dev/null -w "%{http_code}" "$assetlinks_url" 2>/dev/null)
            if [ "$http_code" = "200" ]; then
                echo -e "  ${GREEN}✓${NC} Asset Links file accessible (HTTP $http_code)"
            else
                echo -e "  ${RED}✗${NC} Asset Links file not accessible (HTTP $http_code)"
            fi
        fi
    else
        echo -e "${CYAN}→ Testing Custom URL Scheme${NC}"
    fi
    
    # Platform-specific testing instructions
    echo -e "\n${BLUE}Manual Testing Instructions:${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "  iOS Simulator:"
        echo "    xcrun simctl openurl booted \"$url\""
        echo ""
        echo "  macOS (if app supports):"
        echo "    open \"$url\""
    fi
    
    echo "  Android (ADB):"
    echo "    adb shell am start -W -a android.intent.action.VIEW -d \"$url\""
    
    echo "  Browser Test:"
    echo "    Open: $url"
    
    echo -e "${CYAN}  Expected Result:${NC}"
    echo "    App should open and navigate to the appropriate screen"
}

# Function to run automated tests
run_automated_tests() {
    echo -e "\n${BLUE}🤖 Automated Tests${NC}"
    echo "=================="
    
    # Test custom schemes
    echo -e "\n${YELLOW}Testing Custom URL Schemes${NC}"
    
    if [[ "$OSTYPE" == "darwin"* ]] && command -v xcrun >/dev/null 2>&1; then
        echo "Testing with iOS Simulator..."
        
        # Check if simulator is running
        sim_id=$(xcrun simctl list devices | grep "Booted" | head -1 | grep -o '[A-F0-9-]\{36\}')
        
        if [ -n "$sim_id" ]; then
            echo -e "${GREEN}✓${NC} iOS Simulator is running ($sim_id)"
            
            for key in "${!TEST_URLS[@]}"; do
                if [[ $key == *"custom"* ]]; then
                    echo "Testing: ${TEST_URLS[$key]}"
                    xcrun simctl openurl booted "${TEST_URLS[$key]}" 2>/dev/null
                    if [ $? -eq 0 ]; then
                        echo -e "${GREEN}✓${NC} URL sent to simulator"
                    else
                        echo -e "${RED}✗${NC} Failed to send URL to simulator"
                    fi
                fi
            done
        else
            echo -e "${YELLOW}⚠️${NC}  No iOS Simulator running. Start with: xcrun simctl boot <device-id>"
        fi
    fi
    
    # Test Android if ADB is available
    if command -v adb >/dev/null 2>&1; then
        echo -e "\n${YELLOW}Testing Android Device/Emulator${NC}"
        
        devices=$(adb devices | grep -v "List of devices" | grep "device$" | wc -l)
        if [ "$devices" -gt 0 ]; then
            echo -e "${GREEN}✓${NC} Android device/emulator connected"
            
            for key in "${!TEST_URLS[@]}"; do
                if [[ $key == *"custom"* ]]; then
                    echo "Testing: ${TEST_URLS[$key]}"
                    adb shell am start -W -a android.intent.action.VIEW -d "${TEST_URLS[$key]}" >/dev/null 2>&1
                    if [ $? -eq 0 ]; then
                        echo -e "${GREEN}✓${NC} URL sent to Android device"
                    else
                        echo -e "${RED}✗${NC} Failed to send URL to Android device"
                    fi
                fi
            done
        else
            echo -e "${YELLOW}⚠️${NC}  No Android devices connected. Connect device or start emulator."
        fi
    fi
}

# Function to validate web assets
validate_web_assets() {
    echo -e "\n${BLUE}🌐 Web Assets Validation${NC}"
    echo "======================="
    
    read -p "Enter your production domain (e.g., verry.ai): " domain
    
    if [ -z "$domain" ]; then
        echo -e "${RED}No domain provided, skipping web validation.${NC}"
        return
    fi
    
    # Test AASA files
    echo -e "\n${YELLOW}Testing Apple App Site Association files:${NC}"
    for env in development staging production; do
        url="https://$domain/.well-known/apple-app-site-association-$env"
        echo "Testing: $url"
        
        if command -v curl >/dev/null 2>&1; then
            response=$(curl -s -w "HTTP_CODE:%{http_code}" "$url")
            http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
            content=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*$//')
            
            if [ "$http_code" = "200" ]; then
                echo -e "${GREEN}✓${NC} AASA accessible (HTTP $http_code)"
                
                # Validate JSON structure
                if echo "$content" | python3 -m json.tool >/dev/null 2>&1; then
                    echo -e "${GREEN}✓${NC} Valid JSON format"
                    
                    # Check for required fields
                    if echo "$content" | grep -q "applinks"; then
                        echo -e "${GREEN}✓${NC} Contains applinks configuration"
                    else
                        echo -e "${RED}✗${NC} Missing applinks configuration"
                    fi
                else
                    echo -e "${RED}✗${NC} Invalid JSON format"
                fi
            else
                echo -e "${RED}✗${NC} Not accessible (HTTP $http_code)"
            fi
        fi
    done
    
    # Test Asset Links files
    echo -e "\n${YELLOW}Testing Android Asset Links files:${NC}"
    for env in development staging production; do
        url="https://$domain/.well-known/assetlinks-$env.json"
        echo "Testing: $url"
        
        if command -v curl >/dev/null 2>&1; then
            response=$(curl -s -w "HTTP_CODE:%{http_code}" "$url")
            http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
            content=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*$//')
            
            if [ "$http_code" = "200" ]; then
                echo -e "${GREEN}✓${NC} Asset Links accessible (HTTP $http_code)"
                
                # Validate JSON structure
                if echo "$content" | python3 -m json.tool >/dev/null 2>&1; then
                    echo -e "${GREEN}✓${NC} Valid JSON format"
                    
                    # Check for placeholder fingerprints
                    if echo "$content" | grep -q "YOUR_SHA256_FINGERPRINT_HERE"; then
                        echo -e "${YELLOW}⚠️${NC}  Contains placeholder fingerprints - update with real ones"
                    else
                        echo -e "${GREEN}✓${NC} Real fingerprints configured"
                    fi
                else
                    echo -e "${RED}✗${NC} Invalid JSON format"
                fi
            else
                echo -e "${RED}✗${NC} Not accessible (HTTP $http_code)"
            fi
        fi
    done
}

# Main menu
echo -e "\n${BLUE}🧪 Test Options${NC}"
echo "==============="
echo "1. Run all manual test cases"
echo "2. Run automated tests (iOS Simulator/Android ADB)"
echo "3. Validate web assets deployment"
echo "4. Test specific URL"
echo "5. Show test URL reference"

read -p "Choose an option (1-5): " choice

case $choice in
    1)
        echo -e "\n${BLUE}📱 Manual Test Cases${NC}"
        echo "==================="
        
        for key in "${!TEST_URLS[@]}"; do
            test_url "${TEST_URLS[$key]}" "$key"
            echo ""
            read -p "Press Enter to continue to next test..."
        done
        ;;
        
    2)
        run_automated_tests
        ;;
        
    3)
        validate_web_assets
        ;;
        
    4)
        read -p "Enter URL to test: " custom_url
        if [ -n "$custom_url" ]; then
            test_url "$custom_url" "Custom URL"
        fi
        ;;
        
    5)
        echo -e "\n${BLUE}📖 Test URL Reference${NC}"
        echo "===================="
        
        echo -e "\n${YELLOW}Custom URL Schemes:${NC}"
        echo "  verryapp://auth/verify?code=123456"
        echo "  verry://verify/document?id=abc123"
        echo "  verryapp://app/home"
        
        echo -e "\n${YELLOW}Universal Links (iOS):${NC}"
        echo "  https://dev.verry.ai/auth/verify?code=123456"
        echo "  https://staging.verry.ai/verify/document?id=abc123"
        echo "  https://verry.ai/app/home"
        
        echo -e "\n${YELLOW}App Links (Android):${NC}"
        echo "  https://dev.verry.ai/auth/verify?code=123456"
        echo "  https://staging.verry.ai/verify/document?id=abc123"
        echo "  https://verry.ai/app/home"
        ;;
        
    *)
        echo -e "${RED}Invalid option selected.${NC}"
        exit 1
        ;;
esac

echo -e "\n${GREEN}🎉 Deep linking tests complete!${NC}"
echo ""
echo -e "${BLUE}💡 Pro Tips:${NC}"
echo "• Test on both iOS and Android devices"
echo "• Verify links work from different apps (Messages, Email, Safari)"
echo "• Test with app installed and uninstalled"
echo "• Check that fallback web pages work correctly"
echo ""
echo -e "${GREEN}Happy testing! 🚀${NC}"