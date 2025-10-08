import {Linking} from 'react-native';
import {useEffect} from 'react';
import {useSetRecoilState} from 'recoil';
import {verificationIdState, attemptIdState} from '../store/atoms';

export const useDeepLinking = () => {
  const setVerificationId = useSetRecoilState(verificationIdState);
  const setAttemptId = useSetRecoilState(attemptIdState);

  // Extract verification ID and attempt ID from URL
  const extractDeepLinkParams = (url: string): {verificationId: string | null; attemptId: string | null} => {
    try {
      console.log('🔗 Parsing deep link URL:', url);
      
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const searchParams = urlObj.searchParams;
      
      let verificationId: string | null = null;
      let attemptId: string | null = null;
      
      // Check for verification_id and attempt_id in query parameters
      verificationId = searchParams.get('verification_id') || searchParams.get('verificationId');
      attemptId = searchParams.get('attempt_id') || searchParams.get('attemptId');
      
      // If not found in query params, check various path patterns
      if (!verificationId) {
        // Pattern: /verify/verif123 or /verification/verif123
        const verifyMatch = pathname.match(/\/(verify|verification)\/([^\/\?]+)/);
        if (verifyMatch && verifyMatch[2]) {
          verificationId = verifyMatch[2];
        }
        
        // Pattern: /v/verif123 (short form)
        if (!verificationId) {
          const shortMatch = pathname.match(/\/v\/([^\/\?]+)/);
          if (shortMatch && shortMatch[1]) {
            verificationId = shortMatch[1];
          }
        }
      }
      
      // Check for attempt_id in path (e.g., /verify/verif123/attempt/att456)
      if (!attemptId) {
        const attemptPathMatch = pathname.match(/\/attempt\/([^\/\?]+)/);
        if (attemptPathMatch && attemptPathMatch[1]) {
          attemptId = attemptPathMatch[1];
        }
        
        // Pattern: /a/att456 (short form)
        if (!attemptId) {
          const shortAttemptMatch = pathname.match(/\/a\/([^\/\?]+)/);
          if (shortAttemptMatch && shortAttemptMatch[1]) {
            attemptId = shortAttemptMatch[1];
          }
        }
      }
      
      console.log('🔍 Extracted params:', { verificationId, attemptId });
      return { verificationId, attemptId };
    } catch (error) {
      console.warn('❌ Failed to parse deep link URL:', error);
      return { verificationId: null, attemptId: null };
    }
  };

  // Handle initial URL when app is opened via deep link
  const handleInitialURL = async () => {
    try {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        const { verificationId, attemptId } = extractDeepLinkParams(initialUrl);
        if (verificationId) {
          setVerificationId(verificationId);
        }
        if (attemptId) {
          setAttemptId(attemptId);
        }
      }
    } catch (error) {
      console.warn('Failed to get initial URL:', error);
    }
  };

  // Handle URL changes when app is already open
  const handleUrlChange = (url: string) => {
    const { verificationId, attemptId } = extractDeepLinkParams(url);
    if (verificationId) {
      setVerificationId(verificationId);
    }
    if (attemptId) {
      setAttemptId(attemptId);
    }
  };

  useEffect(() => {
    // Handle initial URL
    handleInitialURL();

    // Listen for URL changes
    const subscription = Linking.addEventListener('url', ({url}) => {
      handleUrlChange(url);
    });

    return () => {
      subscription?.remove();
    };
  }, [setVerificationId, setAttemptId]);

  return {
    extractDeepLinkParams,
  };
};