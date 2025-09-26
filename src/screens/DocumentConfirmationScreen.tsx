import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useRecoilState} from 'recoil';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useTheme} from '../components/ThemeProvider';
import {Button} from '../components';
import {verificationState} from '../store/atoms';
import {STRINGS} from '../constants/strings';
import type {NavigationProps} from '../types';

const {width: screenWidth} = Dimensions.get('window');

interface RouteParams {
  step: 'front' | 'back';
  originalImageUri: string;
  croppedImageUri: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

const DocumentConfirmationScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<NavigationProps['navigation']>();
  const route = useRoute();
  const params = route.params as RouteParams;
  
  const [verification, setVerification] = useRecoilState(verificationState);
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const currentStep = params?.step || 'front';
  const isBackSide = currentStep === 'back';
  
  // Ensure we have the required parameters
  useEffect(() => {
    if (!params?.croppedImageUri || !params?.originalImageUri) {
      Alert.alert(
        STRINGS.common.error,
        'Missing image data. Please try capturing again.',
        [
          {
            text: STRINGS.common.ok,
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  }, [params, navigation]);

  const handleAcceptDocument = async () => {
    setIsLoading(true);
    
    try {
      // Update verification state with the cropped image
      setVerification(prev => {
        const updatedState = {
          ...prev,
          error: null,
        };
        
        if (isBackSide) {
          updatedState.documentBack = params.croppedImageUri;
          // If both front and back are captured, mark as verified
          if (prev.documentFront) {
            updatedState.documentVerified = true;
            updatedState.currentStep = 'face';
          }
        } else {
          updatedState.documentFront = params.croppedImageUri;
          updatedState.currentStep = 'document_back';
        }
        
        return updatedState;
      });

      // Navigate to next step
      if (isBackSide && verification.documentFront) {
        // Both sides captured, go to face verification
        setTimeout(() => {
          navigation.navigate('FaceVerification');
        }, 500);
      } else {
        // Go to back side capture
        setTimeout(() => {
          navigation.navigate('DocumentVerification', { step: 'back' });
        }, 500);
      }
      
    } catch (error) {
      console.error('Error accepting document:', error);
      Alert.alert(STRINGS.common.error, 'Failed to save document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetakeDocument = () => {
    // Go back to document verification screen
    navigation.goBack();
  };

  const handleImageError = () => {
    setImageError(true);
    console.error('Failed to load cropped image:', params?.croppedImageUri);
  };

  const getTitle = () => {
    return isBackSide ? STRINGS.document.backIdTitle : STRINGS.document.frontIdTitle;
  };

  const getInstruction = () => {
    return isBackSide 
      ? 'Confirm the back of your ID is clearly visible'
      : 'Confirm the front of your ID is clearly visible';
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: theme.spacing.lg,
      alignItems: 'center',
    },
    title: {
      fontSize: theme.typography.fontSize['2xl'],
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    instruction: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: theme.typography.lineHeight.base,
    },
    imageContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.lg,
    },
    croppedImage: {
      width: screenWidth - (theme.spacing.lg * 2),
      height: 240,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: theme.colors.cardBackground,
      borderWidth: 2,
      borderColor: theme.colors.success,
      ...theme.shadows.md,
    },
    imageError: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.backgroundSecondary,
      borderStyle: 'dashed',
      borderColor: theme.colors.error,
    },
    errorText: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.error,
      textAlign: 'center',
      marginTop: theme.spacing.sm,
    },
    errorIcon: {
      fontSize: 48,
      color: theme.colors.error,
    },
    qualityInfo: {
      marginTop: theme.spacing.md,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.backgroundSecondary,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
    },
    qualityText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    buttonContainer: {
      padding: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
    },
    acceptButton: {
      marginBottom: theme.spacing.md,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginLeft: theme.spacing.sm,
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.buttonText,
    },
  });

  if (!params?.croppedImageUri) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.imageContainer, { justifyContent: 'center' }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            Loading image...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{getTitle()}</Text>
        <Text style={styles.instruction}>{getInstruction()}</Text>
      </View>

      <View style={styles.imageContainer}>
        {imageError ? (
          <View style={[styles.croppedImage, styles.imageError]}>
            <Text style={styles.errorIcon}>📷</Text>
            <Text style={styles.errorText}>
              Failed to load image
            </Text>
          </View>
        ) : (
          <>
            <Image
              source={{ uri: params.croppedImageUri }}
              style={styles.croppedImage}
              resizeMode="contain"
              onError={handleImageError}
            />
            <View style={styles.qualityInfo}>
              <Text style={styles.qualityText}>
                ✅ Document detected and cropped successfully
              </Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <View style={styles.acceptButton}>
          <Button
            title={isLoading ? 'Saving...' : 'Accept & Continue'}
            onPress={handleAcceptDocument}
            disabled={isLoading || imageError}
            loading={isLoading}
            fullWidth
          />
        </View>
        
        <Button
          title={STRINGS.document.retakePicture}
          onPress={handleRetakeDocument}
          variant="outline"
          disabled={isLoading}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
};

export default DocumentConfirmationScreen;