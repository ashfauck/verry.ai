import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  SafeAreaView,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import {useRecoilState} from 'recoil';
import {useNavigation} from '@react-navigation/native';
import {
  Camera,
  useCameraDevices,
  useCameraPermission,
  PhotoFile,
  TakePhotoOptions,
} from 'react-native-vision-camera';
import {useTheme} from '../components/ThemeProvider';
import {Button} from '../components';
import {verificationState} from '../store/atoms';
import {STRINGS} from '../constants/strings';
import type {NavigationProps} from '../types';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

const FaceVerificationScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<NavigationProps['navigation']>();
  const [verification, setVerification] = useRecoilState(verificationState);
  
  const [isDetecting, setIsDetecting] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [instruction, setInstruction] = useState<string>(STRINGS.face.positionFace);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [capturedFace, setCapturedFace] = useState<string | null>(null);
  
  const pulseAnim = new Animated.Value(1);
  const progressAnim = new Animated.Value(0);

  // Camera setup
  const cameraRef = useRef<Camera>(null);
  const devices = useCameraDevices();
  const frontDevice = devices.find(d => d.position === 'front');
  const {hasPermission, requestPermission} = useCameraPermission();

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }

    // Start pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [hasPermission, requestPermission]);

  const startFaceDetection = async () => {
    setIsDetecting(true);
    setInstruction(STRINGS.face.lookStraight);
    
    // Simulate face detection process
    setTimeout(() => {
      setFaceDetected(true);
      setInstruction(STRINGS.face.faceDetected);
      startCapture();
    }, 2000);
  };

  const startCapture = () => {
    setInstruction(STRINGS.face.faceCapturing);
    
    // Animate capture progress
    Animated.timing(progressAnim, {
      toValue: 100,
      duration: 3000,
      useNativeDriver: false,
    }).start(({finished}) => {
      if (finished) {
        completeFaceVerification();
      }
    });

    // Update progress state
    const interval = setInterval(() => {
      setCaptureProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 60);
  };

  const captureFacePhoto = async () => {
    if (!cameraRef.current || !isCameraReady) {
      Alert.alert(STRINGS.common.error, 'Camera not ready');
      return;
    }

    try {
      const options: TakePhotoOptions = {
        flash: 'off', // No flash for face photos
      };

      const photo: PhotoFile = await cameraRef.current.takePhoto(options);
      const imageUri = Platform.OS === 'ios' ? photo.path : `file://${photo.path}`;
      
      setCapturedFace(imageUri);
      return imageUri;
    } catch (error) {
      console.error('Face capture error:', error);
      throw error;
    }
  };

  const completeFaceVerification = async () => {
    setIsProcessing(true);
    setInstruction(STRINGS.face.processingFace);
    
    try {
      // Capture the face photo
      const faceImageUri = await captureFacePhoto();
      
      // Simulate face verification processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setVerification(prev => ({
        ...prev,
        faceImage: faceImageUri || null,
        faceVerified: true,
        currentStep: 'complete',
      }));

      Alert.alert(
        STRINGS.common.success,
        STRINGS.success.verificationComplete,
        [{
          text: STRINGS.common.continue,
          onPress: () => navigation.navigate('Home')
        }]
      );
    } catch (error) {
      Alert.alert(STRINGS.common.error, STRINGS.errors.serverError);
      resetFaceDetection();
    } finally {
      setIsProcessing(false);
    }
  };

  const resetFaceDetection = () => {
    setIsDetecting(false);
    setFaceDetected(false);
    setCaptureProgress(0);
    setInstruction(STRINGS.face.positionFace);
    progressAnim.setValue(0);
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
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    cameraContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    faceFrame: {
      width: screenWidth * 0.7,
      height: screenWidth * 0.7,
      borderRadius: (screenWidth * 0.7) / 2,
      borderWidth: 4,
      borderColor: faceDetected ? theme.colors.success : theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.backgroundSecondary,
      overflow: 'hidden',
    },
    faceIcon: {
      fontSize: 120,
      opacity: 0.5,
    },
    progressOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    progressCircle: {
      width: screenWidth * 0.7,
      height: screenWidth * 0.7,
      borderRadius: (screenWidth * 0.7) / 2,
      borderWidth: 6,
      borderColor: 'transparent',
      borderTopColor: theme.colors.success,
      transform: [{ rotate: '0deg' }],
    },
    instructionContainer: {
      marginTop: theme.spacing.xl,
      alignItems: 'center',
    },
    instruction: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    progressText: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.textSecondary,
    },
    buttonContainer: {
      padding: theme.spacing.lg,
    },
    statusIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: theme.spacing.md,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginHorizontal: 4,
    },
    activeDot: {
      backgroundColor: theme.colors.success,
    },
    inactiveDot: {
      backgroundColor: theme.colors.border,
    },
    faceOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    faceFrameInner: {
      width: '90%',
      height: '90%',
      borderRadius: (screenWidth * 0.7 * 0.9) / 2,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.5)',
      borderStyle: 'dashed',
    },
    permissionText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.md,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{STRINGS.face.facialVerification}</Text>
        <Text style={styles.subtitle}>{STRINGS.face.faceInstruction}</Text>
      </View>

      <View style={styles.cameraContainer}>
        {hasPermission && frontDevice ? (
          <Animated.View 
            style={[
              styles.faceFrame,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            {capturedFace ? (
              <Text style={styles.faceIcon}>✅</Text>
            ) : (
              <>
                <Camera
                  ref={cameraRef}
                  style={StyleSheet.absoluteFill}
                  device={frontDevice}
                  isActive={true}
                  photo={true}
                  onInitialized={() => setIsCameraReady(true)}
                  onError={(error) => {
                    console.error('Camera error:', error);
                    Alert.alert('Camera Error', 'Failed to initialize camera');
                  }}
                />
                
                {/* Face frame overlay */}
                <View style={styles.faceOverlay}>
                  <View style={styles.faceFrameInner} />
                </View>
              </>
            )}
            
            {captureProgress > 0 && (
              <View style={styles.progressOverlay}>
                <View style={styles.progressCircle} />
              </View>
            )}
          </Animated.View>
        ) : (
          <Animated.View 
            style={[
              styles.faceFrame,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <Text style={styles.faceIcon}>👤</Text>
            {!hasPermission && (
              <Text style={styles.permissionText}>Camera permission required</Text>
            )}
          </Animated.View>
        )}

        <View style={styles.instructionContainer}>
          <Text style={styles.instruction}>{instruction}</Text>
          
          {captureProgress > 0 && (
            <Text style={styles.progressText}>
              {Math.round(captureProgress)}%
            </Text>
          )}
          
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, isDetecting ? styles.activeDot : styles.inactiveDot]} />
            <View style={[styles.statusDot, faceDetected ? styles.activeDot : styles.inactiveDot]} />
            <View style={[styles.statusDot, captureProgress >= 100 ? styles.activeDot : styles.inactiveDot]} />
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        {!hasPermission ? (
          <Button
            title="Allow Camera Access"
            onPress={requestPermission}
            fullWidth
          />
        ) : !isDetecting ? (
          <Button
            title="Start Face Verification"
            onPress={startFaceDetection}
            disabled={!isCameraReady}
            fullWidth
          />
        ) : captureProgress >= 100 ? (
          <Button
            title={STRINGS.common.continue}
            onPress={() => navigation.navigate('Home')}
            loading={isProcessing}
            fullWidth
          />
        ) : (
          <Button
            title="Cancel"
            onPress={resetFaceDetection}
            variant="outline"
            fullWidth
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default FaceVerificationScreen;