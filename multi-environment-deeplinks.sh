#!/bin/bash

# Multi-Environment Deep Linking Configuration Script
# This script helps manage associated domains for different build configurations

echo "🌍 Multi-Environment Deep Linking Setup"
echo "========================================"

echo ""
echo "📱 Build Configurations:"
echo "├── Development (dev.appnoize.verry.ai)"
echo "│   ├── Domains: dev.verry.ai, 54n8hcsj-3000.inc1.devtunnels.ms, localhost:3000"
echo "│   ├── Entitlements: VerryApp-Development.entitlements"
echo "│   └── AASA: apple-app-site-association-development.json"
echo "├── Staging (staging.appnoize.verry.ai)"
echo "│   ├── Domains: staging.verry.ai, qa.verry.ai, test.verry.ai"
echo "│   ├── Entitlements: VerryApp-Staging.entitlements"
echo "│   └── AASA: apple-app-site-association-staging.json"
echo "└── Production (com.appnoize.verry.ai)"
echo "    ├── Domains: verry.ai, www.verry.ai, app.verry.ai"
echo "    ├── Entitlements: VerryApp-Production.entitlements"
echo "    └── AASA: apple-app-site-association-production.json"

echo ""
echo "🔗 Deep Link Testing URLs by Environment:"
echo ""

echo "🧪 Development Environment:"
echo "• Custom Scheme: verryapp://verify/test123"
echo "• Test Tunnel: https://54n8hcsj-3000.inc1.devtunnels.ms/verify/test123"
echo "• Local Dev: https://localhost:3000/verify/test123"
echo "• Dev Domain: https://dev.verry.ai/verify/test123"

echo ""
echo "🚧 Staging Environment:"
echo "• Custom Scheme: verryapp://verify/test123"
echo "• Staging: https://staging.verry.ai/verify/test123"
echo "• QA: https://qa.verry.ai/verify/test123"
echo "• Test: https://test.verry.ai/verify/test123"

echo ""
echo "🚀 Production Environment:"
echo "• Custom Scheme: verryapp://verify/test123"
echo "• Main: https://verry.ai/verify/test123"
echo "• WWW: https://www.verry.ai/verify/test123"
echo "• App: https://app.verry.ai/verify/test123"

echo ""
echo "📋 Bundle IDs by Environment:"
echo "• Development: dev.appnoize.verry.ai"
echo "• Staging: staging.appnoize.verry.ai"
echo "• Production: com.appnoize.verry.ai"

echo ""
echo "🔧 Configuration Files:"
echo "iOS Entitlements:"
echo "├── VerryApp-Development.entitlements (Dev domains + test URLs)"
echo "├── VerryApp-Staging.entitlements (Staging domains)"
echo "└── VerryApp-Production.entitlements (Production domains only)"

echo ""
echo "AASA Files:"
echo "├── web-assets/aasa/apple-app-site-association-development.json"
echo "├── web-assets/aasa/apple-app-site-association-staging.json"
echo "└── web-assets/aasa/apple-app-site-association-production.json"

echo ""
echo "Android Asset Links:"
echo "├── web-assets/assetlinks/assetlinks-development.json"
echo "├── web-assets/assetlinks/assetlinks-staging.json"
└── web-assets/assetlinks/assetlinks-production.json"

echo ""
echo "🎯 Testing Instructions:"
echo ""
echo "1. Select the appropriate scheme in Xcode:"
echo "   • VerryAppDevelopment - for dev testing"
echo "   • VerryAppStaging - for staging testing"
echo "   • VerryApp - for production testing"
echo ""
echo "2. Build and install the app with the selected configuration"
echo ""
echo "3. Test the appropriate URLs for that environment:"
echo "   • Development: Use tunnel URL or localhost"
echo "   • Staging: Use staging.verry.ai"
echo "   • Production: Use verry.ai"
echo ""
echo "4. Universal Links Requirements:"
echo "   • iOS: Test in Safari only"
echo "   • Android: Test in Chrome or default browser"
echo "   • Ensure app is installed and opened at least once"
echo ""
echo "5. Troubleshooting:"
echo "   • Clear Safari website data if Universal Links don't work"
echo "   • Check that the correct AASA file is served by your domain"
echo "   • Verify bundle ID matches the environment configuration"

# Function to check AASA file for a domain
check_aasa_file() {
    local domain=$1
    local file_path=$2
    
    echo ""
    echo "🔍 Checking AASA for $domain..."
    
    if [ -f "$file_path" ]; then
        echo "✅ Local AASA file exists: $file_path"
        
        # Check if domain is accessible
        if curl -s --head --request GET "https://$domain/.well-known/apple-app-site-association" | grep "200 OK" > /dev/null; then
            echo "✅ AASA file is accessible at https://$domain/.well-known/apple-app-site-association"
        else
            echo "❌ AASA file not accessible - make sure your server serves it correctly"
        fi
    else
        echo "❌ Local AASA file missing: $file_path"
    fi
}

echo ""
echo "🌐 Domain Verification:"

# Only check the test tunnel since that's what's currently available
check_aasa_file "54n8hcsj-3000.inc1.devtunnels.ms" "web-assets/aasa/apple-app-site-association-development.json"

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "Your app now supports separate associated domains for each build configuration:"
echo "• Development builds will handle dev domains and test URLs"
echo "• Staging builds will handle staging domains"  
echo "• Production builds will only handle production domains"
echo ""
echo "This separation ensures clean testing and prevents conflicts between environments!"