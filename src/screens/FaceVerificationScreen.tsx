import { TouchableOpacity } from 'react-native';
import React, {useState, useEffect, useRef} from 'react';
import { Image } from 'react-native';
import { View, Text, StyleSheet, Alert, SafeAreaView, Dimensions, Animated, Platform } from 'react-native';
import { apiService, AttachmentUploadResult, DocumentUploadRequest } from '../services/apiService';
import uuid from 'react-native-uuid';
import {useRecoilState, useRecoilValue} from 'recoil';
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
import {attemptIdState, verificationIdState, verificationState} from '../store/atoms';
import {STRINGS} from '../constants/strings';
import type {NavigationProps} from '../types';
import Snackbar from '@/components/Snackbar';
import { showSnackbar } from '@/components/snackbarService';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

const FaceVerificationScreen: React.FC = () => {
  // Add Recoil values for attemptId and verificationId if needed
  // import {attemptIdState, verificationIdState} from '../store/atoms';
  // const attemptId = useRecoilValue(attemptIdState);
  // const verificationId = useRecoilValue(verificationIdState);
  const {theme} = useTheme();
  const navigation = useNavigation<NavigationProps['navigation']>();
  const [verification, setVerification] = useRecoilState(verificationState);
  
  const [isDetecting, setIsDetecting] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [instruction, setInstruction] = useState<string>('Take the picture in bright light, and position your face in the frame.');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [capturedFace, setCapturedFace] = useState<string | null>(null);
  const verificationId = useRecoilValue(verificationIdState);
  const attemptId = useRecoilValue(attemptIdState);
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


  // Start face detection and animate, then capture photo automatically
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

  // Animate and capture photo automatically, but do NOT call API yet
  const startCapture = () => {
    setInstruction(STRINGS.face.faceCapturing);
    Animated.timing(progressAnim, {
      toValue: 100,
      duration: 3000,
      useNativeDriver: false,
    }).start();

    const interval = setInterval(async () => {
      setCaptureProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          // Capture photo automatically when animation completes
          captureFacePhoto();
          return 100;
        }
        return prev + 2;
      });
    }, 60);
  };


  // Capture photo and show preview, but do NOT call API yet
  const captureFacePhoto = async () => {
    if (!cameraRef.current || !isCameraReady) {
      Alert.alert(STRINGS.common.error, 'Camera not ready');
      return;
    }
    try {
      const options: TakePhotoOptions = {
        flash: 'off',
      };
      const photo: PhotoFile = await cameraRef.current.takePhoto(options);
      const imageUri = Platform.OS === 'ios' ? photo.path : `file://${photo.path}`;
      setCapturedFace(imageUri);
      setInstruction('Review your photo. Retake if needed.');
      return imageUri;
    } catch (error) {
      console.error('Face capture error:', error);
      throw error;
    }
  };


  // Only call API when user clicks Continue
  const completeFaceVerification = async () => {
    if (!capturedFace) {
      Alert.alert(STRINGS.common.error, 'No face image captured');
      return;
    }
    setIsProcessing(true);
    setInstruction(STRINGS.face.processingFace);
    try {
      await uploadAttachments(capturedFace);
    } catch (error) {
      Alert.alert(STRINGS.common.error, STRINGS.errors.serverError);
      resetFaceDetection();
    } finally {
      setIsProcessing(false);
    }
  };

  const uploadAttachments = async (imageUri: string) => {

      // Upload face image as attachment
      const attachment = {
        file: {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'face.jpg',
        },
        fileId: uuid.v4(),
        contentType: 'image/jpeg',
        metadata: { caption: 'Face Image' },
      };
      const attachmentRes = await apiService.uploadAttachments({ attachments: [attachment] });
      if (!attachmentRes.success || !attachmentRes.data || attachmentRes.data.results.some(r => r.error)) {
        throw new Error('Failed to upload face image');
      }
      const uploadedURL = attachmentRes.data.results[0].downloadUrl;

      if (!uploadedURL) {
        throw new Error('Uploaded URL is missing');
      }

      if (!verificationId || !attemptId) {
        showSnackbar('Verification ID or Attempt ID is missing. Please restart the verification process.', 'error');
        return;
      }
      // Now upload document (face verification)
      const documentReq: DocumentUploadRequest = {
        image_url: uploadedURL,
        verification_id: verificationId,
        attempt_id: attemptId,
        document_type: 'face_scan',
        scan_type: 'scan_face',
      };
      const documentRes = await apiService.uploadDocument(documentReq);
      if (!documentRes.success) {
        throw new Error('Failed to upload face verification document');
      }

      setVerification(prev => ({
        ...prev,
        faceImage: imageUri || null,
        faceVerified: true,
        currentStep: 'complete',
      }));

      showSnackbar(STRINGS.success.verificationComplete);

      navigation.navigate('Home');
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

  // Progress bar step (2 of 3)
  const currentStep = 3;
  const totalSteps = 3;
  const progressPercent = (currentStep / totalSteps) * 100;

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Bar */}
      <View
        style={{
          width: "100%",
          height: 8,
          backgroundColor: theme.colors.inputBorder,
        }}
      >
        <View
          style={{
            width: `${progressPercent}%`,
            height: 8,
            backgroundColor: theme.colors.primary,
            borderRadius: 4,
          }}
        />
      </View>
      <Text
        style={{
          textAlign: "center",
          color: theme.colors.textSecondary,
          marginTop: 8,
          marginBottom: 8,
        }}
      >
        Step {currentStep} of {totalSteps}
      </Text>
      <View style={{ flex: 1 }}>
        {/* Only show one retake button above main action button */}

        <View style={styles.header}>
          <Text style={styles.title}>{STRINGS.face.facialVerification}</Text>
          <Text style={styles.subtitle}>{STRINGS.face.faceInstruction}</Text>
        </View>

        <View style={styles.cameraContainer}>
          {hasPermission && frontDevice ? (
            <View style={[styles.faceFrame]}>
              {capturedFace ? (
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                  }}>
                  <Image
                    source={{ uri: capturedFace }}
                    style={{ width: screenWidth * 0.7, height: screenWidth * 0.7, borderRadius: (screenWidth * 0.7) / 2 }}
                    resizeMode="cover"
                    onLoad={() => {
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
                      }}
                  />
                  {/* Tick icon centered inside circle */}
                  <Animated.View
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      zIndex: 2,
                      transform: [
                        { translateX: -60 },
                        { translateY: -60 },
                        { scale: pulseAnim },
                      ],
                    }}>
                    <Image
                      source={require('../Assets/selected.png')}
                      style={{ width: 120, height: 120 }}
                      resizeMode="contain"
                    />
                  </Animated.View>
                  {/* Removed duplicate retake button */}
                </View>
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
                      console.error("Camera error:", error);
                      Alert.alert(
                        "Camera Error",
                        "Failed to initialize camera"
                      );
                    }}
                  />
                  {/* Face frame overlay */}
                  <View style={styles.faceOverlay}>
                    <View style={styles.faceFrameInner} />
                  </View>
                </>
              )}

              {captureProgress > 0 && !(capturedFace && captureProgress >= 100) && (
                <View style={styles.progressOverlay}>
                  <View style={styles.progressCircle} />
                </View>
              )}
            </View>
          ) : (
            <Animated.View
              style={[styles.faceFrame, { transform: [{ scale: pulseAnim }] }]}
            >
              <Text style={styles.faceIcon}>👤</Text>
              {!hasPermission && (
                <Text style={styles.permissionText}>
                  Camera permission required
                </Text>
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
              <View
                style={[
                  styles.statusDot,
                  isDetecting ? styles.activeDot : styles.inactiveDot,
                ]}
              />
              <View
                style={[
                  styles.statusDot,
                  faceDetected ? styles.activeDot : styles.inactiveDot,
                ]}
              />
              <View
                style={[
                  styles.statusDot,
                  captureProgress >= 100
                    ? styles.activeDot
                    : styles.inactiveDot,
                ]}
              />
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          {/* Retake button just above main action, right-aligned */}
          {capturedFace ? (
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
              <Button
                title="Retake"
                onPress={() => {
                  setCapturedFace(null);
                  setIsDetecting(false);
                  setFaceDetected(false);
                  setCaptureProgress(0);
                  setInstruction("Take the picture in bright light, and position your face in the frame.");
                  progressAnim.setValue(0);
                }}
                variant="outline"
                style={{ flex: 1 }}
              />
              <Button
                title={STRINGS.common.continue}
                onPress={completeFaceVerification}
                loading={isProcessing}
                style={{ flex: 1 }}
              />
            </View>
          ) : !hasPermission ? (
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
          ) : (
            <Button
              title="Cancel"
              onPress={resetFaceDetection}
              variant="outline"
              fullWidth
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default FaceVerificationScreen;