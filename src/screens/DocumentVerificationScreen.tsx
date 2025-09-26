import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import {useRecoilState} from 'recoil';
import {useNavigation, useRoute} from '@react-navigation/native';
import {
  Camera,
  useCameraDevices,
  useCameraPermission,
  PhotoFile,
  TakePhotoOptions,
  Frame,
} from 'react-native-vision-camera';

// Conditionally import useFrameProcessor with fallback  
let useFrameProcessor: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const visionCamera = require('react-native-vision-camera');
  useFrameProcessor = visionCamera.useFrameProcessor;
  if (!useFrameProcessor) {
    console.warn('useFrameProcessor not found in VisionCamera - falling back to null');
  }
} catch (e) {
  console.warn('VisionCamera useFrameProcessor not available:', e);
  useFrameProcessor = null;
}
import {useTheme} from '../components/ThemeProvider';
import {Button, CropTestOverlay} from '../components';
import {verificationState} from '../store/atoms';
import {STRINGS} from '../constants/strings';
import type {NavigationProps} from '../types';
import {DocumentDetectionResult, DocumentStabilityChecker, detectDocument, resetDetectionState} from '../utils/documentDetection';
import {detectDocumentInFrame, FrameDocumentStabilityChecker, analyzeFrameDimensions} from '../utils/frameDocumentDetection';
import { useDocumentAutoCapture, StableDoc } from '../hooks/useDocumentAutoCapture';
import ImageEditor from '@react-native-community/image-editor';
import {DocumentCropper, CropBounds, PhotoSize, CropResult} from '../utils/documentCropper';
import {CoordinateValidator} from '../utils/coordinateValidator';
import {FrameCropper, FrameBounds} from '../utils/frameCropper';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

interface RouteParams {
  step: 'front' | 'back';
}

const DocumentVerificationScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<NavigationProps['navigation']>();
  const route = useRoute();
  const params = route.params as RouteParams;
  
  const [verification, setVerification] = useRecoilState(verificationState);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isDocumentDetected, setIsDocumentDetected] = useState(false);
  const [detectionTimer, setDetectionTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Document detection state - moved up to maintain consistent hook order
  const [documentBounds, setDocumentBounds] = useState<{x: number; y: number; width: number; height: number} | null>(null);
  const [debugMeta, setDebugMeta] = useState<string>('');
  const [showDebugMeta, setShowDebugMeta] = useState(false);
  const [capturedCorners, setCapturedCorners] = useState<{x:number;y:number}[] | null>(null);
  const [frameLayout, setFrameLayout] = useState<{x: number; y: number; width: number; height: number} | null>(null);
  const [overlayLayout, setOverlayLayout] = useState<{width: number; height: number} | null>(null);
  const [testPhotoSize, setTestPhotoSize] = useState<{width: number; height: number} | null>(null);

  // All refs - maintain consistent order
  const frameRef = useRef<View>(null);
  const stableTicksRef = useRef<number>(0);
  const stabilityChecker = useRef(new DocumentStabilityChecker());
  const frameStabilityChecker = useRef(new FrameDocumentStabilityChecker());
  const boundingBoxOpacity = useRef(new Animated.Value(0)).current;
  const cameraRef = useRef<Camera>(null);

  const currentStep = params?.step || 'front';
  const isBackSide = currentStep === 'back';

  // Camera setup
  const devices = useCameraDevices();
  const device = devices?.find(d => d.position === 'back') || null; // Add null fallback
  const {hasPermission, requestPermission} = useCameraPermission();

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  // Clear detection state when switching between front/back
  useEffect(() => {
    // Reset all capture-related state when the step changes
    setIsDocumentDetected(false);
    setDocumentBounds(null);
    stabilityChecker.current.reset();
    resetDetectionState(); // Reset the detection state in the utility
    boundingBoxOpacity.setValue(0);
    
    if (detectionTimer) {
      clearTimeout(detectionTimer);
      setDetectionTimer(null);
    }
  }, [currentStep]); // Trigger when step changes

  // Handle detection results on JS thread
  const handleDetectionResult = useCallback((detection: DocumentDetectionResult, frameSize: {width: number; height: number}) => {
    if (detection.found && detection.bounds) {
      // Scale bounds from frame coordinates to screen coordinates
      const scaleX = screenWidth / frameSize.width;
      const scaleY = screenHeight / frameSize.height;
      
      const scaledBounds = {
        x: detection.bounds.x * scaleX,
        y: detection.bounds.y * scaleY,
        width: detection.bounds.width * scaleX,
        height: detection.bounds.height * scaleY,
      };
      
      setDocumentBounds(scaledBounds);
      
      // Animate bounding box in
      Animated.timing(boundingBoxOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      
      // Check if document is stable for auto-capture
      const isStable = stabilityChecker.current.addDetection(detection);
      
      if (isStable && !isCapturing) {
        setIsDocumentDetected(true);
        // DISABLED: Auto-capture after 2.5 seconds of stable detection (longer delay)
        // setTimeout(() => {
        //   if (!isCapturing) {
        //     captureDocument();
        //   }
        // }, 2500);
      }
    } else {
      // No document found
      setDocumentBounds(null);
      setIsDocumentDetected(false);
      stabilityChecker.current.reset();
      
      // Animate bounding box out
      Animated.timing(boundingBoxOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isCapturing, boundingBoxOpacity]);

  // --- Frame processor based auto-detection ---
  const lastFailureRef = useRef<'confidence' | 'sharpness' | 'area' | 'glare' | 'drift' | undefined>();
  
  const handleStableAuto = useCallback((stableDoc: StableDoc) => {
    if (isCapturing) return;
    // Map frame-space boundingRect to screen space for visual feedback & cropping heuristics
    const scaleX = screenWidth / stableDoc.frameSize.width;
    const scaleY = screenHeight / stableDoc.frameSize.height;
    const mapped = {
      x: stableDoc.boundingRect.x * scaleX,
      y: stableDoc.boundingRect.y * scaleY,
      width: stableDoc.boundingRect.width * scaleX,
      height: stableDoc.boundingRect.height * scaleY,
    };
    setDocumentBounds(mapped);
    setCapturedCorners(stableDoc.corners); // keep raw frame-space corners – used later for perspective.
    // Derive quality status to power guidance overlay & debug
    const reasons: string[] = [];
    if (stableDoc.areaRatio != null && stableDoc.areaRatio < 0.18) reasons.push('area');
    if (stableDoc.sharpness != null && stableDoc.sharpness < 40) reasons.push('sharpness');
    if (stableDoc.glareRatio != null && stableDoc.glareRatio > 0.2) reasons.push('glare');
    if (stableDoc.confidence < 0.78) reasons.push('confidence');
    if (reasons.length) {
      lastFailureRef.current = reasons[0] as any;
    }
    // DISABLED: Auto-capture
    // if (autoCaptureEnabled && autoCaptureActive) {
    //   setIsDocumentDetected(true);
    //   // DISABLED: Trigger capture shortly after stability detection
    //   // setTimeout(() => {
    //   //   if (!isCapturing) captureDocument(true);
    //   // }, 600);
    // }
  }, [isCapturing]);

  // Fallback hook (disabled) - ensure it doesn't cause hook order issues
  const fallbackDetection = useDocumentAutoCapture({
    enabled: false,
    onStable: handleStableAuto,
  });
  const { frameProcessor: fallbackFrameProcessor } = fallbackDetection;
  
  // Mock detection disabled - now using static blue frame only
  // useEffect(() => {
  //   // Mock detection logic removed for simplicity
  // }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (detectionTimer) {
        clearTimeout(detectionTimer);
      }
    };
  }, [detectionTimer]);
  
  // Helper to ensure file:// prefix for iOS
  const normalizeUri = (uri: string) => {
    if (!uri) return uri;
    if (uri.startsWith('http')) return uri;
    if (Platform.OS === 'ios' && !uri.startsWith('file://')) return `file://${uri}`;
    return uri;
  };

  // Note: old cropImage function removed - now using DocumentCropper utility

  // Enhanced camera capture with DocumentCropper and navigation to confirmation screen
  const captureDocument = async (auto = false) => {
    try {
      setIsCapturing(true);
      // Clear previous detection timer
      if (detectionTimer) {
        clearTimeout(detectionTimer);
        setDetectionTimer(null);
      }

      if (cameraRef.current && isCameraReady && device) {
        // Always use the static blue frame coordinates for cropping
        const cropBounds = frameLayout;
        if (!cropBounds) {
          console.warn('[Capture] Frame layout not available, cannot capture');
          Alert.alert(STRINGS.common.error, 'Camera frame not ready. Please wait a moment and try again.');
          return;
        }

        const options: TakePhotoOptions = { flash: 'auto' };
        const photo: PhotoFile = await cameraRef.current.takePhoto(options);
        // VisionCamera provides width/height on PhotoFile
        const photoSize: PhotoSize = { 
          width: (photo as any).width || 1920, 
          height: (photo as any).height || 1080 
        };
        const rawPath = Platform.OS === 'ios' ? photo.path : `file://${photo.path}`;
        const imageUri = normalizeUri(rawPath);

        console.log('[Capture] Photo captured:', imageUri);
        console.log('[Capture] Photo size:', photoSize);
        console.log('[Capture] Frame layout (blue dotted frame):', cropBounds);
        console.log('[Capture] Screen dimensions:', { screenWidth, screenHeight });
        console.log('[Capture] Camera container dimensions:', overlayLayout);
        
        // Store original detection bounds for validation (if available)
        const originalDetectionBounds = capturedCorners ? {
          // Reconstruct from corners if available
          x: Math.min(...capturedCorners.map(c => c.x)),
          y: Math.min(...capturedCorners.map(c => c.y)),
          width: Math.max(...capturedCorners.map(c => c.x)) - Math.min(...capturedCorners.map(c => c.x)),
          height: Math.max(...capturedCorners.map(c => c.y)) - Math.min(...capturedCorners.map(c => c.y)),
        } : null;

        // Use the enhanced FrameCropper for blue dotted frame
        // This now properly handles camera preview scaling/cropping to ensure
        // the cropped area matches the blue dotted frame on screen
        const cropResult = await FrameCropper.cropToFrame(
          imageUri,
          cropBounds as FrameBounds,
          photoSize,
          {
            addPadding: true,
            paddingPercent: 0.02, // Small padding for frame-based crop
            containerSize: overlayLayout, // Pass the camera container dimensions
          }
        );

        if (!cropResult.success) {
          console.warn('[Capture] Cropping failed, attempting fallback crop');
          // Try fallback center crop
          const fallbackResult = await DocumentCropper.createFallbackCrop(imageUri, photoSize);
          
          if (fallbackResult.success) {
            // Navigate to confirmation screen with fallback crop
            navigation.navigate('DocumentConfirmation', {
              step: currentStep,
              originalImageUri: imageUri,
              croppedImageUri: fallbackResult.croppedUri,
              bounds: cropBounds,
            });
          } else {
            Alert.alert(STRINGS.common.error, 'Failed to process document image. Please try again.');
          }
          return;
        }

        console.log('[Capture] Cropping successful:', cropResult.croppedUri);
        
        // Validate coordinate conversion if we have original detection bounds
        if (originalDetectionBounds) {
          // Convert screen bounds back to what should be the image crop bounds
          const expectedImageBounds = {
            x: Math.round(cropBounds.x * photoSize.width / screenWidth),
            y: Math.round(cropBounds.y * photoSize.height / screenHeight),
            width: Math.round(cropBounds.width * photoSize.width / screenWidth),
            height: Math.round(cropBounds.height * photoSize.height / screenHeight),
          };
          
          console.log('[Capture] Expected image crop bounds:', expectedImageBounds);
          
          // This would be the full coordinate validation if we had the frame size
          // CoordinateValidator.debugCoordinateFlow(
          //   originalDetectionBounds,
          //   { width: 1920, height: 1080 }, // frame size
          //   cropBounds,
          //   photoSize,
          //   expectedImageBounds
          // );
        }

        // Navigate to confirmation screen
        navigation.navigate('DocumentConfirmation', {
          step: currentStep,
          originalImageUri: imageUri,
          croppedImageUri: cropResult.croppedUri,
          bounds: cropBounds,
        });

      } else {
        // Fallback simulation mode - use frame layout
        const cropBounds = frameLayout;
        if (!cropBounds) {
          console.warn('[SimCapture] Frame layout not available, cannot simulate capture');
          Alert.alert(STRINGS.common.error, 'Camera frame not ready. Please wait a moment and try again.');
          return;
        }

        console.log('[Capture] Using simulation mode');
        await new Promise(r => setTimeout(r, 800));
        
        const mockImageUri = isBackSide 
          ? 'https://via.placeholder.com/320x200/2563EB/FFFFFF?text=ID+BACK+SIDE'
          : 'https://via.placeholder.com/320x200/059669/FFFFFF?text=ID+FRONT+SIDE';
        const croppedMockUri = isBackSide 
          ? 'https://via.placeholder.com/280x180/1D4ED8/FFFFFF?text=Back+Cropped'
          : 'https://via.placeholder.com/280x180/047857/FFFFFF?text=Front+Cropped';

        // Navigate to confirmation screen with mock data
        navigation.navigate('DocumentConfirmation', {
          step: currentStep,
          originalImageUri: mockImageUri,
          croppedImageUri: croppedMockUri,
          bounds: cropBounds,
        });
      }
    } catch (error) {
      console.error('Camera capture error:', error);
      Alert.alert(STRINGS.common.error, `Camera error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCapturing(false);
      // Reset detection state after capture
      setIsDocumentDetected(false);
      setDocumentBounds(null);
      boundingBoxOpacity.setValue(0);
    }
  };

  // Note: retakePhoto function removed - handled by confirmation screen

  // Note: processDocument function removed - we now navigate directly to confirmation screen



  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      position: 'absolute',
      top: 50, // Account for status bar
      left: 0,
      right: 0,
      padding: theme.spacing.lg,
      alignItems: 'center',
      zIndex: 10,
    },
    title: {
      fontSize: theme.typography.fontSize['2xl'],
      fontWeight: theme.typography.fontWeight.bold,
      color: 'white',
      marginBottom: theme.spacing.sm,
      textShadowColor: 'rgba(0, 0, 0, 0.8)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    subtitle: {
      fontSize: theme.typography.fontSize.base,
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
      textShadowColor: 'rgba(0, 0, 0, 0.8)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    cameraContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'black',
    },
    cameraPlaceholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.backgroundSecondary,
      minHeight: screenHeight * 0.4,
    },
    documentFrame: {
      width: screenWidth * 0.7,
      height: screenWidth * 0.44, // Approximate ID card ratio
      borderWidth: 2,
      borderColor: theme.colors.primary,
      borderStyle: 'dashed',
      borderRadius: theme.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    frameText: {
      fontSize: theme.typography.fontSize.lg,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.md,
    },
    capturedImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    capturingText: {
      color: 'white',
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.medium,
      marginTop: theme.spacing.md,
    },
    buttonContainer: {
      position: 'absolute',
      bottom: 50,
      left: 0,
      right: 0,
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
      zIndex: 10,
    },
    progressIndicator: {
      position: 'absolute',
      top: 180, // Below header
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    stepIndicator: {
      width: 30,
      height: 4,
      backgroundColor: theme.colors.border,
      marginHorizontal: 2,
    },
    activeStep: {
      backgroundColor: theme.colors.primary,
    },
    cameraOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.1)',
    },
    documentFrameDetected: {
      borderColor: '#10B981', // Green color when document is detected
      borderWidth: 3,
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    frameTextDetected: {
      color: '#10B981',
      fontWeight: theme.typography.fontWeight.bold,
    },
    cropIndicator: {
      position: 'absolute',
      bottom: theme.spacing.md,
      left: theme.spacing.md,
      right: theme.spacing.md,
      backgroundColor: 'rgba(16, 185, 129, 0.9)',
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
    },
    cropIndicatorText: {
      color: 'white',
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
    },
    debugContainer: {
      alignItems: 'center',
      marginTop: theme.spacing.sm,
    },
    // Dynamic bounding box that appears when document is detected
    dynamicBoundingBox: {
      position: 'absolute',
      borderWidth: 3,
      borderColor: '#10B981', // Green color
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
      borderRadius: 8,
    },
    boundingBoxCorner: {
      position: 'absolute',
      width: 20,
      height: 20,
      borderColor: '#10B981',
      borderWidth: 4,
    },
    cornerTopLeft: {
      top: -2,
      left: -2,
      borderRightWidth: 0,
      borderBottomWidth: 0,
    },
    cornerTopRight: {
      top: -2,
      right: -2,
      borderLeftWidth: 0,
      borderBottomWidth: 0,
    },
    cornerBottomLeft: {
      bottom: -2,
      left: -2,
      borderRightWidth: 0,
      borderTopWidth: 0,
    },
    cornerBottomRight: {
      bottom: -2,
      right: -2,
      borderLeftWidth: 0,
      borderTopWidth: 0,
    },
    confidenceIndicator: {
      position: 'absolute',
      top: -30,
      left: 0,
      backgroundColor: 'rgba(16, 185, 129, 0.9)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    confidenceText: {
      color: 'white',
      fontSize: 12,
      fontWeight: 'bold',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Full-screen camera background */}
      <View style={styles.cameraContainer}>
        {hasPermission && device ? (
          <>
            <Camera
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              device={device}
              isActive={true}
              photo={true}
              onInitialized={() => {
                console.log('Camera initialized successfully');
                setIsCameraReady(true);
              }}
              onError={(error) => {
                console.error('Camera error:', error);
                Alert.alert('Camera Error', `Failed to initialize camera: ${error.message}`);
              }}
            />
            
            {/* Document frame overlay */}
            <View style={styles.cameraOverlay} onLayout={(e) => setOverlayLayout({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}>
              <View
                ref={frameRef}
                onLayout={e => setFrameLayout(e.nativeEvent.layout)}
                style={styles.documentFrame}
              >
                <Text style={[
                  styles.frameText,
                  isDocumentDetected && styles.frameTextDetected,
                ]}>
                  {isDocumentDetected
                    ? `✓ Document detected! Tap capture to proceed.`
                    : `Position your ${isBackSide ? 'ID back' : 'ID front'} here`}
                </Text>
              </View>
            </View>

            {/* Dynamic bounding box that appears when document is detected */}
            {documentBounds && (
              <Animated.View
                style={[
                  styles.dynamicBoundingBox,
                  {
                    left: documentBounds.x,
                    top: documentBounds.y,
                    width: documentBounds.width,
                    height: documentBounds.height,
                    opacity: boundingBoxOpacity,
                  },
                ]}
              >
                {/* Corner indicators */}
                <View style={[styles.boundingBoxCorner, styles.cornerTopLeft]} />
                <View style={[styles.boundingBoxCorner, styles.cornerTopRight]} />
                <View style={[styles.boundingBoxCorner, styles.cornerBottomLeft]} />
                <View style={[styles.boundingBoxCorner, styles.cornerBottomRight]} />
                
                {/* Confidence indicator */}
                <View style={styles.confidenceIndicator}>
                  <Text style={styles.confidenceText}>
                    Document Detected
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* Debug overlay for showing bounds info */}
            {showDebugMeta && documentBounds && (
              <View style={{ position: 'absolute', top: 250, left: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.7)', padding: 10, borderRadius: 8, zIndex: 15 }}>
                <Text style={{ color: 'white', fontSize: 12, fontFamily: 'monospace' }}>
                  Blue Box Bounds:{"\n"}
                  x: {Math.round(documentBounds.x)}, y: {Math.round(documentBounds.y)}{"\n"}
                  w: {Math.round(documentBounds.width)}, h: {Math.round(documentBounds.height)}{"\n"}
                  Screen: {screenWidth}x{screenHeight}
                </Text>
              </View>
            )}
            
            {/* Frame crop test overlay - shows static blue frame info */}
            <CropTestOverlay 
              documentBounds={frameLayout}
              photoSize={testPhotoSize || { width: 4032, height: 3024 }}
              showOverlay={showDebugMeta && frameLayout !== null}
            />

            {isCapturing && (
              <View style={styles.overlay}>
                <Text style={styles.capturingText}>📸 Capturing...</Text>
              </View>
            )}

          </>
        ) : (
          <View style={styles.cameraPlaceholder}>
            <View style={styles.documentFrame}>
              <Text style={styles.frameText}>
                {!hasPermission 
                  ? 'Camera permission required' 
                  : !device 
                  ? 'Camera not available - using simulation mode'
                  : 'Preparing camera...'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Overlay UI Elements */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {isBackSide ? STRINGS.document.backIdTitle : STRINGS.document.frontIdTitle}
        </Text>
        <Text style={styles.subtitle}>
          {isBackSide ? STRINGS.document.backIdInstruction : STRINGS.document.frontIdInstruction}
        </Text>
      </View>

      <View style={styles.progressIndicator}>
        <View style={[styles.stepIndicator, styles.activeStep]} />
        <View style={[styles.stepIndicator, isBackSide && styles.activeStep]} />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title={STRINGS.document.takePicture}
          onPress={() => captureDocument(false)}
          loading={isCapturing}
          disabled={isCapturing || !isCameraReady}
          fullWidth
        />
        
        {/* Debug buttons for frame cropping testing */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            <Button 
              title={showDebugMeta ? 'Hide Frame Info' : 'Show Frame Info'} 
              onPress={() => setShowDebugMeta(!showDebugMeta)} 
              variant="ghost" 
              size="small"
            />
          </View>
        )}
      </View>


    </SafeAreaView>
  );
};



export default DocumentVerificationScreen;