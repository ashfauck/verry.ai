import { useRef, useCallback, useEffect, useState } from 'react';
import { detectDocumentSimple, DocumentDetectionResult } from '../utils/simpleDocumentDetection';

// Import frame processor conditionally to avoid crashes
let useFrameProcessor: any = null;
let runOnJS: any = null;

try {
  const visionCamera = require('react-native-vision-camera');
  const reanimated = require('react-native-reanimated');
  useFrameProcessor = visionCamera.useFrameProcessor;
  runOnJS = reanimated.runOnJS;
} catch (e) {
  console.warn('VisionCamera or Reanimated not available:', e);
}

export interface AIDocumentDetection {
  found: boolean;
  confidence: number;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  corners?: Array<{ x: number; y: number }>;
  documentType?: 'license' | 'passport' | 'id_card' | 'unknown';
  frameSize: { width: number; height: number };
}

interface UseAIDocumentDetectionArgs {
  enabled: boolean;
  onDocumentDetected: (detection: AIDocumentDetection) => void;
  confidenceThreshold?: number;
  detectionInterval?: number; // ms between detections
  screenWidth?: number;
  screenHeight?: number;
}

/**
 * Hook that uses AI/Computer Vision to detect documents in real-time camera frames
 */
export function useAIDocumentDetection({
  enabled,
  onDocumentDetected,
  confidenceThreshold = 0.7,
  detectionInterval = 500,
  screenWidth = 375, // default iPhone width
  screenHeight = 667, // default iPhone height
}: UseAIDocumentDetectionArgs) {
  const lastDetectionTime = useRef<number>(0);
  const frameCounterRef = useRef<number>(0);
  const processingRef = useRef<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Callback to handle detection results on JS thread
  const handleDetectionResult = useCallback((result: DocumentDetectionResult, frameWidth: number, frameHeight: number) => {
    if (result.found && result.confidence >= confidenceThreshold) {
      onDocumentDetected({
        found: result.found,
        confidence: result.confidence,
        bounds: result.bounds,
        corners: result.corners,
        documentType: result.documentType,
        frameSize: { width: frameWidth, height: frameHeight }
      });
    }
  }, [onDocumentDetected, confidenceThreshold]);

  // Frame processor for real-time detection - ALWAYS call the hook to maintain hook order
  let frameProcessor = null;

  // Temporarily disable frame processor to avoid worklet compilation issues
  // Will use periodic fallback detection instead
  frameProcessor = null;
  
  console.log('[useAIDocumentDetection] Frame processor disabled, using periodic detection fallback');

  // Fallback: Periodic detection using camera snapshots with real image processing
  const snapAndDetect = useCallback(async (cameraRef: any) => {
    if (!enabled || processingRef.current) return;
    
    try {
      processingRef.current = true;
      setIsProcessing(true);
      console.log('[snapAndDetect] Taking photo...');
      
      // Take a photo for analysis
      const photo = await cameraRef.current?.takePhoto({ 
        flash: 'off', 
        qualityPrioritization: 'speed',
        enableShutterSound: false
      });
      
      if (!photo) {
        console.warn('[snapAndDetect] No photo captured');
        return;
      }
      
      const imageUri = `file://${photo.path}`;
      console.log('[snapAndDetect] Photo captured:', imageUri);
      
      // Get photo dimensions
      const frameWidth = (photo as any).width || 1920;
      const frameHeight = (photo as any).height || 1080;
      
      // Use simple detection (no ML processing)
      const result = await detectDocumentSimple(imageUri, frameWidth, frameHeight, screenWidth, screenHeight);
      console.log('[snapAndDetect] Detection result:', result);
      
      if (result.found && result.confidence >= confidenceThreshold) {
        console.log('[snapAndDetect] Document detected! Notifying callback...');
        onDocumentDetected({
          found: result.found,
          confidence: result.confidence,
          bounds: result.bounds,
          corners: result.corners,
          documentType: result.documentType,
          frameSize: { width: frameWidth, height: frameHeight }
        });
      } else {
        console.log(`[snapAndDetect] No document detected (confidence: ${result.confidence})`);
      }
      
    } catch (error) {
      console.error('[Snap and Detect] Error:', error);
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [enabled, onDocumentDetected, confidenceThreshold]);

  return { 
    frameProcessor,
    snapAndDetect,
    isProcessing
  };
}