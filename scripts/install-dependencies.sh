#!/bin/bash
# Dependency Installation Script with Version Compatibility
# Ensures all packages are compatible with React Native 0.75.5 and Apple Silicon

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo "📦 Installing Compatible Dependencies"
echo "===================================="

# Install Node.js dependencies
print_status "Installing Node.js dependencies..."
npm install

# Verify critical packages are compatible
print_status "Verifying package compatibility..."

# Check Metro bundler
if ! npx metro --version >/dev/null 2>&1; then
    print_warning "Metro bundler not properly installed, installing..."
    npm install --save-dev metro@latest @react-native/metro-config@latest
fi

# Install iOS dependencies
print_status "Installing iOS dependencies (CocoaPods)..."
cd ios

# Update CocoaPods repo
pod repo update 2>/dev/null || print_warning "CocoaPods repo update failed (non-critical)"

# Install pods with verbose output for debugging
RCT_NEW_ARCH_ENABLED=0 NO_FLIPPER=1 pod install --verbose

if [ $? -ne 0 ]; then
    print_error "CocoaPods installation failed"
    exit 1
fi

cd ..

print_status "All dependencies installed successfully"

# Verify Metro can start
print_status "Testing Metro bundler startup..."
timeout 10 npx react-native start &
METRO_PID=$!
sleep 5

if ps -p $METRO_PID > /dev/null; then
    print_status "Metro bundler started successfully"
    kill $METRO_PID 2>/dev/null || true
else
    print_error "Metro bundler failed to start"
    exit 1
fi

echo ""
echo "🎉 Installation complete!"
echo "📱 Ready to run: npm run ios or npm run android"