# React Native Anti-Hallucination Development Guide

## 🎯 Purpose
This document prevents AI-assisted development from falling into hallucination loops by providing systematic, verifiable debugging approaches for React Native projects on Apple Silicon.

## 🔍 Common Hallucination Triggers in RN Development

### 1. **Metro Bundler Issues**
**Symptoms:** "Metro won't start", "bundler hanging", "port conflicts"
**AI Hallucination Pattern:** Suggests random port changes, cache clearing without system approach
**Solution:** Use systematic diagnostics

```bash
# Systematic Metro Debug Protocol
./scripts/diagnose-metro.sh
```

### 2. **CocoaPods Version Conflicts**
**Symptoms:** "Pod install failing", "glog build errors", "architecture conflicts"  
**AI Hallucination Pattern:** Random Podfile modifications, version downgrades
**Solution:** Use version compatibility matrix

### 3. **Package Version Mismatches**
**Symptoms:** "Peer dependency warnings", "build failures", "runtime crashes"
**AI Hallucination Pattern:** Random version bumps/downgrades without compatibility checks
**Solution:** Use compatibility verification script

## 🛠 Systematic Debugging Protocol

### Phase 1: Environment Verification
```bash
# Run before any debugging
npm run env:diagnose
```

### Phase 2: Clean State Reset
```bash
# Only when environment verification fails
npm run env:setup
```

### Phase 3: Isolated Component Testing
```bash
# Test Metro bundler specifically
npm run metro:debug

# Test iOS builds specifically  
npm run ios:clean && npm run ios
```

## 📊 Compatibility Matrix (React Native 0.75.5)

| Package | Compatible Version | Incompatible Versions |
|---------|-------------------|---------------------|
| @react-native-async-storage/async-storage | ^1.24.0 | ^2.x.x |
| react-native-gesture-handler | ~2.18.1 | ^2.20.x |
| react-native-reanimated | ~3.15.0 | ^3.16.x |
| react-native-screens | ~3.31.1 | ^4.x.x |
| react-native-vision-camera | ^4.0.0 | ^4.6.x |

## 🚫 Anti-Hallucination Rules

### Rule 1: One Change at a Time
- Make single, targeted changes
- Verify each change works before proceeding
- Document what was changed and why

### Rule 2: Use Systematic Diagnostics
- Never guess at solutions
- Always run diagnostic scripts first
- Follow the debugging protocol in order

### Rule 3: Version Compatibility First
- Check compatibility before upgrading packages
- Use the compatibility matrix above
- Verify with `npm ls` after changes

### Rule 4: Architecture Consistency
- All tools must be Apple Silicon native
- No Rosetta fallbacks
- Verify with `file $(which tool)` for binaries

## 🔧 Verification Commands

### Metro Bundler Health Check
```bash
# Test if Metro can start and serve bundles
timeout 10 npx react-native start &
curl -f http://localhost:8081/status || echo "Metro failed"
```

### iOS Build Health Check  
```bash
# Test if iOS can build and link
cd ios && xcodebuild -workspace VerryApp.xcworkspace -scheme VerryApp -configuration Debug -sdk iphonesimulator -arch x86_64 build
```

### Package Compatibility Check
```bash
# Verify no peer dependency conflicts
npm ls --depth=0 | grep -E "(UNMET|invalid)"
```

## 🎮 Development Workflow

### Daily Startup Sequence
1. `npm run env:diagnose` - Verify environment health
2. `npm start` - Start Metro bundler
3. `npm run ios` - Launch iOS simulator

### When Issues Arise
1. Stop all processes: `pkill -f "metro\|node\|Simulator"`
2. Run diagnostics: `npm run env:diagnose`
3. If diagnostics fail: `npm run env:setup`
4. Restart development sequence

### Before Asking AI for Help
1. Run the full diagnostic suite
2. Check this compatibility matrix
3. Verify the exact error message
4. State what systematic steps you've already tried

## 🚨 Red Flags (Halt AI Interaction)

- AI suggests random version changes without compatibility check
- AI recommends editing Xcode project files directly  
- AI suggests using Rosetta or x86_64 workarounds
- AI provides solutions without asking for diagnostic output
- AI suggests multiple simultaneous changes

## ✅ Green Flags (AI Assistance Is Productive)

- AI asks for specific diagnostic output first
- AI references this compatibility matrix
- AI suggests single, targeted changes
- AI provides verification steps
- AI explains the root cause of the issue

## 📝 Issue Documentation Template

When reporting issues to AI or team members:

```
**Environment:**
- Node.js version: $(node --version)
- Architecture: $(uname -m) 
- Metro status: $(curl -f http://localhost:8081/status 2>/dev/null || echo "Not running")

**Diagnostic Output:**
$(npm run env:diagnose)

**Steps Taken:**
1. [List systematic steps already attempted]

**Expected vs Actual:**
- Expected: [What should happen]
- Actual: [What actually happens with exact error messages]
```

This systematic approach prevents hallucination loops and ensures productive AI-assisted development.