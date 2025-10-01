import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  Image,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../components/ThemeProvider';
import { VisualCropEditor } from '../components/VisualCropEditor';
import type { NavigationProps } from '../types';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { RouteProp } from '@react-navigation/native';

type VisualCropRouteProp = RouteProp<RootStackParamList, 'VisualCrop'>;

/**
 * Visual Crop Screen - Allows user to manually adjust crop area
 * This eliminates all coordinate mapping issues by letting the user
 * visually select the exact area they want to crop
 */
const VisualCropScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProps['navigation']>();
  const route = useRoute<VisualCropRouteProp>();
  const params = route.params;

  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(
    params.imageSize || null
  );
  const [isLoadingImage, setIsLoadingImage] = useState(!params.imageSize);

  const currentStep = params.step || 'front';
  const isBackSide = currentStep === 'back';

  // Get image dimensions if not provided
  useEffect(() => {
    if (!imageSize && params.imageUri) {
      setIsLoadingImage(true);
      Image.getSize(
        params.imageUri,
        (width, height) => {
          console.log('📏 Visual crop - Image dimensions:', { width, height });
          setImageSize({ width, height });
          setIsLoadingImage(false);
        },
        (error) => {
          console.error('❌ Failed to get image size:', error);
          Alert.alert(
            'Error', 
            'Unable to load image dimensions. Please try again.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
          setIsLoadingImage(false);
        }
      );
    }
  }, [params.imageUri, imageSize, navigation]);

  const handleCropComplete = (croppedImageUri: string, cropArea: { x: number; y: number; width: number; height: number }) => {
    console.log('✅ Visual crop complete:');
    console.log('  Original image:', params.imageUri);
    console.log('  Cropped image:', croppedImageUri);
    console.log('  Crop area:', cropArea);

    // Navigate to confirmation screen with the visually cropped result
    navigation.navigate('DocumentConfirmation', {
      step: currentStep,
      originalImageUri: params.imageUri,
      croppedImageUri: croppedImageUri,
      bounds: cropArea,
      cropMethod: 'visual'
    });
  };

  const handleCancel = () => {
    // Go back to camera
    navigation.goBack();
  };

  if (isLoadingImage) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textPrimary }]}>
            Loading image...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!imageSize) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            Unable to load image. Please try again.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <VisualCropEditor
      imageUri={params.imageUri}
      imageSize={imageSize}
      initialCropArea={params.initialCropArea}
      onCropComplete={handleCropComplete}
      onCancel={handleCancel}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default VisualCropScreen;