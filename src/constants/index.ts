import {COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, ANIMATION} from './theme';
import {STRINGS} from './strings';

// Screen dimensions
export const SCREEN_DIMENSIONS = {
  width: 375, // Default iPhone width
  height: 812, // Default iPhone height
} as const;

// API Configuration
export const API_CONFIG = {
  baseUrl: 'https://api.verry.ai', // Change to dev URL when needed
  timeout: 30000,
  retryAttempts: 3,
} as const;

// Validation Rules
export const VALIDATION = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 254,
  },
  verificationCode: {
    length: 6,
    pattern: /^\d{6}$/,
  },
} as const;

// Camera Configuration
export const CAMERA_CONFIG = {
  quality: 0.8,
  fixOrientation: true,
  forceUpOrientation: true,
  permissionDialogTitle: 'Camera Permission',
  permissionDialogMessage: 'Verry.ai needs access to your camera to capture verification photos.',
} as const;

// Verification Steps
export const VERIFICATION_STEPS = {
  EMAIL: 'email',
  DOCUMENT_FRONT: 'document_front',
  DOCUMENT_BACK: 'document_back',
  FACE: 'face',
  COMPLETE: 'complete',
} as const;

// Export all constants
export {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  ANIMATION,
  STRINGS,
};

export type VerificationStep = typeof VERIFICATION_STEPS[keyof typeof VERIFICATION_STEPS];
export type ThemeMode = 'light' | 'dark' | 'system';