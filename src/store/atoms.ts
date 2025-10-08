import {atom, selector} from 'recoil';
import type {VerificationState, ThemeMode} from '../types';

// Theme state
export const themeState = atom<ThemeMode>({
  key: 'themeState',
  default: 'system',
});

// User verification state
export const verificationState = atom<VerificationState>({
  key: 'verificationState',
  default: {
    currentStep: 'email',
    email: '',
    emailVerified: false,
    verificationCode: '',
    documentFront: null,
    documentBack: null,
    documentVerified: false,
    faceImage: null,
    faceVerified: false,
    isLoading: false,
    error: null,
  },
});

// Loading state for global loading indicators
export const globalLoadingState = atom<boolean>({
  key: 'globalLoadingState',
  default: false,
});

// Error state for global error handling
export const globalErrorState = atom<string | null>({
  key: 'globalErrorState',
  default: null,
});

// Deep linking and verification ID state
export const verificationIdState = atom<string | null>({
  key: 'verificationIdState',
  default: null,
});

export const attemptIdState = atom<string | null>({
  key: 'attemptIdState',
  default: null,
});

export const verificationStatusState = atom<{
  status: 'idle' | 'loading' | 'success' | 'error';
  hasAttemptId: boolean;
  error: string | null;
}>({
  key: 'verificationStatusState',
  default: {
    status: 'idle',
    hasAttemptId: false,
    error: null,
  },
});

// Selectors for computed values
export const verificationProgressSelector = selector({
  key: 'verificationProgressSelector',
  get: ({get}) => {
    const verification = get(verificationState);
    let progress = 0;
    
    if (verification.emailVerified) progress += 33;
    if (verification.documentVerified) progress += 33;
    if (verification.faceVerified) progress += 34;
    
    return progress;
  },
});

export const canProceedSelector = selector({
  key: 'canProceedSelector',
  get: ({get}) => {
    const verification = get(verificationState);
    
    switch (verification.currentStep) {
      case 'email':
        return verification.emailVerified;
      case 'document_front':
        return verification.documentFront !== null;
      case 'document_back':
        return verification.documentBack !== null;
      case 'face':
        return verification.faceImage !== null;
      default:
        return false;
    }
  },
});

export const isVerificationCompleteSelector = selector({
  key: 'isVerificationCompleteSelector',
  get: ({get}) => {
    const verification = get(verificationState);
    return verification.emailVerified && 
           verification.documentVerified && 
           verification.faceVerified;
  },
});