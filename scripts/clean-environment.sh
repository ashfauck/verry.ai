#!/bin/bash
# Metro Bundler Stabilization Script for Apple Silicon React Native
# This script provides a reproducible environment setup

set -e  # Exit on any error

echo "🔧 React Native Environment Stabilization Script"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're on Apple Silicon
if [[ $(uname -m) != "arm64" ]]; then
    print_error "This script is designed for Apple Silicon (ARM64). Current architecture: $(uname -m)"
    exit 1
fi

print_status "Detected Apple Silicon architecture"

# Check Node.js version
NODE_VERSION=$(node --version | sed 's/v//')
REQUIRED_NODE="20"
if [[ ! "$NODE_VERSION" =~ ^$REQUIRED_NODE\. ]]; then
    print_warning "Node.js $NODE_VERSION detected. Recommended: $REQUIRED_NODE.x"
fi

print_status "Node.js version: $NODE_VERSION"

# Kill any existing Metro processes
print_status "Cleaning up existing Metro processes..."
pkill -f "metro" || true
pkill -f "react-native start" || true
lsof -ti:8081 | xargs kill -9 2>/dev/null || true

# Clean Metro cache thoroughly
print_status "Clearing Metro cache..."
rm -rf /tmp/metro-*
rm -rf /tmp/react-*
rm -rf ~/.metro
rm -rf /tmp/haste-map-*
npx react-native start --reset-cache & sleep 3 && pkill -f "react-native start" || true

# Clean iOS build artifacts
print_status "Cleaning iOS build artifacts..."
cd ios 2>/dev/null || { print_error "ios directory not found"; exit 1; }
rm -rf build
rm -rf Pods
rm -rf VerryApp.xcworkspace/xcuserdata 2>/dev/null || true
rm -rf VerryApp.xcodeproj/xcuserdata 2>/dev/null || true
rm -rf ~/Library/Developer/Xcode/DerivedData/VerryApp-* 2>/dev/null || true
cd ..

# Clean Android build artifacts
print_status "Cleaning Android build artifacts..."
if [ -d "android" ]; then
    cd android
    rm -rf build app/build .gradle
    cd ..
fi

# Clean Node.js artifacts
print_status "Cleaning Node.js artifacts..."
rm -rf node_modules
rm -rf package-lock.json
npm cache clean --force

print_status "Environment cleanup complete"
echo ""
echo "🔄 Now run the installation script: ./install-dependencies.sh"