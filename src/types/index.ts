export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  documentVerified: boolean;
  faceVerified: boolean;
  verificationStep: VerificationStep;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationState {
  currentStep: VerificationStep;
  email: string;
  emailVerified: boolean;
  verificationCode: string;
  documentFront: string | null;
  documentBack: string | null;
  documentVerified: boolean;
  faceImage: string | null;
  faceVerified: boolean;
  isLoading: boolean;
  error: string | null;
  udid?: string; // Added for document uploads
}

export interface EmailVerificationData {
  email: string;
  code: string;
}

export interface DocumentCapture {
  uri: string;
  type: 'front' | 'back';
  timestamp: number;
}

export interface FaceCapture {
  uri: string;
  timestamp: number;
  confidence?: number;
}

export interface Theme {
  colors: typeof import('../constants/theme').COLORS.light | typeof import('../constants/theme').COLORS.dark | typeof import('../constants/theme').COLORS.orangeDark;
  typography: typeof import('../constants/theme').TYPOGRAPHY;
  spacing: typeof import('../constants/theme').SPACING;
  borderRadius: typeof import('../constants/theme').BORDER_RADIUS;
  shadows: typeof import('../constants/theme').SHADOWS;
  animation: typeof import('../constants/theme').ANIMATION;
}

export interface CameraOptions {
  quality: number;
  mediaType: 'photo' | 'video';
  includeBase64: boolean;
  maxHeight?: number;
  maxWidth?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  error?: string;
}

export interface NavigationProps {
  navigation: any;
  route: any;
}

export type VerificationStep = 'email' | 'document_front' | 'document_back' | 'face' | 'complete';

export type ThemeMode = 'light' | 'dark' | 'system';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

export type ButtonSize = 'small' | 'medium' | 'large';