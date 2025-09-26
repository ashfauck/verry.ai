import ImageEditor from '@react-native-community/image-editor';
import { Platform } from 'react-native';

export interface CropBounds {
  x: number; y: number; width: number; height: number;
}

export interface CropOptions {
  imageUri: string;
  originalSize: { width: number; height: number };
  screenBounds: CropBounds; // bounds on the screen (already scaled to screen)
  screenContainer: { width: number; height: number }; // total overlay container size
  outputMaxSize?: number; // optional max dimension to constrain output
}

/**
 * Convert detected screen-space bounds into image-space and crop using ImageEditor.
 * Handles aspect ratio differences (cover scaling logic) between camera preview and actual photo.
 */
export async function cropToBounds(opts: CropOptions): Promise<string> {
  const { imageUri, originalSize, screenBounds, screenContainer, outputMaxSize } = opts;
  const uri = normalizeUri(imageUri);
  const { width: imageW, height: imageH } = originalSize;
  const { width: containerW, height: containerH } = screenContainer;

  if (!containerW || !containerH) return uri;

  // Cover scaling used in camera preview (object-fit: cover semantics)
  const scale = Math.max(containerW / imageW, containerH / imageH);
  const scaledW = imageW * scale;
  const scaledH = imageH * scale;
  const offsetX = (containerW - scaledW) / 2;
  const offsetY = (containerH - scaledH) / 2;

  // Translate screen bounds back to image pixel coordinates
  const px = Math.round((screenBounds.x - offsetX) / scale);
  const py = Math.round((screenBounds.y - offsetY) / scale);
  const pw = Math.round(screenBounds.width / scale);
  const ph = Math.round(screenBounds.height / scale);

  // Clamp
  const x = clamp(px, 0, imageW - 1);
  const y = clamp(py, 0, imageH - 1);
  const w = clamp(pw, 10, imageW - x);
  const h = clamp(ph, 10, imageH - y);

  const maxSide = outputMaxSize || 1200;
  const resizeScale = Math.min(1, maxSide / Math.max(w, h));
  const targetW = Math.round(w * resizeScale);
  const targetH = Math.round(h * resizeScale);

  const cropData: any = {
    offset: { x, y },
    size: { width: w, height: h },
    displaySize: { width: targetW, height: targetH },
    resizeMode: 'contain',
  };

  try {
    const cropped: any = await ImageEditor.cropImage(uri, cropData);
    // Some versions may return string, others object { uri }
    const resultUri = typeof cropped === 'string' ? cropped : (cropped?.uri || uri);
    return normalizeUri(resultUri);
  } catch (e) {
    console.warn('[ImageCropper] Crop failed, returning original', e);
    return uri;
  }
}

function clamp(v: number, min: number, max: number) { return Math.min(max, Math.max(min, v)); }

function normalizeUri(u: string) {
  if (!u) return u;
  if (u.startsWith('http')) return u;
  return Platform.OS === 'ios' && !u.startsWith('file://') ? `file://${u}` : u;
}
