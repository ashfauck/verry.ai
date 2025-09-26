# Verry.ai - Identity Verification App

A React Native TypeScript app for secure identity verification featuring email verification, document scanning, and facial recognition.

## Features

- 📧 **Email Verification** - Secure email verification with 6-digit code
- 📄 **Document Verification** - Front and back document scanning with camera
- 👤 **Facial Recognition** - Automatic face capture and verification
- 🌙 **Dark/Light Theme** - System-aware theme switching
- 📱 **Cross-Platform** - iOS and Android support
- 🔄 **State Management** - Recoil for robust state management

## Tech Stack

- **React Native 0.75.4** - Cross-platform mobile framework
- **TypeScript** - Type-safe development
- **Recoil** - State management
- **React Navigation v6** - Navigation library
- **React Native Vision Camera** - Camera functionality
- **Vector Icons** - Icon library

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Button.tsx      # Common button component
│   ├── ThemeProvider.tsx # Theme context provider
│   └── index.ts        # Component exports
├── screens/            # App screens
│   ├── OnboardingScreen.tsx
│   ├── EmailVerificationScreen.tsx
│   ├── DocumentVerificationScreen.tsx
│   ├── FaceVerificationScreen.tsx
│   └── HomeScreen.tsx
├── navigation/         # Navigation configuration
│   └── AppNavigator.tsx
├── constants/          # App constants
│   ├── theme.ts       # Theme colors, typography, spacing
│   ├── strings.ts     # App strings and text
│   └── index.ts       # Constant exports
├── store/             # State management
│   ├── atoms.ts       # Recoil atoms and selectors
│   └── index.ts       # Store exports
├── types/             # TypeScript type definitions
│   └── index.ts
├── hooks/             # Custom React hooks
└── utils/             # Utility functions
```

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- React Native CLI
- iOS: Xcode 12+
- Android: Android Studio with SDK

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Verry.ai
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. iOS Setup:
```bash
cd ios
pod install
cd ..
```

4. Start Metro bundler:
```bash
npm start
```

5. Run on device/simulator:
```bash
# iOS
npm run ios

# Android
npm run android
```

## Development

### Theme System

The app uses a comprehensive theme system with support for light and dark modes:

- Colors are defined in `src/constants/theme.ts`
- Theme context is provided by `ThemeProvider`
- Use `useTheme()` hook to access theme in components

### State Management

Recoil is used for state management with the following key atoms:

- `themeState` - Current theme mode (light/dark/system)
- `verificationState` - User verification progress
- `globalLoadingState` - Global loading indicators
- `globalErrorState` - Global error handling

### Navigation

React Navigation v6 with stack navigator:

- `OnboardingScreen` - Welcome screen
- `EmailVerificationScreen` - Email verification flow
- `DocumentVerificationScreen` - Document capture
- `FaceVerificationScreen` - Face capture
- `HomeScreen` - Post-verification home

## Configuration

### Camera Permissions

Add camera permissions to your platform-specific files:

**iOS (ios/VerryApp/Info.plist):**
```xml
<key>NSCameraUsageDescription</key>
<string>Verry.ai needs camera access to verify your identity</string>
```

**Android (android/app/src/main/AndroidManifest.xml):**
```xml
<uses-permission android:name="android.permission.CAMERA" />
```

## API Integration

The app is configured to work with Verry.ai backend:

- Base URL: `https://api.verry.ai`
- Timeout: 30 seconds
- Retry attempts: 3

Update `src/constants/index.ts` to modify API configuration.

## Scripts

```bash
npm start          # Start Metro bundler
npm run android    # Run Android app
npm run ios        # Run iOS app
npm run lint       # Run ESLint
npm run test       # Run Jest tests
npm run clean      # Clean React Native cache
```

## Contributing

1. Follow TypeScript best practices
2. Use the established component patterns
3. Maintain theme consistency
4. Add proper error handling
5. Write meaningful commit messages

## License

Copyright © 2025 Verry.ai. All rights reserved.