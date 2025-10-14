import {Linking} from 'react-native';
import {useEffect} from 'react';
import {useSetRecoilState} from 'recoil';
import { useNavigation } from '@react-navigation/native';
import {verificationIdState, attemptIdState} from '../store/atoms';
import { useVerificationStatus } from './useVerificationStatus';

export const useDeepLinking = () => {
  const setVerificationId = useSetRecoilState(verificationIdState);
  const setAttemptId = useSetRecoilState(attemptIdState);
  const navigation = useNavigation();
  const {checkVerificationStatus, isLoading, hasError, error} = useVerificationStatus();

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
  const handleUrlChange = async (url: string) => {
    console.log("URL Change: Deeplink", url);
    const { verificationId, attemptId } = extractDeepLinkParams(url);
    if (verificationId) {
      setVerificationId(verificationId);
    }
    if (attemptId) {
      setAttemptId(attemptId);
    }

    // If both IDs are present, call verification status API
    if (verificationId && attemptId) {
      const result = await checkVerificationStatus(verificationId, attemptId );
      
            if (result.success) {
              // If attemptId is present in both deep link and API response, match them
      
              if (result.hasAttemptId) {
                const matchingAttempt = result.data?.verification_attempts?.filter(a => a.id === attemptId) || [];
      
                if (matchingAttempt.length > 0) {
                  const verificationAttempt = matchingAttempt[0];
      
                  if (!verificationAttempt.email_verified) {
                   (navigation as any).navigate('EmailVerification');
                   return; 
                  } else if (!verificationAttempt.document_scanned) {
                    (navigation as any).navigate('DocumentCapture');
                    return;
                  } else if (!verificationAttempt.face_verified) {
                    (navigation as any).navigate('FaceVerification');
                    return;
                  } else {
                    // All steps completed, navigate to Success or Dashboard
                    (navigation as any).navigate('Home');
                    return;
                  }
                }
              } else {
                (navigation as any).navigate('NotFound');
                return;
                // Attempt ID mismatch or not found, show alert only
                // Alert.alert(
                //   'Verification Error',
                //   'Attempt ID does not match or not found. Please try again.',
                //   [
                //     {
                //       text: 'OK',
                //       onPress: () => {},
                //     },
                //   ]
                // );
              }
            } else {
              // API call failed, show error only
              Alert.alert(
                'Verification Error',
                result.error || 'Failed to verify the link. Please try again.',
                [
                  {
                    text: 'OK',
                    onPress: () => {},
                  },
                ]
              );
            }
    } else {
      // Fallback: check for onboarding wizard in path
      try {
        const urlObj = new URL(url);
        if (urlObj.pathname.includes('onboarding/wizard')) {
          (navigation as any).navigate('Onboarding');
        }
      } catch (e) {
        // ignore URL parse errors
      }
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