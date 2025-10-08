#!/bin/bash
# Metro Bundler and React Native Environment Diagnostic Script
# Provides systematic debugging information to prevent AI hallucinations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

echo "🔍 React Native Environment Diagnostics"
echo "======================================"
echo "$(date)"
echo ""

# System Architecture Check
print_header "System Architecture"
ARCH=$(uname -m)
if [[ "$ARCH" == "arm64" ]]; then
    print_success "Apple Silicon (ARM64) detected: $ARCH"
else
    print_warning "Not Apple Silicon: $ARCH (may cause compatibility issues)"
fi

# Node.js Environment
print_header "Node.js Environment"
NODE_VERSION=$(node --version)
NODE_PATH=$(which node)
print_info "Node.js version: $NODE_VERSION"
print_info "Node.js path: $NODE_PATH"

# Check if Node.js is native ARM64
if file "$NODE_PATH" | grep -q "arm64"; then
    print_success "Node.js is native ARM64"
else
    print_warning "Node.js may not be native ARM64"
    file "$NODE_PATH"
fi

# Package Manager
print_header "Package Manager"
NPM_VERSION=$(npm --version)
print_info "npm version: $NPM_VERSION"

# React Native CLI
print_header "React Native CLI"
if command -v npx react-native >/dev/null 2>&1; then
    RN_CLI_VERSION=$(npx react-native --version | head -1)
    print_success "React Native CLI available: $RN_CLI_VERSION"
else
    print_error "React Native CLI not available"
fi

# Metro Bundler Status
print_header "Metro Bundler Status"
METRO_PID=$(lsof -ti:8081 2>/dev/null || echo "")
if [ -n "$METRO_PID" ]; then
    print_warning "Metro already running on port 8081 (PID: $METRO_PID)"
    
    # Test if Metro is responsive
    if curl -sf http://localhost:8081/status >/dev/null 2>&1; then
        print_success "Metro is responsive"
    else
        print_error "Metro is running but not responsive"
    fi
else
    print_info "Metro not running on port 8081"
    
    # Test if Metro can start
    print_info "Testing Metro startup..."
    (timeout 10 npx react-native start >/dev/null 2>&1 &)
    sleep 3
    
    NEW_METRO_PID=$(lsof -ti:8081 2>/dev/null || echo "")
    if [ -n "$NEW_METRO_PID" ]; then
        print_success "Metro can start successfully"
        kill $NEW_METRO_PID 2>/dev/null || true
    else
        print_error "Metro failed to start"
    fi
fi

# iOS Development Environment
print_header "iOS Development Environment"
if command -v xcodebuild >/dev/null 2>&1; then
    XCODE_VERSION=$(xcodebuild -version | head -1)
    print_success "Xcode available: $XCODE_VERSION"
else
    print_error "Xcode not available"
fi

if command -v xcrun >/dev/null 2>&1; then
    if xcrun simctl list devices | grep -q "Booted"; then
        print_success "iOS Simulator is running"
    else
        print_info "iOS Simulator not running"
    fi
else
    print_error "xcrun not available"
fi

# CocoaPods Environment
print_header "CocoaPods Environment"
if command -v pod >/dev/null 2>&1; then
    POD_VERSION=$(pod --version)
    print_success "CocoaPods available: $POD_VERSION"
    
    # Check if Pods are installed
    if [ -f "ios/Podfile.lock" ]; then
        print_success "Podfile.lock exists"
        PODS_COUNT=$(grep -c "^  -" ios/Podfile.lock 2>/dev/null || echo "0")
        print_info "Installed pods: $PODS_COUNT"
    else
        print_warning "Podfile.lock not found - pods may not be installed"
    fi
    
    if [ -d "ios/Pods" ]; then
        print_success "Pods directory exists"
    else
        print_warning "Pods directory not found"
    fi
else
    print_error "CocoaPods not available"
fi

# Package Dependencies
print_header "Package Dependencies"
if [ -f "package.json" ]; then
    print_success "package.json found"
    
    # Check for node_modules
    if [ -d "node_modules" ]; then
        print_success "node_modules directory exists"
        PACKAGES_COUNT=$(find node_modules -maxdepth 1 -type d | wc -l)
        print_info "Installed packages: $((PACKAGES_COUNT - 1))"
    else
        print_error "node_modules not found - run npm install"
    fi
    
    # Check for peer dependency issues
    print_info "Checking for peer dependency conflicts..."
    if npm ls >/dev/null 2>&1; then
        print_success "No peer dependency conflicts"
    else
        print_warning "Peer dependency issues detected:"
        npm ls 2>&1 | grep -E "(UNMET|invalid)" || print_info "No specific conflicts found"
    fi
else
    print_error "package.json not found"
fi

# React Native Project Structure
print_header "Project Structure"
REQUIRED_FILES=("App.tsx" "index.js" "metro.config.js" "ios/Podfile")
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "$file exists"
    else
        print_error "$file missing"
    fi
done

REQUIRED_DIRS=("ios" "android" "src")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        print_success "$dir/ directory exists"
    else
        print_warning "$dir/ directory missing"
    fi
done

# Metro Cache Status
print_header "Metro Cache Status"
CACHE_LOCATIONS=(
    "/tmp/metro-*"
    "/tmp/react-*" 
    "$HOME/.metro"
    "/tmp/haste-map-*"
    "node_modules/.cache"
)

CACHE_FOUND=false
for pattern in "${CACHE_LOCATIONS[@]}"; do
    if ls $pattern >/dev/null 2>&1; then
        print_warning "Cache found: $pattern"
        CACHE_FOUND=true
    fi
done

if [ "$CACHE_FOUND" = false ]; then
    print_success "No Metro cache found (clean state)"
fi

# Network Connectivity
print_header "Network Connectivity"
if ping -c 1 8.8.8.8 >/dev/null 2>&1; then
    print_success "Internet connectivity available"
else
    print_error "No internet connectivity"
fi

# Summary and Recommendations
print_header "Summary and Recommendations"

# Count issues
ERRORS=$(cat << 'EOF' | grep -c "❌" || echo "0")
EOF

if [ "$ERRORS" -eq 0 ]; then
    print_success "Environment appears healthy - ready for development"
    echo ""
    echo "🚀 Recommended next steps:"
    echo "   1. npm start           # Start Metro bundler"
    echo "   2. npm run ios         # Launch iOS app" 
else
    print_warning "Issues detected in environment"
    echo ""
    echo "🔧 Recommended fixes:"
    echo "   1. ./scripts/clean-environment.sh   # Clean environment"
    echo "   2. ./scripts/install-dependencies.sh # Reinstall dependencies"
    echo "   3. npm run env:diagnose             # Re-run diagnostics"
fi

echo ""
print_info "For systematic debugging, see: docs/ANTI_HALLUCINATION_GUIDE.md"