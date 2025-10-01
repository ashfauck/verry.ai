import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../components/ThemeProvider';
import { Button } from '../components';
import { STRINGS } from '../constants/strings';
import type { NavigationProps } from '../types';

// Import the new polygon cropper
import { 
  cropDocument, 
  cropDetectedDocument, 
  createFallbackCrop,
  Point, 
  PolygonCropResult,
  PolygonCropOptions 
} from '../utils/polygonCropper';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface RouteParams {
  step: 'front' | 'back';
  originalImageUri: string;
  detectedCorners?: Point[]; // Polygon points from document detection
  bounds?: { x: number; y: number; width: number; height: number }; // Legacy bounds support
}

/**
 * Document Review Screen demonstrating polygon-based cropping
 * This screen allows users to review and crop documents using detected polygon coordinates
 */
const DocumentReviewScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProps['navigation']>();
  const route = useRoute();
  const params = route.params as RouteParams;

  // State management
  const [originalImage, setOriginalImage] = useState<string>(params?.originalImageUri || '');
  const [croppedImage, setCroppedImage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cropResult, setCropResult] = useState<PolygonCropResult | null>(null);
  const [selectedCropMethod, setSelectedCropMethod] = useState<'auto' | 'manual' | 'fallback'>('auto');

  const currentStep = params?.step || 'front';
  const isBackSide = currentStep === 'back';

  // Example polygon coordinates (these would normally come from document detection)
  const mockPolygonCorners: Point[] = [
    { x: 500, y: 800 },   // Top-left
    { x: 3500, y: 850 },  // Top-right
    { x: 3450, y: 2200 }, // Bottom-right
    { x: 450, y: 2150 }   // Bottom-left
  ];

  // Use detected corners from params or fall back to mock data
  const detectedCorners = params?.detectedCorners || mockPolygonCorners;

  useEffect(() => {
    if (originalImage && detectedCorners) {
      // Automatically crop the document when the screen loads
      handleAutoCrop();
    }
  }, [originalImage]);

  /**
   * Handle automatic cropping using detected polygon corners
   */
  const handleAutoCrop = async () => {
    if (!originalImage || !detectedCorners || detectedCorners.length !== 4) {
      Alert.alert('Error', 'Invalid image or polygon coordinates for cropping');
      return;
    }

    setIsProcessing(true);
    try {
      console.log('[DocumentReview] Starting auto crop with corners:', detectedCorners);
      
      const options: PolygonCropOptions = {
        padding: 20,
        quality: 0.9,
        format: 'JPEG'
      };

      const result = await cropDetectedDocument(originalImage, detectedCorners, options);
      
      setCropResult(result);
      if (result.success) {
        setCroppedImage(result.croppedUri);
        console.log('[DocumentReview] Auto crop successful:', result.croppedUri);
      } else {
        console.error('[DocumentReview] Auto crop failed:', result.error);
        Alert.alert('Cropping Failed', result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('[DocumentReview] Auto crop error:', error);
      Alert.alert('Error', 'Failed to crop document. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle manual cropping with custom polygon
   */
  const handleManualCrop = async () => {
    if (!originalImage) {
      Alert.alert('Error', 'No image available for cropping');
      return;
    }

    // Example: Create a custom polygon (in real app, this might come from user interaction)
    const customPolygon: Point[] = [
      { x: 400, y: 600 },
      { x: 3600, y: 650 },
      { x: 3550, y: 2400 },
      { x: 350, y: 2350 }
    ];

    setIsProcessing(true);
    try {
      console.log('[DocumentReview] Starting manual crop with custom polygon:', customPolygon);
      
      const options: PolygonCropOptions = {
        outputWidth: 1000,
        outputHeight: 700,
        padding: 15,
        quality: 0.85
      };

      const result = await cropDocument(originalImage, customPolygon, options);
      
      setCropResult(result);
      if (result.success) {
        setCroppedImage(result.croppedUri);
        console.log('[DocumentReview] Manual crop successful:', result.croppedUri);
      } else {
        console.error('[DocumentReview] Manual crop failed:', result.error);
        Alert.alert('Cropping Failed', result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('[DocumentReview] Manual crop error:', error);
      Alert.alert('Error', 'Failed to crop document manually. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle fallback cropping when polygon detection fails
   */
  const handleFallbackCrop = async () => {
    if (!originalImage) {
      Alert.alert('Error', 'No image available for cropping');
      return;
    }

    setIsProcessing(true);
    try {
      console.log('[DocumentReview] Starting fallback crop');
      
      const imageSize = { width: 4032, height: 3024 }; // Default camera resolution
      const options: PolygonCropOptions = {
        padding: 50,
        quality: 0.8
      };

      const result = await createFallbackCrop(originalImage, imageSize, options);
      
      setCropResult(result);
      if (result.success) {
        setCroppedImage(result.croppedUri);
        console.log('[DocumentReview] Fallback crop successful:', result.croppedUri);
      } else {
        console.error('[DocumentReview] Fallback crop failed:', result.error);
        Alert.alert('Cropping Failed', result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('[DocumentReview] Fallback crop error:', error);
      Alert.alert('Error', 'Failed to create fallback crop. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle retaking the photo
   */
  const handleRetake = () => {
    navigation.goBack();
  };

  /**
   * Handle accepting the cropped document
   */
  const handleAccept = () => {
    if (!croppedImage || !cropResult?.success) {
      Alert.alert('Error', 'No valid cropped image to accept');
      return;
    }

    console.log('[DocumentReview] Accepting cropped document:', croppedImage);
    
    // Navigate to the next step or completion screen
    if (isBackSide) {
      // Both sides completed
      navigation.navigate('DocumentComplete', {
        frontImage: croppedImage, // In real app, you'd store the front image separately
        backImage: croppedImage,
        cropMetadata: cropResult.metadata
      });
    } else {
      // Move to back side
      navigation.navigate('DocumentVerification', {
        step: 'back'
      });
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: theme.spacing.lg,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    title: {
      fontSize: theme.typography.fontSize['2xl'],
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    content: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    imageContainer: {
      flex: 1,
      marginBottom: theme.spacing.lg,
    },
    imageSection: {
      flex: 1,
      marginBottom: theme.spacing.md,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.sm,
    },
    image: {
      width: '100%',
      height: 200,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.cardBackground,
      resizeMode: 'contain',
    },
    cropMethodSelector: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: theme.spacing.lg,
      padding: theme.spacing.sm,
      backgroundColor: theme.colors.cardBackground,
      borderRadius: theme.borderRadius.md,
    },
    cropMethodButton: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colors.backgroundSecondary,
    },
    cropMethodButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    cropMethodText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    cropMethodTextActive: {
      color: 'white',
      fontWeight: theme.typography.fontWeight.semibold,
    },
    metadataContainer: {
      backgroundColor: theme.colors.cardBackground,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.lg,
    },
    metadataTitle: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.sm,
    },
    metadataText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      fontFamily: 'monospace',
      lineHeight: 18,
    },
    buttonContainer: {
      gap: theme.spacing.md,
    },
    processingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.lg,
    },
    processingText: {
      marginTop: theme.spacing.md,
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textSecondary,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: theme.typography.fontSize.sm,
      textAlign: 'center',
      marginTop: theme.spacing.sm,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Review {isBackSide ? 'Back' : 'Front'} of ID
        </Text>
        <Text style={styles.subtitle}>
          Confirm the document is cropped correctly
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Crop Method Selector */}
        <View style={styles.cropMethodSelector}>
          <TouchableOpacity
            style={[
              styles.cropMethodButton,
              selectedCropMethod === 'auto' && styles.cropMethodButtonActive
            ]}
            onPress={() => setSelectedCropMethod('auto')}
          >
            <Text style={[
              styles.cropMethodText,
              selectedCropMethod === 'auto' && styles.cropMethodTextActive
            ]}>
              Auto Crop
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.cropMethodButton,
              selectedCropMethod === 'manual' && styles.cropMethodButtonActive
            ]}
            onPress={() => setSelectedCropMethod('manual')}
          >
            <Text style={[
              styles.cropMethodText,
              selectedCropMethod === 'manual' && styles.cropMethodTextActive
            ]}>
              Manual Crop
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.cropMethodButton,
              selectedCropMethod === 'fallback' && styles.cropMethodButtonActive
            ]}
            onPress={() => setSelectedCropMethod('fallback')}
          >
            <Text style={[
              styles.cropMethodText,
              selectedCropMethod === 'fallback' && styles.cropMethodTextActive
            ]}>
              Fallback
            </Text>
          </TouchableOpacity>
        </View>

        {/* Image Display */}
        <View style={styles.imageContainer}>
          {/* Original Image */}
          <View style={styles.imageSection}>
            <Text style={styles.sectionTitle}>Original Image</Text>
            {originalImage ? (
              <Image source={{ uri: originalImage }} style={styles.image} />
            ) : (
              <View style={[styles.image, { alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={styles.errorText}>No original image available</Text>
              </View>
            )}
          </View>

          {/* Cropped Image */}
          <View style={styles.imageSection}>
            <Text style={styles.sectionTitle}>Cropped Document</Text>
            {isProcessing ? (
              <View style={[styles.image, styles.processingContainer]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.processingText}>Processing image...</Text>
              </View>
            ) : croppedImage ? (
              <Image source={{ uri: croppedImage }} style={styles.image} />
            ) : (
              <View style={[styles.image, { alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={styles.errorText}>No cropped image yet</Text>
              </View>
            )}
          </View>
        </View>

        {/* Crop Metadata */}
        {cropResult && (
          <View style={styles.metadataContainer}>
            <Text style={styles.metadataTitle}>Crop Information</Text>
            <Text style={styles.metadataText}>
              Status: {cropResult.success ? '✅ Success' : '❌ Failed'}{'\n'}
              {cropResult.metadata && (
                <>
                  Original Size: {cropResult.metadata.originalSize.width}×{cropResult.metadata.originalSize.height}{'\n'}
                  Cropped Size: {cropResult.metadata.croppedSize.width}×{cropResult.metadata.croppedSize.height}{'\n'}
                  Perspective Applied: {cropResult.metadata.perspectiveApplied ? 'Yes' : 'No'}{'\n'}
                </>
              )}
              {cropResult.error && `Error: ${cropResult.error}`}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {/* Crop Method Buttons */}
          <Button
            title="Auto Crop (Detected Polygon)"
            onPress={handleAutoCrop}
            loading={isProcessing}
            disabled={!originalImage || detectedCorners.length !== 4}
            variant={selectedCropMethod === 'auto' ? 'primary' : 'outline'}
          />
          
          <Button
            title="Manual Crop (Custom Polygon)"
            onPress={handleManualCrop}
            loading={isProcessing}
            disabled={!originalImage}
            variant={selectedCropMethod === 'manual' ? 'primary' : 'outline'}
          />
          
          <Button
            title="Fallback Crop (Center Rectangle)"
            onPress={handleFallbackCrop}
            loading={isProcessing}
            disabled={false}
            variant={selectedCropMethod === 'fallback' ? 'primary' : 'outline'}
          />

          {/* Navigation Buttons */}
          <View style={{ marginTop: theme.spacing.lg }}>
            <Button
              title="Accept & Continue"
              onPress={handleAccept}
              disabled={!croppedImage || !cropResult?.success}
              fullWidth
            />
            
            <Button
              title="Retake Photo"
              onPress={handleRetake}
              variant="ghost"
              fullWidth
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DocumentReviewScreen;