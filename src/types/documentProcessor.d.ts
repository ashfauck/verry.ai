// Type declarations for a (future) native OpenCV/TFLite based document processor module.
// These allow the JS/TS side to compile before the native implementation exists.
// Implement the native side to actually perform edge detection & perspective warp.

declare module 'react-native-document-processor' {
  import { Frame } from 'react-native-vision-camera';

  export interface DetectedDocument {
    confidence: number;
    boundingRect: { x: number; y: number; width: number; height: number }; // frame pixel space
    corners: { x: number; y: number }[]; // 4 points, order TL, TR, BR, BL (recommended)
    sharpness?: number;
    aspectRatio?: number;
    areaRatio?: number;
    glareRatio?: number; // 0..1 proportion of over-exposed pixels inside doc region
    brightness?: number; // average luma 0..255 if available
    isBlurry?: boolean;
    isGlare?: boolean;
  }

  // Frame processor callable (JSI) – returns null when no document.
  export function detectDocumentEdges(frame: Frame): DetectedDocument | null;

  // Post-capture warp + crop. Returns new file URI (file://...).
  export function warpAndCropDocument(
    imagePath: string,
    corners: { x: number; y: number }[],
    outputMax?: number
  ): { uri: string; width: number; height: number };
}

// Fallback ambient declaration so importing module won't crash if native not present.
// (At runtime you still need to guard requires.)
