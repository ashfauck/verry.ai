// JS façade that prefers native JSI functions if present, otherwise falls back to placeholder logic.

type Corner = { x: number; y: number };

interface DetectedDoc {
  confidence: number;
  boundingRect: { x: number; y: number; width: number; height: number };
  corners: Corner[];
  aspectRatio?: number;
  areaRatio?: number;
}

let nativeModule: any = null;
try {
  // Provided by iOS JSI installer (DocumentProcessor.mm) as global __DocumentProcessor
  // or via proper native module packaging later.
  // eslint-disable-next-line no-undef
  if (global && (global as any).__DocumentProcessor) {
    nativeModule = (global as any).__DocumentProcessor;
  } else {
    // Attempt standard require path if packaged as library later
    // nativeModule = require('react-native-document-processor');
    nativeModule = null; // Module not available as standalone package yet
  }
} catch (e) {
  nativeModule = null;
}

export function isNativeDocumentProcessorAvailable() {
  return !!nativeModule;
}

export function warpAndCropDocument(imagePath: string, corners: Corner[], outputMax = 1600) {
  if (nativeModule?.warpAndCropDocument) {
    try {
      return nativeModule.warpAndCropDocument(imagePath, corners, outputMax);
    } catch (e) {}
  }
  // Fallback: return original
  return { uri: imagePath, width: 0, height: 0 };
}
