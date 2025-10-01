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

  // Removed complex camera preview bounds calculation in favor of simpler approach

  /**
   * SIMPLIFIED: Convert frame coordinates to image coordinates
   * Using a much simpler approach to avoid coordinate mapping issues
   */
  private static convertFrameToImageCoordinates(
    frameBounds: FrameBounds,
    photoSize: PhotoSize,
    containerSize?: { width: number; height: number }
  ): FrameBounds {
    console.log('\\n=== SIMPLIFIED Frame to Image Conversion ===');
    console.log('[FrameCropper] Input frame bounds:', frameBounds);
    console.log('[FrameCropper] Photo size:', photoSize);
    
    const container = containerSize || { width: screenWidth, height: screenHeight };
    console.log('[FrameCropper] Container size:', container);
    
    // Calculate aspect ratios
    const containerAspect = container.width / container.height;
    const photoAspect = photoSize.width / photoSize.height;
    const aspectDiff = Math.abs(containerAspect - photoAspect);
    
    console.log('[FrameCropper] Container aspect:', containerAspect.toFixed(3));
    console.log('[FrameCropper] Photo aspect:', photoAspect.toFixed(3));
    console.log('[FrameCropper] Aspect difference:', aspectDiff.toFixed(3));
    
    let photoX, photoY, photoWidth, photoHeight;
    
    if (aspectDiff > 0.1) {
      // Significant aspect mismatch - use cover mode scaling
      console.log('[FrameCropper] Using COVER MODE scaling for aspect mismatch');
      
      // Cover mode: scale to fill container, crop excess
      const scaleToFillWidth = container.width / photoSize.width;
      const scaleToFillHeight = container.height / photoSize.height;
      const coverScale = Math.max(scaleToFillWidth, scaleToFillHeight);
      
      // Calculate actual rendered preview size
      const renderedWidth = photoSize.width * coverScale;
      const renderedHeight = photoSize.height * coverScale;
      
      // Calculate centering offset (how much the preview extends beyond container)
      const offsetX = (renderedWidth - container.width) / 2;
      const offsetY = (renderedHeight - container.height) / 2;
      
      console.log('  Cover scale:', coverScale.toFixed(4));
      console.log('  Rendered size:', renderedWidth.toFixed(1), '×', renderedHeight.toFixed(1));
      console.log('  Preview extends beyond container by:', offsetX.toFixed(1), ',', offsetY.toFixed(1));
      console.log('  Frame adjusted for offset: (' + (frameBounds.x + offsetX).toFixed(1) + ', ' + (frameBounds.y + offsetY).toFixed(1) + ')');
      
      // Apply transformation: adjust frame position for the offset, then scale to photo
      const scaleToPhoto = 1 / coverScale;
      photoX = (frameBounds.x + offsetX) * scaleToPhoto;
      photoY = (frameBounds.y + offsetY) * scaleToPhoto;
      photoWidth = frameBounds.width * scaleToPhoto;
      photoHeight = frameBounds.height * scaleToPhoto;
      
    } else {
      // Aspects match - use direct scaling
      console.log('[FrameCropper] Using DIRECT scaling (aspects match)');
      
      const scaleX = photoSize.width / container.width;
      const scaleY = photoSize.height / container.height;
      
      photoX = frameBounds.x * scaleX;
      photoY = frameBounds.y * scaleY;
      photoWidth = frameBounds.width * scaleX;
      photoHeight = frameBounds.height * scaleY;
    }
    
    console.log('[FrameCropper] Calculated photo coords:', {
      x: photoX.toFixed(1),
      y: photoY.toFixed(1),
      width: photoWidth.toFixed(1),
      height: photoHeight.toFixed(1)
    });
    
    // Clamp and validate
    const finalBounds: FrameBounds = {
      x: Math.max(0, Math.round(photoX)),
      y: Math.max(0, Math.round(photoY)),
      width: Math.max(50, Math.min(photoSize.width - Math.max(0, Math.round(photoX)), Math.round(photoWidth))),
      height: Math.max(50, Math.min(photoSize.height - Math.max(0, Math.round(photoY)), Math.round(photoHeight))),
    };
    
    console.log('[FrameCropper] Final bounds:', finalBounds);
    console.log('=== End SIMPLIFIED Frame Conversion ===\\n');
    
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