import {Platform, Dimensions} from 'react-native';
import ImageEditor from '@react-native-community/image-editor';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

export interface FrameBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PhotoSize {
  width: number;
  height: number;
}

export interface CropResult {
  success: boolean;
  croppedUri: string;
  error?: string;
}

/**
 * Simplified cropper specifically for the static blue dotted frame
 */
export class FrameCropper {
  
  /**
   * Normalize URI to ensure proper file:// prefix for iOS
   */
  private static normalizeUri(uri: string): string {
    if (!uri) return uri;
    if (uri.startsWith('http')) return uri;
    if (Platform.OS === 'ios' && !uri.startsWith('file://')) {
      return `file://${uri}`;
    }
    return uri;
  }

  /**
   * Calculate the actual camera preview bounds within the camera container
   * This accounts for React Native Camera's cover-mode scaling behavior
   */
  private static calculateCameraPreviewBounds(
    containerSize: { width: number; height: number },
    photoSize: PhotoSize
  ): { x: number; y: number; width: number; height: number } {
    const containerAspect = containerSize.width / containerSize.height;
    const photoAspect = photoSize.width / photoSize.height;
    
    console.log('[FrameCropper] Camera preview bounds calculation:');
    console.log('  Container:', containerSize, 'aspect:', containerAspect.toFixed(3));
    console.log('  Photo:', photoSize, 'aspect:', photoAspect.toFixed(3));
    
    if (Math.abs(containerAspect - photoAspect) < 0.01) {
      // Aspects match - preview fills entire container
      console.log('  → Preview fills entire container (aspects match)');
      return { x: 0, y: 0, width: containerSize.width, height: containerSize.height };
    }
    
    // Cover mode: camera preview will be scaled to cover the entire container
    // while maintaining aspect ratio, which means some content may be cropped
    let previewWidth: number;
    let previewHeight: number;
    let previewX: number;
    let previewY: number;
    
    if (photoAspect > containerAspect) {
      // Photo is wider than container - fit to container height, center horizontally
      previewHeight = containerSize.height;
      previewWidth = previewHeight * photoAspect;
      previewX = (containerSize.width - previewWidth) / 2;
      previewY = 0;
      console.log('  → Photo wider than container: fit height, center horizontally');
    } else {
      // Photo is taller than container - fit to container width, center vertically  
      previewWidth = containerSize.width;
      previewHeight = previewWidth / photoAspect;
      previewX = 0;
      previewY = (containerSize.height - previewHeight) / 2;
      console.log('  → Photo taller than container: fit width, center vertically');
    }
    
    const previewBounds = {
      x: previewX,
      y: previewY,
      width: previewWidth,
      height: previewHeight
    };
    
    console.log('  → Calculated preview bounds:', previewBounds);
    return previewBounds;
  }

  /**
   * Convert frame coordinates to image coordinates using accurate camera preview mapping
   * This properly accounts for how React Native Camera scales the preview within the container
   */
  private static convertFrameToImageCoordinates(
    frameBounds: FrameBounds,
    photoSize: PhotoSize,
    containerSize?: { width: number; height: number }
  ): FrameBounds {
    console.log('\\n=== Frame to Image Conversion (Camera Preview Aware) ===');
    console.log('[FrameCropper] Input frame bounds (overlay coords):', frameBounds);
    console.log('[FrameCropper] Photo size (actual capture):', photoSize);
    
    // Use provided container size or fall back to screen dimensions
    const container = containerSize || { width: screenWidth, height: screenHeight };
    console.log('[FrameCropper] Container size:', container);
    
    // Calculate where the camera preview actually sits within the container
    const previewBounds = this.calculateCameraPreviewBounds(container, photoSize);
    
    // Convert frame coordinates from container space to preview space
    const frameInPreview = {
      x: frameBounds.x - previewBounds.x,
      y: frameBounds.y - previewBounds.y,
      width: frameBounds.width,
      height: frameBounds.height
    };
    
    console.log('[FrameCropper] Frame bounds in preview space:', frameInPreview);
    
    // Validate that the frame is within the preview bounds
    if (frameInPreview.x < 0 || frameInPreview.y < 0 || 
        frameInPreview.x + frameInPreview.width > previewBounds.width ||
        frameInPreview.y + frameInPreview.height > previewBounds.height) {
      console.warn('[FrameCropper] ⚠️ Frame extends outside camera preview bounds!');
      console.warn('  Frame in preview:', frameInPreview);
      console.warn('  Preview size:', { width: previewBounds.width, height: previewBounds.height });
    }
    
    // Scale from preview coordinates to photo coordinates
    const scaleX = photoSize.width / previewBounds.width;
    const scaleY = photoSize.height / previewBounds.height;
    
    console.log('[FrameCropper] Preview to photo scale factors:');
    console.log('  ScaleX:', scaleX.toFixed(4), '(', photoSize.width, '/', previewBounds.width.toFixed(1), ')');
    console.log('  ScaleY:', scaleY.toFixed(4), '(', photoSize.height, '/', previewBounds.height.toFixed(1), ')');
    
    // Apply scaling to get photo coordinates
    const photoX = frameInPreview.x * scaleX;
    const photoY = frameInPreview.y * scaleY;
    const photoWidth = frameInPreview.width * scaleX;
    const photoHeight = frameInPreview.height * scaleY;
    
    console.log('[FrameCropper] Coordinate mapping:');
    console.log(`  Container (${frameBounds.x.toFixed(1)}, ${frameBounds.y.toFixed(1)}) -> Preview (${frameInPreview.x.toFixed(1)}, ${frameInPreview.y.toFixed(1)}) -> Photo (${photoX.toFixed(1)}, ${photoY.toFixed(1)})`);
    console.log(`  Size (${frameBounds.width.toFixed(1)} x ${frameBounds.height.toFixed(1)}) -> Photo (${photoWidth.toFixed(1)} x ${photoHeight.toFixed(1)})`);
    
    // Clamp to photo bounds and ensure reasonable dimensions
    const finalBounds: FrameBounds = {
      x: Math.max(0, Math.round(photoX)),
      y: Math.max(0, Math.round(photoY)),
      width: Math.max(50, Math.min(photoSize.width - Math.max(0, Math.round(photoX)), Math.round(photoWidth))),
      height: Math.max(50, Math.min(photoSize.height - Math.max(0, Math.round(photoY)), Math.round(photoHeight))),
    };
    
    console.log('[FrameCropper] Final clamped bounds:', finalBounds);
    
    // Enhanced validation
    const cropArea = finalBounds.width * finalBounds.height;
    const photoArea = photoSize.width * photoSize.height;
    const areaRatio = cropArea / photoArea;
    
    console.log('[FrameCropper] Validation:');
    console.log('  Crop area:', cropArea.toLocaleString(), 'pixels');
    console.log('  Photo area:', photoArea.toLocaleString(), 'pixels');
    console.log('  Area ratio:', (areaRatio * 100).toFixed(2), '%');
    console.log('  Preview bounds:', previewBounds);
    
    console.log('=== End Frame Conversion (Camera Preview Aware) ===\\n');
    
    return finalBounds;
  }

  /**
   * Add small padding around the frame to ensure we don't cut off document edges
   */
  private static addPadding(
    imageBounds: FrameBounds,
    photoSize: PhotoSize,
    paddingPercent: number = 0.02
  ): FrameBounds {
    const paddingX = Math.round(imageBounds.width * paddingPercent);
    const paddingY = Math.round(imageBounds.height * paddingPercent);

    return {
      x: Math.max(0, imageBounds.x - paddingX),
      y: Math.max(0, imageBounds.y - paddingY),
      width: Math.min(
        photoSize.width - Math.max(0, imageBounds.x - paddingX),
        imageBounds.width + (paddingX * 2)
      ),
      height: Math.min(
        photoSize.height - Math.max(0, imageBounds.y - paddingY),
        imageBounds.height + (paddingY * 2)
      ),
    };
  }

  /**
   * Crop image to match the blue dotted frame area
   */
  static async cropToFrame(
    imageUri: string,
    frameBounds: FrameBounds,
    photoSize: PhotoSize,
    options: {
      addPadding?: boolean;
      paddingPercent?: number;
      containerSize?: { width: number; height: number };
    } = {}
  ): Promise<CropResult> {
    const {
      addPadding = true,
      paddingPercent = 0.02, // Small padding (2%)
      containerSize,
    } = options;

    try {
      const normalizedUri = this.normalizeUri(imageUri);
      console.log('[FrameCropper] Starting frame-based crop');
      console.log('[FrameCropper] Input URI:', normalizedUri);
      
      // Validate that we have container size for accurate preview bounds calculation
      if (!containerSize) {
        console.warn('[FrameCropper] ⚠️ Container size not provided - using screen dimensions as fallback');
        console.warn('[FrameCropper] This may result in inaccurate cropping. Please ensure camera container size is passed.');
      }
      
      // Convert frame coordinates to image coordinates with accurate camera preview mapping
      let imageBounds = this.convertFrameToImageCoordinates(frameBounds, photoSize, containerSize);
      
      // Add padding if requested
      if (addPadding) {
        imageBounds = this.addPadding(imageBounds, photoSize, paddingPercent);
        console.log('[FrameCropper] Final bounds with padding:', imageBounds);
      }

      // Validate dimensions
      if (imageBounds.width < 50 || imageBounds.height < 50) {
        throw new Error(`Crop dimensions too small: ${imageBounds.width}x${imageBounds.height}`);
      }

      if (imageBounds.x + imageBounds.width > photoSize.width ||
          imageBounds.y + imageBounds.height > photoSize.height) {
        throw new Error('Crop bounds exceed photo dimensions');
      }

      // Prepare crop data for ImageEditor
      const cropData = {
        offset: {
          x: imageBounds.x,
          y: imageBounds.y,
        },
        size: {
          width: imageBounds.width,
          height: imageBounds.height,
        },
      };

      console.log('[FrameCropper] Cropping with:', cropData);

      // Perform the crop
      const result = await ImageEditor.cropImage(normalizedUri, cropData);
      const croppedUri = typeof result === 'string' ? result : result.uri;
      const finalUri = this.normalizeUri(croppedUri);

      console.log('[FrameCropper] ✅ Crop successful:', finalUri);

      return {
        success: true,
        croppedUri: finalUri,
      };

    } catch (error) {
      console.error('[FrameCropper] ❌ Crop failed:', error);
      
      return {
        success: false,
        croppedUri: this.normalizeUri(imageUri),
        error: `Frame crop failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}