import { apiService, AttachmentUploadResult } from '../services/apiService';
import SnackbarController from '../components/SnackbarController';
import { setSnackbarRef, showSnackbar } from '../components/snackbarService';
import React, {useState} from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useRecoilState, useRecoilValue} from 'recoil';
import {useTheme} from '../components/ThemeProvider';
import {Button} from '../components';
import {attemptIdState, verificationIdState, verificationState} from '../store/atoms';
import type {VerificationState} from '../types';
// Ensure VerificationState includes udid
import DocumentScanner from 'react-native-document-scanner-plugin';
import uuid from 'react-native-uuid';
import environment from '../config/environment';
import {logger} from '../utils/logger';
import DropDownPicker from 'react-native-dropdown-picker';

interface DocumentCaptureScreenProps {}

const DocumentCaptureScreen: React.FC<DocumentCaptureScreenProps> = () => {
  // ...existing state and hooks...
  // Import ScrollView if not already
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownItems, setDropdownItems] = useState([
    { label: 'Driving license', value: 'driving_license' },
    { label: 'National Id', value: 'state_id' },
  ]);
  const navigation = useNavigation();
  const {theme, isDark} = useTheme();
  const [verification, setVerification] = useRecoilState(verificationState);
  const [isScanning, setIsScanning] = useState(false);
  const [scanningFor, setScanningFor] = useState<'front' | 'back' | null>(null);
  const attemptId = useRecoilValue(attemptIdState);
  const verificationId = useRecoilValue(verificationIdState);
  const [documentType, setDocumentType] = useState<'driving_license' | 'state_id'>('driving_license');

  const handleCaptureDocument = async (side: 'front' | 'back') => {
    // Prevent multiple scanner instances
    if (isScanning) {
      return;
    }
    
    try {
      setIsScanning(true);
      setScanningFor(side);

      logger.documentScan.start(side);

      // Start the document scanner with environment-based configuration
      const { scannedImages } = await DocumentScanner.scanDocument({
        maxNumDocuments: environment.documentScannerMaxDocuments || 1,
        croppedImageQuality: environment.documentScannerQuality,
      });
    
      // Get back an array with scanned image file paths
      if (scannedImages && scannedImages.length > 0) {
        // Take only the first image to ensure single capture
        const capturedImage = scannedImages[0];
        
        logger.documentScan.success(side, capturedImage);
        
        // Store the scanned image
        setVerification(prev => ({
          ...prev,
          [side === 'front' ? 'documentFront' : 'documentBack']: capturedImage,
        }));
        
        // Alert.alert(
        //   'Success',
        //   `${side === 'front' ? 'Front' : 'Back'} document captured successfully!`,
        //   [{ text: 'OK' }]
        // );
      } else {
        // User cancelled or no image was captured
        logger.documentScan.cancel(side);
      }
    } catch (error) {
      logger.documentScan.error(side, error);
      
      if (environment.errorReportingEnabled) {
        // Here you would send error to your error reporting service
        // e.g., Sentry, Crashlytics, etc.
      }
      
      Alert.alert('Error', 'Failed to scan document. Please try again.');
    } finally {
      setIsScanning(false);
      setScanningFor(null);
    }
  };

  const handleRetakeImage = (side: 'front' | 'back') => {
    Alert.alert(
      'Retake Image',
      `Are you sure you want to retake the ${side} image?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Retake',
          style: 'destructive',
          onPress: () => {
            logger.info(`Retaking ${side} document image`);
            
            setVerification((prev: VerificationState) => ({
              ...prev,
              [side === 'front' ? 'documentFront' : 'documentBack']: null,
            }));
          },
        },
      ]
    );
  };

  const handleContinue = async () => {
    if (!verification.documentFront || !verification.documentBack) {
      // Alert.alert(
      //   'Incomplete',
      //   'Please capture both front and back images of your document before continuing.',
      //   [{text: 'OK'}]
      // );
      showSnackbar('Incomplete\nPlease capture both front and back images of your document before continuing.', 'error');
      return;
    }

   showSnackbar('Uploading your document images...', 'info');
    // Prepare attachments array
    // Use UUID for fileId, not from verification
    // Generate one UUID for both attachments
   const docUuid = uuid.v4();
    
    let attachments = [
      {
        file: {
          uri: verification.documentFront,
          type: 'image/jpeg',
          name: 'document_front.jpg',
        },
        fileId: `${docUuid}_front`, // Same UUID, front
        contentType: 'image/jpeg',
        metadata: { caption: 'Front of Document' },
      },
      {
        file: {
          uri: verification.documentBack,
          type: 'image/jpeg',
          name: 'document_back.jpg',
        },
        fileId: `${docUuid}_back`, // Same UUID, back
        contentType: 'image/jpeg',
        metadata: { caption: 'Back of Document' },
      },
    ];

    let allUploaded = false;
    let uploadResults: AttachmentUploadResult[] = [];
    let maxRetries = 3;
    let attempt = 0;

    while (!allUploaded && attempt < maxRetries) {
      try {
        const response = await apiService.uploadAttachments({ attachments });
        console.log('Upload response:', response);
        
        if (!response.success || !response.data) {
          showSnackbar(response.error || 'Failed to upload documents.', 'error');
          return;
        }
        uploadResults = response.data.results;
        const failed = uploadResults.filter(r => r.error);
        if (failed.length === 0) {
          allUploaded = true;
          break;
        } else {
          // Only retry failed attachments
          attachments = attachments.filter(att => failed.some(f => f.fileId === att.fileId));
          attempt++;
          if (attempt < maxRetries) {
            showSnackbar(`Retrying failed uploads (${attempt}/${maxRetries})...`, 'info');
          } else {
            showSnackbar(failed.map(r => r.error?.message).join('\n'), 'error');
            return;
          }
        }
      } catch (error: any) {
        showSnackbar(error.message || 'Failed to upload documents.', 'error');
        return;
      }
    }

    // All attachments uploaded successfully
    const fileIds = uploadResults.map(r => r.fileId);
    logger.info('Document uploaded', fileIds);
    showSnackbar('Documents uploaded successfully!', 'success');

    // Prepare requests for front and back
    const requests = [
      {
        image_url: uploadResults.find(r => r.fileId.includes(`${docUuid}_front`))?.downloadUrl || "",
        verification_id: verificationId,
        attempt_id: attemptId,
        document_type: documentType,
        scan_type: 'scan_front',
      },
      {
        image_url: uploadResults.find(r => r.fileId.includes(`${docUuid}_back`))?.downloadUrl || "",
        verification_id: verificationId,
        attempt_id: attemptId,
        document_type: documentType,
        scan_type: 'scan_back',
      },
    ];

    console.log("Req ", JSON.stringify(requests));
    

    await uploadDocumentVerificationRecords(requests);
  };

  const uploadDocumentVerificationRecords = async (requests: any[]) => {
    let maxRetries = 3;
    let attempt = 0;
    let allSuccess = false;
    let lastError = '';
    while (attempt < maxRetries && !allSuccess) {
      allSuccess = true;
      for (const req of requests) {
        try {
          const res = await apiService.uploadDocument(req);
          if (!res.success) {
            allSuccess = false;
            lastError = res.message || 'Document verification failed';
            break;
          }
        } catch (err: any) {
          allSuccess = false;
          lastError = err.message || 'Document verification failed';
          break;
        }
      }
      if (!allSuccess) {
        attempt++;
        if (attempt < maxRetries) {
          showSnackbar(`Retrying document verification (${attempt}/${maxRetries})...`, 'info');
        } else {
          showSnackbar(lastError, 'error');
          Alert.alert('Verification Failed', 'Unable to verify documents after multiple attempts. Please try again or contact support.', [
            { text: 'Retry', onPress: () => uploadDocumentVerificationRecords(requests) },
            { text: 'Cancel', style: 'cancel' }
          ]);
          return;
        }
      }
    }
    if (allSuccess) {
      setTimeout(() => {
        (navigation as any).navigate('FaceVerification');
      }, 1200);
    }
  };

  const renderDocumentSection = (side: 'front' | 'back') => {
    const document = side === 'front' ? verification.documentFront : verification.documentBack;
    const isCapture = !document;
    const title = side === 'front' ? 'Front of Document' : 'Back of Document';
    const subtitle = side === 'front' 
      ? 'Take a photo of the front side'
      : 'Take a photo of the back side';

    return (
      <View style={[styles.documentSection, {borderColor: theme.colors.border}]}>
        <Text style={[styles.documentTitle, {color: theme.colors.textPrimary}]}>
          {title}
        </Text>
        <Text style={[styles.documentSubtitle, {color: theme.colors.textSecondary}]}>
          {subtitle}
        </Text>
        
        <TouchableOpacity
          style={[
            styles.documentContainer,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={() => handleCaptureDocument(side)}
          activeOpacity={0.7}
          disabled={isScanning}>
          {document ? (
            <View style={styles.imageContainer}>
              <Image source={{uri: document}} style={styles.documentImage} />
              <View style={styles.imageOverlay}>
                <TouchableOpacity
                  style={[styles.retakeButton, {backgroundColor: theme.colors.error}]}
                  onPress={() => handleRetakeImage(side)}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <Text style={[styles.retakeIcon, {color: '#FFFFFF'}]}>↻</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.capturePrompt}>
              {isScanning && scanningFor === side ? (
                <>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={[styles.captureText, {color: theme.colors.primary}]}>
                    Opening Scanner...
                  </Text>
                </>
              ) : (
                <>
                  <View style={[styles.cameraIcon, {borderColor: theme.colors.primary}]}>
                    <Text style={[styles.cameraIconText, {color: theme.colors.primary}]}>📷</Text>
                  </View>
                  <Text style={[styles.captureText, {color: theme.colors.textSecondary}]}>
                    Tap to capture
                  </Text>
                </>
              )}
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const canContinue = verification.documentFront && verification.documentBack;

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}> 
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.header}> 
          <Text style={[styles.title, {color: theme.colors.textPrimary}]}> 
            Document Capture 
          </Text> 
          <Text style={[styles.description, {color: theme.colors.textSecondary}]}> 
            Please capture both sides of your identification document 
          </Text> 
        </View> 

        <View style={styles.content}> 
          {/* Document Type Dropdown */}
          <View style={{ marginBottom: 16, zIndex: 10000 }}>
            <Text style={{ color: theme.colors.textPrimary, fontWeight: '600', marginBottom: 8 }}>Document Type</Text>
            <DropDownPicker
              open={dropdownOpen}
              value={documentType}
              items={dropdownItems}
              setOpen={setDropdownOpen}
              setValue={setDocumentType}
              setItems={setDropdownItems}
              containerStyle={{ height: 48 }}
              style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
              dropDownContainerStyle={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
              textStyle={{ color: theme.colors.textPrimary }}
              arrowIconStyle={{ tintColor: isDark ? '#fff' : '#222' }}
              tickIconStyle={{ tintColor: isDark ? '#fff' : '#222' }}
              placeholder="Select document type"
            />
          </View>
          {renderDocumentSection('front')} 
          {renderDocumentSection('back')} 
        </View> 

        <View style={[styles.footer, {paddingBottom: theme.spacing.xl}]}> 
          <Button 
            title="Continue" 
            onPress={handleContinue} 
            disabled={!canContinue} 
            style={styles.continueButton} 
          /> 
        </View> 
      </ScrollView>
    </View> 
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    gap: 24,
  },
  documentSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  documentTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  documentSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  documentContainer: {
    height: 180,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  documentImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  retakeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  retakeIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  capturePrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  cameraIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconText: {
    fontSize: 24,
  },
  captureText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  continueButton: {
    marginTop: 16,
  },
});

export default DocumentCaptureScreen;