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
      verificationId = searchParams.get('vid') || searchParams.get('verificationId');
      attemptId = searchParams.get('attempt_id') || searchParams.get('attemptId');
      
      console.log('🔍 Extracted params:', { verificationId, attemptId });
      return { verificationId, attemptId };
    } catch (error) {
      console.warn('❌ Failed to parse deep link URL:', error);
      return { verificationId: null, attemptId: null };
    }
  };

  // Handle initial URL when app is opened via deep link
  // const handleInitialURL = async () => {
  //   try {
  //     const initialUrl = await Linking.getInitialURL();
  //     console.log("Initial URL: Deeplink", initialUrl);
  //     if (initialUrl) {
  //       const { verificationId, attemptId } = extractDeepLinkParams(initialUrl);
  //       if (verificationId) {
  //         setVerificationId(verificationId);
  //       }
  //       if (attemptId) {
  //         setAttemptId(attemptId);
  //       }
  //     }
  //   } catch (error) {
  //     console.warn('Failed to get initial URL:', error);
  //   }
  // };

  // Handle URL changes when app is already open
  const handleUrlChange = (url: string) => {
    console.log("URL Change: Deeplink", url);
    const { verificationId, attemptId } = extractDeepLinkParams(url);
    if (verificationId) {
      setVerificationId(verificationId);
    }
    if (attemptId) {
      setAttemptId(attemptId);
    }
  };

  // useEffect(() => {
  //   // Handle initial URL
  //   handleInitialURL();

  //   // Listen for URL changes
  //   const subscription = Linking.addEventListener('url', ({url}) => {
  //     handleUrlChange(url);
  //   });

  //   return () => {
  //     subscription?.remove();
  //   };
  // }, [setVerificationId, setAttemptId]);

  useEffect(() => {
    Linking.getInitialURL()
      .then(url => {
        if (url) handleUrlChange(url);
      })
      .catch(err => {});

    const subscription = Linking.addEventListener('url', (event) => {
      console.log("URL Listener: Deeplink", event.url);
      handleUrlChange(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, [setVerificationId, setAttemptId]);

  return {
    extractDeepLinkParams,
  };
};