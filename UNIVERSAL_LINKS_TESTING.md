📱 Universal Links Testing Checklist
=====================================

🚨 CRITICAL: Universal Links ONLY work in Safari on iOS
❌ Will NOT work in: Chrome, Firefox, Edge, or any other browser
✅ Must test in: Safari

📋 Exact Testing Procedure:

1. 🔨 Build & Install:
   • In Xcode, select "VerryAppDevelopment" scheme
   • Build and install on device (not simulator for best results)
   • Open the app at least once

2. 🌐 Test in Safari:
   • Open Safari (not any other browser!)
   • Type or paste: https://54n8hcsj-3000.inc1.devtunnels.ms/verify/test123
   • Press Enter to navigate to the page

3. 🔍 Check for Universal Link Recognition:
   • Once page loads, LONG-PRESS the URL in Safari's address bar
   • Look for "Open in VerryApp" option in the popup menu
   • If you see this option → Universal Links are working!

4. 📱 Alternative Test - Smart Banner:
   • Some apps show a smart banner at the top saying "Open in App"
   • Look for a banner or "Open" button on the webpage

🛠 If Universal Links Still Don't Work:

Reset Method 1 - Clear Safari Cache:
• Settings → Safari → Clear History and Website Data
• Restart Safari and test again

Reset Method 2 - Full Reset:
• Delete the VerryApp completely
• Settings → Safari → Clear History and Website Data  
• Restart your iPhone/iPad
• Rebuild and install with VerryAppDevelopment scheme
• Open app once, then test in Safari

Reset Method 3 - Force AASA Re-validation:
• Install app in Airplane mode (prevents AASA validation)
• Turn on internet, delete and reinstall app
• This forces iOS to re-download and validate AASA file

🔍 Debugging Tips:

Check iOS Console Logs:
• Connect device to Mac
• Open Console app on Mac
• Filter for "swcd" (iOS Universal Links daemon)
• Look for AASA validation errors

Verify AASA Content Type:
• Server must serve AASA with Content-Type: application/json
• No redirects allowed for /.well-known/apple-app-site-association

🎯 Expected Behavior:
When Universal Links work correctly:
• Tapping the link in Safari opens the app directly
• Long-pressing shows "Open in VerryApp" option
• The app receives the full URL for processing

⚠️ Remember: The most common issue is testing in the wrong browser!
Universal Links are Safari-only on iOS.