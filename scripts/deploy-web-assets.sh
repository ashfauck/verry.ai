#!/bin/bash

# Verry.ai Web Assets Deployment Script
# This script helps deploy AASA and Asset Links files to your web servers

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Verry.ai Web Assets Deployment${NC}"
echo "=================================="

# Configuration
WEB_ASSETS_DIR="web-assets"
AASA_DIR="$WEB_ASSETS_DIR/aasa"
ASSETLINKS_DIR="$WEB_ASSETS_DIR/assetlinks"

# Check if web assets exist
if [ ! -d "$WEB_ASSETS_DIR" ]; then
    echo -e "${RED}Error: Web assets directory not found!${NC}"
    echo "Please run the fingerprint generation script first."
    exit 1
fi

echo -e "\n${BLUE}📋 Deployment Options${NC}"
echo "==================="
echo "1. Copy files to local web server directory"
echo "2. Generate deployment commands for remote server"
echo "3. Create archive for manual upload"
echo "4. Show deployment instructions"

read -p "Choose an option (1-4): " choice

case $choice in
    1)
        echo -e "\n${YELLOW}📁 Local Web Server Deployment${NC}"
        echo "----------------------------"
        read -p "Enter your web server document root path: " webroot
        
        if [ ! -d "$webroot" ]; then
            echo -e "${RED}Error: Directory $webroot does not exist!${NC}"
            exit 1
        fi
        
        # Create .well-known directory
        mkdir -p "$webroot/.well-known"
        
        # Copy AASA files
        echo -e "${YELLOW}Copying AASA files...${NC}"
        for env in development staging production; do
            cp "$AASA_DIR/apple-app-site-association-$env.json" "$webroot/.well-known/apple-app-site-association-$env"
            echo -e "${GREEN}✓${NC} Copied AASA file for $env environment"
        done
        
        # Copy Asset Links files  
        echo -e "${YELLOW}Copying Asset Links files...${NC}"
        for env in development staging production; do
            cp "$ASSETLINKS_DIR/assetlinks-$env.json" "$webroot/.well-known/assetlinks-$env.json"
            echo -e "${GREEN}✓${NC} Copied Asset Links file for $env environment"
        done
        
        echo -e "\n${GREEN}✅ Local deployment complete!${NC}"
        echo "Files deployed to: $webroot/.well-known/"
        ;;
        
    2)
        echo -e "\n${YELLOW}🌐 Remote Server Deployment Commands${NC}"
        echo "-----------------------------------"
        read -p "Enter your server hostname/IP: " server
        read -p "Enter your username: " username
        read -p "Enter web document root path on server: " remote_path
        
        echo -e "\n${BLUE}Commands to run:${NC}"
        echo "ssh $username@$server 'mkdir -p $remote_path/.well-known'"
        
        for env in development staging production; do
            echo "scp $AASA_DIR/apple-app-site-association-$env.json $username@$server:$remote_path/.well-known/apple-app-site-association-$env"
            echo "scp $ASSETLINKS_DIR/assetlinks-$env.json $username@$server:$remote_path/.well-known/"
        done
        
        echo -e "\n${YELLOW}Set proper permissions:${NC}"
        echo "ssh $username@$server 'chmod 644 $remote_path/.well-known/*'"
        ;;
        
    3)
        echo -e "\n${YELLOW}📦 Creating Deployment Archive${NC}"
        echo "-----------------------------"
        
        # Create temporary directory structure
        TEMP_DIR="temp_deploy"
        mkdir -p "$TEMP_DIR/.well-known"
        
        # Copy AASA files (without .json extension)
        for env in development staging production; do
            cp "$AASA_DIR/apple-app-site-association-$env.json" "$TEMP_DIR/.well-known/apple-app-site-association-$env"
        done
        
        # Copy Asset Links files
        for env in development staging production; do
            cp "$ASSETLINKS_DIR/assetlinks-$env.json" "$TEMP_DIR/.well-known/"
        done
        
        # Create archive
        ARCHIVE_NAME="verry-ai-web-assets-$(date +%Y%m%d-%H%M%S).tar.gz"
        tar -czf "$ARCHIVE_NAME" -C "$TEMP_DIR" .well-known
        
        # Cleanup
        rm -rf "$TEMP_DIR"
        
        echo -e "${GREEN}✅ Archive created: $ARCHIVE_NAME${NC}"
        echo "Upload this archive to your web server and extract it in the document root."
        ;;
        
    4)
        echo -e "\n${BLUE}📚 Deployment Instructions${NC}"
        echo "========================="
        
        echo -e "\n${YELLOW}1. Server Requirements:${NC}"
        echo "   • Web server with HTTPS support"
        echo "   • Access to /.well-known/ directory"
        echo "   • Proper Content-Type headers configured"
        
        echo -e "\n${YELLOW}2. File Placement:${NC}"
        echo "   For iOS (AASA files):"
        echo "   • https://yourdomain.com/.well-known/apple-app-site-association-development"
        echo "   • https://yourdomain.com/.well-known/apple-app-site-association-staging"  
        echo "   • https://yourdomain.com/.well-known/apple-app-site-association-production"
        echo ""
        echo "   For Android (Asset Links):"
        echo "   • https://yourdomain.com/.well-known/assetlinks-development.json"
        echo "   • https://yourdomain.com/.well-known/assetlinks-staging.json"
        echo "   • https://yourdomain.com/.well-known/assetlinks-production.json"
        
        echo -e "\n${YELLOW}3. Server Configuration:${NC}"
        echo "   Add these Content-Type headers:"
        echo "   • AASA files: application/json"
        echo "   • Asset Links: application/json"
        
        echo -e "\n${YELLOW}4. Environment-Specific Domains:${NC}"
        echo "   • Development: dev.verry.ai"
        echo "   • Staging: staging.verry.ai"
        echo "   • Production: verry.ai"
        
        echo -e "\n${YELLOW}5. Validation:${NC}"
        echo "   Test your deployment with:"
        echo "   • curl -I https://yourdomain.com/.well-known/apple-app-site-association-production"
        echo "   • curl -I https://yourdomain.com/.well-known/assetlinks-production.json"
        ;;
        
    *)
        echo -e "${RED}Invalid option selected.${NC}"
        exit 1
        ;;
esac

echo -e "\n${BLUE}🔧 Next Steps${NC}"
echo "============"
echo "1. Update your iOS Team ID in AASA files (replace XXXXXXXXXX)"
echo "2. Generate Android certificate fingerprints: ./scripts/generate-android-fingerprints.sh"
echo "3. Test deep linking: ./scripts/test-deep-links.sh"
echo ""
echo -e "${GREEN}Happy deep linking! 🔗${NC}"