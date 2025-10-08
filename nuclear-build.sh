#!/bin/bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}💥 NUCLEAR OPTION: Complete React Native CLI bypass${NC}"
echo -e "${PURPLE}🎯 Target: Ashfauck's iPhone 15 Pro Max${NC}"
echo

# Project settings
PROJECT_DIR=$(pwd)
IOS_DIR="$PROJECT_DIR/ios"
DEVICE_ID="4E8D413A-83C4-5753-A995-7E6A9B9D8691"
WORKSPACE="$IOS_DIR/VerryApp.xcworkspace"
SCHEME="VerryApp"

# Step 1: Kill any existing processes
echo -e "${BLUE}🔪 Killing any hanging processes...${NC}"
pkill -f "react-native" || true
pkill -f "metro" || true
pkill -f "node.*8081" || true
sleep 2

# Step 2: Clean everything
echo -e "${BLUE}🧹 Deep cleaning project...${NC}"
rm -rf "$PROJECT_DIR/node_modules/.cache" || true
rm -rf "$PROJECT_DIR/.metro" || true
rm -rf "$IOS_DIR/build" || true
rm -rf ~/Library/Developer/Xcode/DerivedData/VerryApp* || true

# Step 3: Start Metro bundler directly (no CLI)
echo -e "${BLUE}🚀 Starting Metro bundler (CLI-free)...${NC}"
cat > "$PROJECT_DIR/start-metro-nuclear.js" << 'EOF'
const Metro = require('metro');
const { loadConfig } = require('metro-config');

async function start() {
  console.log('🚀 Nuclear Metro starting...');
  
  const config = await loadConfig({
    cwd: __dirname,
    projectRoot: __dirname,
    watchFolders: [],
    server: {
      port: 8081,
      host: '0.0.0.0'
    },
    reporter: {
      update: (event) => {
        if (event.type === 'bundle_build_done') {
          console.log(`✅ Bundle built: ${event.entryFile} (${event.buildTime}ms)`);
        }
      }
    }
  });

  const server = await Metro.runServer(config, {
    host: '0.0.0.0',
    port: 8081,
  });

  console.log('✅ Metro running on http://localhost:8081');
  
  process.on('SIGINT', () => {
    console.log('\n🛑 Metro shutdown');
    server.close();
    process.exit(0);
  });
}

start().catch(console.error);
EOF

# Start Metro in background
node "$PROJECT_DIR/start-metro-nuclear.js" &
METRO_PID=$!
echo -e "${YELLOW}Metro PID: $METRO_PID${NC}"

# Wait for Metro to be ready
echo -e "${YELLOW}⏳ Waiting for Metro...${NC}"
for i in {1..20}; do
  if curl -s http://localhost:8081/status > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Metro is ready!${NC}"
    break
  fi
  sleep 1
  echo -n "."
done

# Step 4: Build with Xcode directly
echo -e "${BLUE}🔨 Building with Xcode (no React Native CLI)...${NC}"

# Clean first
xcodebuild -workspace "$WORKSPACE" -scheme "$SCHEME" clean \
  -destination "id=$DEVICE_ID" || {
  echo -e "${RED}❌ Clean failed${NC}"
  kill $METRO_PID 2>/dev/null || true
  exit 1
}

# Build and install
echo -e "${BLUE}📱 Building and installing to device...${NC}"
xcodebuild -workspace "$WORKSPACE" -scheme "$SCHEME" \
  -configuration Debug \
  -destination "id=$DEVICE_ID" \
  -allowProvisioningUpdates \
  build install || {
  echo -e "${RED}❌ Build failed${NC}"
  kill $METRO_PID 2>/dev/null || true
  exit 1
}

# Step 5: Launch app
echo -e "${BLUE}🚀 Launching app...${NC}"
BUNDLE_ID="com.verryapp.VerryApp"
echo -e "${YELLOW}Bundle ID: $BUNDLE_ID${NC}"

# Launch the app
xcrun devicectl device process launch --device "$DEVICE_ID" "$BUNDLE_ID" || {
  echo -e "${YELLOW}⚠️ Direct launch failed, trying alternative method...${NC}"
  # Alternative: Use simctl if available
  xcrun simctl launch booted "$BUNDLE_ID" 2>/dev/null || true
}

echo
echo -e "${GREEN}🎉 NUCLEAR BUILD COMPLETE!${NC}"
echo -e "${GREEN}📱 App should be running on your iPhone 15 Pro Max${NC}"
echo -e "${BLUE}🌐 Metro bundler: http://localhost:8081${NC}"
echo -e "${YELLOW}💡 Metro PID: $METRO_PID (kill with: kill $METRO_PID)${NC}"
echo
echo -e "${PURPLE}🔥 This bypassed ALL React Native CLI tools!${NC}"