import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import {useRecoilState} from 'recoil';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useTheme} from '../components/ThemeProvider';
import {Button} from '../components';
import {verificationState} from '../store/atoms';
import {STRINGS} from '../constants/strings';
import type {NavigationProps} from '../types';
import {DocumentScannerService, DocumentScanResult} from '../services/documentScanner';
import DocumentScanner from 'react-native-document-scanner-plugin';
interface RouteParams {
  step?: 'front' | 'back';
  documentSide?: 'front' | 'back';
  returnScreen?: string;
}

const DocumentVerificationScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<NavigationProps['navigation']>();
  const route = useRoute();
  const params = route.params as RouteParams;

  const [verification, setVerification] = useRecoilState(verificationState);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedImage, setScannedImage] = useState<string | null>(null);

  const currentStep = params?.step || params?.documentSide || 'front';
  const isBackSide = currentStep === 'back';
  const returnScreen = params?.returnScreen;

  // Check if scanner is available on mount
  useEffect(() => {
    DocumentScannerService.isAvailable().then(available => {
      if (!available) {
        Alert.alert(
          'Scanner Unavailable',
          'Document scanner is not available on this device.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    });
  }, [navigation]);


  const scanDocument = async () => {
    try {
      // start the document scanner
      const { scannedImages } = await DocumentScanner.scanDocument()
    
      // get back an array with scanned image file paths
      if (scannedImages && scannedImages.length > 0) {
        // set the img src, so we can view the first scanned image
        setScannedImage(scannedImages[0])
        
        // Store the scanned image
        setVerification(prev => ({
          ...prev,
          [currentStep === 'front' ? 'documentFront' : 'documentBack']: scannedImages[0],
        }));
        
        // Navigate back to DocumentCapture if that's where we came from
        if (returnScreen === 'DocumentCapture') {
          navigation.goBack();
        } else {
          // Navigate to next step or face verification
          if (currentStep === 'front') {
            navigation.navigate('DocumentVerification', { step: 'back' });
          } else {
            setVerification(prev => ({ ...prev, documentVerified: true, currentStep: 'face' }));
            navigation.navigate('FaceVerification');
          }
        }
      }
    } catch (error) {
      console.log('Document scan error:', error);
      Alert.alert('Error', 'Failed to scan document. Please try again.');
    }
  }


  const handleScanDocument = async () => {
    try {
      setIsScanning(true);

      const result: DocumentScanResult = await DocumentScannerService.scanDocument({
        croppedImageQuality: 100,
        maxNumDocuments: 1
      });

      if (result.success && result.scannedImagePath) {
        console.log('[DocumentVerification] Document scanned successfully:', result.scannedImagePath);
        
        // Store the scanned image
        setScannedImage(result.scannedImagePath);
        
        // Update verification state
        setVerification(prev => ({
          ...prev,
          [currentStep === 'front' ? 'documentFront' : 'documentBack']: result.scannedImagePath,
        }));
        
        // Navigate back to DocumentCapture if that's where we came from
        if (returnScreen === 'DocumentCapture') {
          navigation.goBack();
        } else {
          // Navigate to next step or face verification
          if (currentStep === 'front') {
            navigation.navigate('DocumentVerification', { step: 'back' });
          } else {
            setVerification(prev => ({ ...prev, documentVerified: true, currentStep: 'face' }));
            navigation.navigate('FaceVerification');
          }
        }
        
      } else {
        console.log('[DocumentVerification] Document scan failed or cancelled:', result.error);
        
        // If scanner is not available, show error message
        if (result.error && result.error.includes('not available')) {
          console.log('[DocumentVerification] Document scanner not available');
          Alert.alert(
            'Document Scanner Not Available',
            'The document scanner is not available on this device. Please try again later.',
            [{ text: 'OK', style: 'default' }]
          );
          return;
        }
        
        if (result.error && !result.error.includes('cancel')) {
          Alert.alert('Scan Failed', result.error);
        }
      }

    } catch (error) {
      console.error('[DocumentVerification] Document scan error:', error);
      Alert.alert('Scan Failed', 'An unexpected error occurred while scanning the document.');
    } finally {
      setIsScanning(false);
    }
  };

  const getTitle = () => {
    return isBackSide 
      ? STRINGS.documentVerification.scanBackTitle 
      : STRINGS.documentVerification.scanFrontTitle;
  };

  const getSubtitle = () => {
    return isBackSide
      ? STRINGS.documentVerification.scanBackSubtitle
      : STRINGS.documentVerification.scanFrontSubtitle;
  };

  const getInstructions = () => {
    return [
      'Place the document on a flat surface',
      'Ensure good lighting',
      'Make sure all corners are visible',
      'Tap "Scan Document" to start'
    ];
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{getTitle()}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {getSubtitle()}
        </Text>

        {/* Scanner Preview Area */}
        <View style={[styles.scannerPreview, { borderColor: theme.colors.border }]}>
          {scannedImage ? (
            <Image 
              source={{ uri: scannedImage }} 
              style={styles.previewImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.placeholderContent}>
              <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
                Document will appear here after scanning
              </Text>
            </View>
          )}
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={[styles.instructionsTitle, { color: theme.colors.textPrimary }]}>
            Instructions:
          </Text>
          {getInstructions().map((instruction, index) => (
            <Text 
              key={index} 
              style={[styles.instructionItem, { color: theme.colors.textSecondary }]}
            >
              • {instruction}
            </Text>
          ))}
        </View>
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <Button
          title={scannedImage ? "Scan Again" : "Scan Document"}
          onPress={scanDocument}
          disabled={isScanning}
          loading={isScanning}
          style={styles.scanButton}
        />
        
        {scannedImage && (
          <Button
            title="Continue"
            onPress={() => {
              if (currentStep === 'front') {
                navigation.navigate('DocumentVerification', { step: 'back' });
              } else {
                setVerification(prev => ({ ...prev, documentVerified: true, currentStep: 'face' }));
                navigation.navigate('FaceVerification');
              }
            }}
            variant="secondary"
            style={styles.useButton}
          />
        )}
      </View>

      {/* Loading Overlay */}
      {isScanning && (
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingContent, { backgroundColor: theme.colors.surface }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textPrimary }]}>
              Opening Document Scanner...
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  scannerPreview: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    minHeight: 300,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  placeholderContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  placeholderText: {
    fontSize: 16,
    textAlign: 'center',
  },
  instructionsContainer: {
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  instructionItem: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  bottomActions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  scanButton: {
    marginBottom: 0,
  },
  useButton: {
    marginBottom: 0,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 200,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default DocumentVerificationScreen;