/**
 * OpenCV Integration Example
 * 
 * This file shows how to integrate the OpenCV document cropper 
 * into your existing camera and document verification workflow.
 */

import { Alert } from 'react-native';
import { useState } from 'react';
import {
  cropDocument,
  scalePolygonToImageSpace,
  validatePolygon,
  DocumentPoint,
  OpenCVCropResult
} from '../utils/opencvCropper';

/**
 * Complete workflow example: From camera capture to OpenCV cropping
 */
export class DocumentCaptureWorkflow {
  
  /**
   * Step 1: Capture photo and detect document corners
   * This would typically happen in your DocumentVerificationScreen
   */
  static async captureAndDetectDocument(): Promise<{
    imagePath: string;
    detectedCorners: DocumentPoint[];
    previewSize: { width: number; height: number };
  }> {
    
    // Simulate camera capture (replace with actual camera implementation)
    const imagePath = 'file:///path/to/captured/document.jpg';
    
    // Simulate document detection (replace with actual ML detection)
    // These coordinates should come from your document detection algorithm
    // in the coordinate space of your camera preview
    const detectedCorners: DocumentPoint[] = [
      { x: 100, y: 200 },   // Top-left corner in preview space
      { x: 350, y: 190 },   // Top-right corner
      { x: 360, y: 450 },   // Bottom-right corner  
      { x: 90, y: 460 }     // Bottom-left corner
    ];
    
    // Preview size (camera preview dimensions)
    const previewSize = { width: 375, height: 667 }; // iPhone screen size example
    
    console.log('📸 Document captured and detected:');
    console.log('  Image path:', imagePath);
    console.log('  Detected corners:', detectedCorners);
    console.log('  Preview size:', previewSize);
    
    return { imagePath, detectedCorners, previewSize };
  }
  
  /**
   * Step 2: Process document with OpenCV cropping
   */
  static async processWithOpenCV(
    imagePath: string,
    previewCorners: DocumentPoint[],
    previewSize: { width: number; height: number }
  ): Promise<OpenCVCropResult> {
    
    console.log('🎯 Starting OpenCV processing...');
    
    try {
      // Get actual image dimensions
      const imageSize = await this.getImageDimensions(imagePath);
      console.log('📏 Image dimensions:', imageSize);
      
      // Scale polygon from preview coordinates to full image coordinates
      const scaledPolygon = scalePolygonToImageSpace(
        previewCorners,
        previewSize,
        imageSize
      );
      console.log('📐 Scaled polygon:', scaledPolygon);
      
      // Validate the scaled polygon
      const validation = validatePolygon(scaledPolygon, imageSize);
      if (!validation.valid) {
        console.warn('⚠️ Polygon validation failed:', validation.issues);
        throw new Error(`Invalid polygon: ${validation.issues.join(', ')}`);
      }
      console.log('✅ Polygon validation passed');
      
      // Process with OpenCV perspective transformation
      const result = await cropDocument(imagePath, scaledPolygon);
      console.log('📋 OpenCV processing result:', {
        success: result.success,
        outputPath: result.croppedImagePath,
        error: result.error
      });
      
      if (result.metadata) {
        console.log('📊 Processing metadata:');
        console.log('  Original size:', result.metadata.originalSize);
        console.log('  Cropped size:', result.metadata.croppedSize);
        console.log('  Ordered points:', result.metadata.orderedPoints);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ OpenCV processing failed:', error);
      
      return {
        success: false,
        croppedImagePath: imagePath, // Return original as fallback
        error: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Step 3: Handle the processing result
   */
  static handleProcessingResult(result: OpenCVCropResult): void {
    if (result.success) {
      console.log('🎉 Document processing successful!');
      console.log('📁 Cropped image saved to:', result.croppedImagePath);
      
      Alert.alert(
        'Success',
        'Document cropped and perspective-corrected successfully!',
        [
          {
            text: 'Continue',
            onPress: () => {
              // Navigate to next screen or upload the processed image
              console.log('Continuing with processed image:', result.croppedImagePath);
            }
          }
        ]
      );
    } else {
      console.error('💥 Document processing failed:', result.error);
      
      Alert.alert(
        'Processing Failed',
        result.error || 'Unable to process the document. Please try again.',
        [
          {
            text: 'Retry',
            onPress: () => {
              // Go back to camera or retry processing
              console.log('User chose to retry processing');
            }
          },
          {
            text: 'Use Original',
            onPress: () => {
              // Continue with original uncropped image
              console.log('Using original image as fallback');
            }
          }
        ]
      );
    }
  }
  
  /**
   * Complete workflow: Capture -> Process -> Handle Result
   */
  static async runCompleteWorkflow(): Promise<void> {
    try {
      // Step 1: Capture and detect
      const { imagePath, detectedCorners, previewSize } = await this.captureAndDetectDocument();
      
      // Step 2: Process with OpenCV
      const result = await this.processWithOpenCV(imagePath, detectedCorners, previewSize);
      
      // Step 3: Handle result
      this.handleProcessingResult(result);
      
    } catch (error) {
      console.error('💥 Complete workflow failed:', error);
      Alert.alert('Error', 'Document processing workflow failed. Please try again.');
    }
  }
  
  /**
   * Utility: Get image dimensions
   */
  private static getImageDimensions(uri: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const Image = require('react-native').Image;
      Image.getSize(
        uri,
        (width: number, height: number) => {
          resolve({ width, height });
        },
        (error: any) => {
          reject(error);
        }
      );
    });
  }
}

/**
 * React Hook for OpenCV Document Processing
 * 
 * Use this hook in your React components for easy integration
 */
export const useOpenCVDocumentProcessor = () => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<OpenCVCropResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const processDocument = async (
    imagePath: string,
    polygon: DocumentPoint[],
    previewSize?: { width: number; height: number }
  ) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Use screen dimensions as default preview size
      const defaultPreviewSize = {
        width: 375, // Default iPhone width
        height: 667  // Default iPhone height
      };
      
      const actualPreviewSize = previewSize || defaultPreviewSize;
      
      const processingResult = await DocumentCaptureWorkflow.processWithOpenCV(
        imagePath, 
        polygon, 
        actualPreviewSize
      );
      
      setResult(processingResult);
      
      if (!processingResult.success) {
        setError(processingResult.error || 'Processing failed');
      }
      
      return processingResult;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      
      return {
        success: false,
        croppedImagePath: imagePath,
        error: errorMessage
      };
    } finally {
      setIsProcessing(false);
    }
  };
  
  const reset = () => {
    setResult(null);
    setError(null);
    setIsProcessing(false);
  };
  
  return {
    processDocument,
    isProcessing,
    result,
    error,
    reset
  };
};

/**
 * Integration with existing DocumentVerificationScreen
 * 
 * Add this to your existing camera capture handler:
 */
export const integrateWithCameraCapture = {
  
  // Add this to your photo capture callback
  onPhotoCaptured: async (photo: any, detectedPolygon?: DocumentPoint[]) => {
    console.log('📷 Photo captured, processing with OpenCV...');
    
    // Extract image path from camera result
    const imagePath = photo.path || photo.uri;
    
    // Use detected polygon or create a fallback
    const polygon = detectedPolygon || [
      { x: 50, y: 50 },     // Top-left
      { x: 325, y: 50 },    // Top-right  
      { x: 325, y: 617 },   // Bottom-right
      { x: 50, y: 617 }     // Bottom-left
    ];
    
    // Get preview size from camera view
    const previewSize = { width: 375, height: 667 };
    
    // Process with OpenCV
    const result = await DocumentCaptureWorkflow.processWithOpenCV(
      imagePath,
      polygon, 
      previewSize
    );
    
    // Navigate to review screen with result
    if (result.success) {
      // Navigate to DocumentReviewScreenOpenCV
      navigation.navigate('DocumentReviewOpenCV', {
        originalImageUri: imagePath,
        croppedImageUri: result.croppedImagePath,
        detectedCorners: polygon,
        previewSize: previewSize,
        cropResult: result
      });
    } else {
      Alert.alert('Processing Failed', result.error);
    }
  },
  
  // Add this to your existing frame processor (if using vision-camera)
  frameProcessor: (frame: any) => {
    'worklet';
    
    // Document detection would happen here
    // const detectedCorners = detectDocumentCorners(frame);
    
    // Store detected corners for later use when photo is captured
    // runOnJS(setDetectedCorners)(detectedCorners);
  }
};

// Export everything for easy importing
export {
  DocumentCaptureWorkflow as OpenCVWorkflow,
  useOpenCVDocumentProcessor as useOpenCV,
  integrateWithCameraCapture as CameraIntegration
};