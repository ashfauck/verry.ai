import {LinkingOptions} from '@react-navigation/native';
import type {RootStackParamList} from '../navigation/AppNavigator';

export const linkingConfig: LinkingOptions<RootStackParamList> = {
  prefixes: [
    // Custom URL schemes
    'verryapp://',
    'verry://',
    // Universal Links
    'https://verry.ai',
    'https://www.verry.ai', 
    'https://app.verry.ai',
  ],
  config: {
    screens: {
      // Onboarding screen handles all verification deep links
      Onboarding: {
        path: '/',
        // This will catch all paths and let the onboarding screen handle the verification logic
      },
      // Specific paths for direct navigation (if needed in the future)
      EmailVerification: 'email-verification',
      DocumentVerification: 'document-verification', 
      FaceVerification: 'face-verification',
      Home: 'home',
      NotFound: 'not-found',
    },
  },
  // Custom URL parsing to handle verification parameters
  getInitialURL: async () => {
    // This will be handled by our useDeepLinking hook
    return null;
  },
  subscribe: (listener) => {
    // This will be handled by our useDeepLinking hook
    return () => {};
  },
};

export default linkingConfig;