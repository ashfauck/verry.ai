#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_DIR=$(pwd)
IOS_DIR="$PROJECT_DIR/ios"
DEVICE_NAME="Ashfauck's iPhone 15 Pro Max"
DEVICE_ID="4E8D413A-83C4-5753-A995-7E6A9B9D8691"

echo -e "${BLUE}🔧 Starting iOS build process...${NC}"

# Check if iOS directory exists
if [ ! -d "$IOS_DIR" ]; then
    echo -e "${RED}❌ iOS directory not found at $IOS_DIR${NC}"
    exit 1
fi

# Check for Xcode workspace
WORKSPACE=$(find "$IOS_DIR" -name "*.xcworkspace" | head -1)
if [ -z "$WORKSPACE" ]; then
    echo -e "${RED}❌ No .xcworkspace found in iOS directory${NC}"
    exit 1
fi

WORKSPACE_NAME=$(basename "$WORKSPACE")
APP_NAME=$(basename "$WORKSPACE_NAME" .xcworkspace)

echo -e "${YELLOW}📱 Building for device: $DEVICE_NAME${NC}"
echo -e "${YELLOW}📁 Workspace: $WORKSPACE_NAME${NC}"
echo -e "${YELLOW}📱 App: $APP_NAME${NC}"

# Start Metro bundler in background if not running
if ! lsof -i :8081 > /dev/null 2>&1; then
    echo -e "${BLUE}🚀 Starting Metro bundler...${NC}"
    node "$PROJECT_DIR/metro-start.js" &
    METRO_PID=$!
    
    # Wait for Metro to start
    echo -e "${YELLOW}⏳ Waiting for Metro to start...${NC}"
    for i in {1..30}; do
        if curl -s http://localhost:8081/status > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Metro bundler is running${NC}"
            break
        fi
        sleep 1
        if [ $i -eq 30 ]; then
            echo -e "${RED}❌ Metro bundler failed to start${NC}"
            exit 1
        fi
    done
else
    echo -e "${GREEN}✅ Metro bundler already running${NC}"
    METRO_PID=""
fi

# Clean build folder
echo -e "${BLUE}🧹 Cleaning build folder...${NC}"
xcodebuild -workspace "$WORKSPACE" -scheme "$APP_NAME" -destination "id=$DEVICE_ID" clean

# Build and install to device
echo -e "${BLUE}🔨 Building and installing to device...${NC}"
xcodebuild -workspace "$WORKSPACE" \
    -scheme "$APP_NAME" \
    -configuration Debug \
    -destination "id=$DEVICE_ID" \
    -allowProvisioningUpdates \
    build install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ App successfully built and installed on $DEVICE_NAME${NC}"
    
    # Try to launch the app
    echo -e "${BLUE}🚀 Attempting to launch app...${NC}"
    BUNDLE_ID=$(xcodebuild -workspace "$WORKSPACE" -scheme "$APP_NAME" -showBuildSettings | grep PRODUCT_BUNDLE_IDENTIFIER | awk '{print $3}' | head -1)
    
    if [ ! -z "$BUNDLE_ID" ]; then
        echo -e "${YELLOW}📱 Bundle ID: $BUNDLE_ID${NC}"
        xcrun devicectl device install app --device "$DEVICE_ID" || true
        xcrun devicectl device process launch --device "$DEVICE_ID" "$BUNDLE_ID" || true
        echo -e "${GREEN}✅ App launch attempted. Check your device!${NC}"
    fi
else
    echo -e "${RED}❌ Build failed${NC}"
    if [ ! -z "$METRO_PID" ]; then
        kill $METRO_PID 2>/dev/null || true
    fi
    exit 1
fi

echo -e "${GREEN}🎉 Process complete! Your app should be running on $DEVICE_NAME${NC}"
echo -e "${BLUE}📱 Metro bundler is running on http://localhost:8081${NC}"
echo -e "${YELLOW}💡 To stop Metro bundler later, run: pkill -f metro-start${NC}"