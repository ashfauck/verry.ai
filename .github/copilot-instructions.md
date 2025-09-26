# Verry.ai Development Instructions

## Project Overview
React Native TypeScript app for identity verification featuring:
- Email verification with 6-digit code
- Document scanning (front/back with camera)
- Facial recognition (automatic capture)
- Recoil state management
- Dark/light theme support
- Cross-platform iOS/Android support

## Development Guidelines

### Code Style
- Use TypeScript for all components and utilities
- Follow React Native best practices
- Maintain consistent component patterns
- Use Recoil for state management
- Implement proper error handling

### Theme System
- Use the centralized theme system in `src/constants/theme.ts`
- Access theme via `useTheme()` hook from `ThemeProvider`
- Support both light and dark modes
- Maintain visual consistency across screens

### State Management
- Use Recoil atoms defined in `src/store/atoms.ts`
- Follow the established patterns for verification state
- Implement proper loading and error states
- Use selectors for computed values

### Navigation
- Follow React Navigation v6 patterns
- Maintain proper screen flow: Onboarding → Email → Document → Face → Home
- Handle navigation state properly
- Implement proper screen transitions

### Component Architecture
- Use the common Button component for consistency
- Create reusable components in `src/components/`
- Follow the established file structure
- Export components through index files

## Development Progress

✅ **Project Setup Complete**
- React Native 0.75.4 with TypeScript
- iOS/Android native folders configured
- Dependencies installed and configured
- Metro bundler running successfully

✅ **Core Implementation Complete**
- All verification screens implemented with full functionality
- Email verification with validation and timer
- Document capture with camera simulation
- Face verification with animated detection
- Comprehensive theme system
- Recoil state management setup
- Navigation flow complete

✅ **Build System Complete**
- Metro bundler task created and running
- Development server ready on port 8081
- Ready for iOS/Android deployment

✅ **Quality Assurance Complete**
- TypeScript compilation successful
- No build errors
- Comprehensive error handling
- Proper state management
- Responsive UI design

## Next Steps
- Integrate real camera functionality (replace simulation)
- Connect to Verry.ai backend APIs
- Add unit tests for components
- Optimize performance and animations
- Add accessibility features

## Key Files
- `App.tsx` - Main app entry point
- `src/screens/*` - All verification screens
- `src/components/ThemeProvider.tsx` - Theme management
- `src/store/atoms.ts` - State management
- `src/constants/theme.ts` - Design system
- `src/navigation/AppNavigator.tsx` - Navigation setup