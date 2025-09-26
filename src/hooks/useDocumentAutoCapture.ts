import { useRef, useCallback } from 'react';

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

// Document auto-capture hook with basic frame processor support

export interface StableDoc {
  confidence: number;
  corners: { x: number; y: number }[]; // frame space
  boundingRect: { x: number; y: number; width: number; height: number }; // frame space
  frameSize: { width: number; height: number };
  sharpness?: number;
  areaRatio?: number;
  aspectRatio?: number;
  glareRatio?: number;
  brightness?: number;
  isBlurry?: boolean;
  isGlare?: boolean;
}

interface UseDocAutoCaptureArgs {
  enabled: boolean;
  onStable: (doc: StableDoc) => void; // called on JS thread
  confidenceThreshold?: number;
  requiredStableFrames?: number;
  maxCornerDrift?: number; // px
  minSharpness?: number; // below -> considered blurry
  minAreaRatio?: number; // minimal doc area fraction of frame
  maxGlareRatio?: number; // glare threshold
  adaptive?: boolean; // adapt thresholds upward when stable over time
}

/**
 * Hook wrapping frame processor based document detection with temporal stability logic.
 * Requires a native implementation of `detectDocumentEdges`. If unavailable, hook is inert.
 */
export function useDocumentAutoCapture({
  enabled,
  onStable,
  confidenceThreshold = 0.78,
  requiredStableFrames = 6,
  maxCornerDrift = 18,
  minSharpness = 40,
  minAreaRatio = 0.18,
  maxGlareRatio = 0.2,
  adaptive = true,
}: UseDocAutoCaptureArgs) {
  const detectionsRef = useRef<any[]>([]);
  const lastEmittedTsRef = useRef<number>(0);
  const dynamicConfRef = useRef<number>(confidenceThreshold);
  const frameCounterRef = useRef<number>(0);

  const evaluateStability = useCallback(() => {
    const list = detectionsRef.current;
    if (!Array.isArray(list) || list.length < requiredStableFrames) return;
    
    const confThresh = dynamicConfRef.current;
    
    // Threshold & quality filters - ensure each detection object exists and has required properties
    if (!list.every(d => d && typeof d.confidence === 'number' && d.confidence >= confThresh)) return;
    if (!list.every(d => d && (d.sharpness == null || (typeof d.sharpness === 'number' && d.sharpness >= minSharpness)))) return;
    if (!list.every(d => d && (d.areaRatio == null || (typeof d.areaRatio === 'number' && d.areaRatio >= minAreaRatio)))) return;
    if (!list.every(d => d && (d.glareRatio == null || (typeof d.glareRatio === 'number' && d.glareRatio <= maxGlareRatio)))) return;
    
    const first = list[0];
    const last = list[list.length - 1];
    
    // Ensure both first and last detections have valid corners arrays
    if (!first || !last || !Array.isArray(first.corners) || !Array.isArray(last.corners)) return;
    if (first.corners.length === 0 || last.corners.length === 0) return;
    if (first.corners.length !== last.corners.length) return;
    
    const driftOk = last.corners.every((pt: any, i: number) => {
      const f = first.corners[i];
      if (!pt || !f || typeof pt.x !== 'number' || typeof pt.y !== 'number' || 
          typeof f.x !== 'number' || typeof f.y !== 'number') {
        return false;
      }
      return Math.abs(pt.x - f.x) <= maxCornerDrift && Math.abs(pt.y - f.y) <= maxCornerDrift;
    });
    
    if (!driftOk) return;
    
    const now = Date.now();
    if (now - lastEmittedTsRef.current < 1200) return; // throttle emits
    lastEmittedTsRef.current = now;
    
    if (adaptive && dynamicConfRef.current < 0.9) {
      dynamicConfRef.current = Math.min(0.9, dynamicConfRef.current + 0.02);
    }
    
    onStable({
      confidence: last.confidence || 0,
      corners: last.corners || [],
      boundingRect: last.boundingRect || { x: 0, y: 0, width: 0, height: 0 },
      frameSize: { width: last.frameWidth || 0, height: last.frameHeight || 0 },
      sharpness: last.sharpness,
      areaRatio: last.areaRatio,
      aspectRatio: last.aspectRatio,
      glareRatio: last.glareRatio,
      brightness: last.brightness,
      isBlurry: last.isBlurry,
      isGlare: last.isGlare,
    });
  }, [onStable, requiredStableFrames, maxCornerDrift, minSharpness, minAreaRatio, maxGlareRatio, adaptive]);

  // Create a basic frame processor - always call the hook to maintain hook order
  let frameProcessor = null;
  
  // Temporarily disable frame processor to avoid worklet compilation issues
  frameProcessor = null;
  
  console.log('[useDocumentAutoCapture] Frame processor disabled');  return { frameProcessor };
}
