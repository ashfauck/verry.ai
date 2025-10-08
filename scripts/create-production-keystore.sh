#!/bin/bash

# Production Keystore Generator for Verry.ai
# This script creates a secure production keystore and updates Asset Links

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 Verry.ai Production Keystore Generator${NC}"
echo "=========================================="

# Create android directory if it doesn't exist
mkdir -p android/app

# Set keystore path
KEYSTORE_PATH="android/app/verry-release.keystore"
KEYSTORE_ALIAS="verry-release"

echo -e "\n${YELLOW}📋 Keystore Information${NC}"
echo "======================"
echo "Keystore Path: $KEYSTORE_PATH"
echo "Alias: $KEYSTORE_ALIAS"

# Check if keystore already exists
if [ -f "$KEYSTORE_PATH" ]; then
    echo -e "\n${YELLOW}⚠️  Keystore already exists at: $KEYSTORE_PATH${NC}"
    echo "Do you want to:"
    echo "1. Use existing keystore"
    echo "2. Create new keystore (will backup existing)"
    echo "3. Cancel"
    read -p "Choose option (1-3): " choice
    
    case $choice in
        1)
            echo -e "${GREEN}✅ Using existing keystore${NC}"
            ;;
        2)
            echo -e "${YELLOW}🔄 Backing up existing keystore...${NC}"
            cp "$KEYSTORE_PATH" "${KEYSTORE_PATH}.backup.$(date +%Y%m%d-%H%M%S)"
            echo -e "${GREEN}✅ Backup created${NC}"
            ;;
        3)
            echo -e "${RED}❌ Operation cancelled${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Invalid option${NC}"
            exit 1
            ;;
    esac
else
    choice=2  # Create new keystore
fi

if [ "$choice" = "2" ]; then
    echo -e "\n${BLUE}🔑 Creating Production Keystore${NC}"
    echo "============================="
    
    # Collect keystore information
    echo -e "${YELLOW}Please provide the following information for your production keystore:${NC}"
    echo ""
    
    read -p "Your Name (First and Last): " CN
    read -p "Organizational Unit (e.g., Development Team): " OU
    read -p "Organization Name (e.g., Verry.ai): " O
    read -p "City or Locality: " L
    read -p "State or Province: " ST
    read -p "Country Code (2 letters, e.g., US): " C
    
    echo ""
    echo -e "${YELLOW}Keystore Security:${NC}"
    read -sp "Enter keystore password (min 6 characters): " KEYSTORE_PASSWORD
    echo ""
    read -sp "Confirm keystore password: " KEYSTORE_PASSWORD_CONFIRM
    echo ""
    
    if [ "$KEYSTORE_PASSWORD" != "$KEYSTORE_PASSWORD_CONFIRM" ]; then
        echo -e "${RED}❌ Passwords don't match!${NC}"
        exit 1
    fi
    
    if [ ${#KEYSTORE_PASSWORD} -lt 6 ]; then
        echo -e "${RED}❌ Password must be at least 6 characters!${NC}"
        exit 1
    fi
    
    read -sp "Enter key password (press Enter to use same as keystore): " KEY_PASSWORD
    echo ""
    
    if [ -z "$KEY_PASSWORD" ]; then
        KEY_PASSWORD="$KEYSTORE_PASSWORD"
    fi
    
    # Create the keystore
    echo -e "\n${BLUE}🔨 Generating keystore...${NC}"
    
    keytool -genkeypair \
        -v \
        -keystore "$KEYSTORE_PATH" \
        -alias "$KEYSTORE_ALIAS" \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -storepass "$KEYSTORE_PASSWORD" \
        -keypass "$KEY_PASSWORD" \
        -dname "CN=$CN, OU=$OU, O=$O, L=$L, ST=$ST, C=$C"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Keystore created successfully!${NC}"
    else
        echo -e "${RED}❌ Failed to create keystore${NC}"
        exit 1
    fi
    
    # Save keystore properties
    cat > android/keystore.properties << EOF
# Verry.ai Production Keystore Properties
# Generated on: $(date)
# IMPORTANT: Keep this file secure and do not commit to version control

storeFile=verry-release.keystore
storePassword=$KEYSTORE_PASSWORD
keyAlias=$KEYSTORE_ALIAS
keyPassword=$KEY_PASSWORD
EOF
    
    echo -e "${GREEN}✅ Keystore properties saved to android/keystore.properties${NC}"
    
    # Add to .gitignore
    echo -e "\n${BLUE}🔒 Updating .gitignore${NC}"
    if [ ! -f .gitignore ]; then
        touch .gitignore
    fi
    
    # Add keystore security entries
    if ! grep -q "keystore.properties" .gitignore; then
        echo "" >> .gitignore
        echo "# Production Keystore Security" >> .gitignore
        echo "android/keystore.properties" >> .gitignore
        echo "*.keystore" >> .gitignore
        echo "*.jks" >> .gitignore
        echo -e "${GREEN}✅ Added keystore files to .gitignore${NC}"
    else
        echo -e "${YELLOW}⚠️  Keystore entries already in .gitignore${NC}"
    fi
else
    # Using existing keystore - get password
    read -sp "Enter keystore password: " KEYSTORE_PASSWORD
    echo ""
    read -sp "Enter key password (or press Enter if same as keystore): " KEY_PASSWORD
    echo ""
    
    if [ -z "$KEY_PASSWORD" ]; then
        KEY_PASSWORD="$KEYSTORE_PASSWORD"
    fi
fi

# Extract fingerprint from the keystore
echo -e "\n${BLUE}🔍 Extracting Certificate Fingerprint${NC}"
echo "====================================="

PRODUCTION_FINGERPRINT=$(keytool -list -v -keystore "$KEYSTORE_PATH" -alias "$KEYSTORE_ALIAS" -storepass "$KEYSTORE_PASSWORD" 2>/dev/null | grep "SHA256:" | cut -d' ' -f3)

if [ -n "$PRODUCTION_FINGERPRINT" ]; then
    echo -e "${GREEN}✅ Production SHA256 Fingerprint:${NC}"
    echo -e "${CYAN}$PRODUCTION_FINGERPRINT${NC}"
else
    echo -e "${RED}❌ Failed to extract fingerprint${NC}"
    exit 1
fi

# Update Asset Links files with production fingerprint
echo -e "\n${BLUE}📄 Updating Asset Links Files${NC}"
echo "============================"

# Read current files to check for manual edits
echo -e "${YELLOW}Checking current Asset Links files...${NC}"

# Update web-assets production file
if [ -f "web-assets/assetlinks/assetlinks-production.json" ]; then
    echo -e "${BLUE}Updating web-assets/assetlinks/assetlinks-production.json${NC}"
    cat > web-assets/assetlinks/assetlinks-production.json << EOF
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.appnoize.verry.ai",
      "sha256_cert_fingerprints": [
        "$PRODUCTION_FINGERPRINT"
      ]
    }
  }
]
EOF
    echo -e "${GREEN}✅ Updated web-assets production Asset Links${NC}"
fi

# Update .well-known production file
if [ -f ".well-known/assetlinks.json" ]; then
    echo -e "${BLUE}Updating .well-known/assetlinks.json${NC}"
    cat > .well-known/assetlinks.json << EOF
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.appnoize.verry.ai",
      "sha256_cert_fingerprints": [
        "$PRODUCTION_FINGERPRINT"
      ]
    }
  }
]
EOF
    echo -e "${GREEN}✅ Updated .well-known production Asset Links${NC}"
fi

# Update the combined Asset Links file
if [ -f ".well-known/assetlinks-all.json" ]; then
    # Get development fingerprint (should be the debug keystore)
    DEBUG_FINGERPRINT="4D:42:4D:8C:97:62:C6:0C:CC:D2:C3:BD:96:4F:99:85:FA:05:00:77:B3:EB:47:E3:85:5A:2D:94:9E:F9:3F:F8"
    
    echo -e "${BLUE}Updating .well-known/assetlinks-all.json${NC}"
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
        "$PRODUCTION_FINGERPRINT"
      ]
    }
  }
]
EOF
    echo -e "${GREEN}✅ Updated combined Asset Links${NC}"
fi

# Update fingerprints record
echo -e "\n${BLUE}📝 Updating Fingerprints Record${NC}"
DEBUG_FINGERPRINT="4D:42:4D:8C:97:62:C6:0C:CC:D2:C3:BD:96:4F:99:85:FA:05:00:77:B3:EB:47:E3:85:5A:2D:94:9E:F9:3F:F8"

cat > android-fingerprints.txt << EOF
Android App Signing Certificate Fingerprints
Generated on: $(date)
============================================

Development Flavor:
  Package: dev.appnoize.verry.ai  
  SHA256: $DEBUG_FINGERPRINT
  Keystore: /Users/$(whoami)/.android/debug.keystore

Staging Flavor:
  Package: staging.appnoize.verry.ai
  SHA256: $DEBUG_FINGERPRINT
  Keystore: /Users/$(whoami)/.android/debug.keystore

Production Flavor:
  Package: com.appnoize.verry.ai
  SHA256: $PRODUCTION_FINGERPRINT
  Keystore: $KEYSTORE_PATH

Generated Files:
  - .well-known/assetlinks-dev.json
  - .well-known/assetlinks-staging.json
  - .well-known/assetlinks.json (PRODUCTION)
  - .well-known/assetlinks-all.json
  - web-assets/assetlinks/assetlinks-development.json
  - web-assets/assetlinks/assetlinks-staging.json
  - web-assets/assetlinks/assetlinks-production.json (PRODUCTION)

Security Notes:
- Production keystore is stored at: $KEYSTORE_PATH
- Keystore properties saved to: android/keystore.properties
- Both files added to .gitignore for security
- Production fingerprint is now different from dev/staging
EOF

echo -e "${GREEN}✅ Updated android-fingerprints.txt${NC}"

# Update Android build configuration
echo -e "\n${BLUE}🔧 Android Build Configuration${NC}"
echo "============================="

# Check if build.gradle needs signing config
if grep -q "signingConfigs" android/app/build.gradle; then
    echo -e "${YELLOW}⚠️  Signing configuration already exists in build.gradle${NC}"
else
    echo -e "${BLUE}Adding signing configuration to build.gradle...${NC}"
    
    # Create backup
    cp android/app/build.gradle android/app/build.gradle.backup
    
    # Add signing config (this is just a template - user should review)
    cat >> android/app/build.gradle << 'EOF'

// Production Keystore Configuration
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('keystore.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
            storePassword keystoreProperties['storePassword']
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
EOF
    
    echo -e "${GREEN}✅ Added signing configuration template${NC}"
    echo -e "${YELLOW}⚠️  Please review android/app/build.gradle and integrate properly${NC}"
fi

# Summary
echo -e "\n${BLUE}📋 PRODUCTION KEYSTORE SUMMARY${NC}"
echo "==============================="
echo -e "${GREEN}✅ Keystore Created:${NC} $KEYSTORE_PATH"
echo -e "${GREEN}✅ Alias:${NC} $KEYSTORE_ALIAS"
echo -e "${GREEN}✅ Production Fingerprint:${NC} $PRODUCTION_FINGERPRINT"
echo -e "${GREEN}✅ Asset Links Updated:${NC} Production files now use release keystore fingerprint"
echo -e "${GREEN}✅ Security:${NC} Keystore properties added to .gitignore"

echo -e "\n${BLUE}🚀 NEXT STEPS${NC}"
echo "============"
echo "1. 🔒 BACKUP YOUR KEYSTORE: Store $KEYSTORE_PATH and keystore.properties securely"
echo "2. 📱 Update build.gradle: Review and integrate the signing configuration"
echo "3. 🌐 Deploy Asset Links: Upload updated files to your production server"
echo "4. 🧪 Test: Build and test a signed release APK"
echo "5. ✅ Validate: Run ./scripts/validate-deep-linking.sh"

echo -e "\n${RED}⚠️  IMPORTANT SECURITY NOTES${NC}"
echo "=========================="
echo "• Never commit keystore files or passwords to version control"
echo "• Store keystore and credentials in secure backup location"
echo "• Use different passwords for different environments"
echo "• The keystore is valid for ~27 years (10000 days)"

echo -e "\n${GREEN}🎉 Production keystore setup complete!${NC}"