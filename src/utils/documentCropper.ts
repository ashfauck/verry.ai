import {Platform, Dimensions} from 'react-native';
import ImageEditor from '@react-native-community/image-editor';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

export interface CropBounds {
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
 * Enhanced document cropping utility that reliably crops images based on detection bounds
 */
export class DocumentCropper {
  
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
   * Convert screen coordinates to image coordinates with camera preview compensation
   */
  private static convertScreenToImageCoordinates(
    screenBounds: CropBounds,
    photoSize: PhotoSize
  ): CropBounds {
    // Basic scale factors
    let scaleX = photoSize.width / screenWidth;
    let scaleY = photoSize.height / screenHeight;
    
    // Account for camera preview scaling
    // Camera preview often crops or scales to fit screen aspect ratio
    const screenAspect = screenWidth / screenHeight;
    const photoAspect = photoSize.width / photoSize.height;
    
    console.log('[CameraCoords] Screen aspect:', screenAspect.toFixed(3));
    console.log('[CameraCoords] Photo aspect:', photoAspect.toFixed(3));
    
    // If aspects don't match, camera preview is likely cropped/scaled
    if (Math.abs(screenAspect - photoAspect) > 0.1) {
      console.log('[CameraCoords] Aspect ratio mismatch detected - applying compensation');
      
      if (photoAspect > screenAspect) {
        // Photo is wider - camera preview likely crops width
        // Scale based on height, then center the width
        const heightBasedScale = photoSize.height / screenHeight;
        const effectivePhotoWidth = screenWidth * heightBasedScale;
        const widthOffset = (photoSize.width - effectivePhotoWidth) / 2;
        
        scaleX = heightBasedScale;
        scaleY = heightBasedScale;
        
        console.log('[CameraCoords] Width-cropped preview compensation:');
        console.log('  Scale:', heightBasedScale);
        console.log('  Width offset:', widthOffset);
        
        return {
          x: Math.max(0, Math.round(screenBounds.x * scaleX + widthOffset)),
          y: Math.max(0, Math.round(screenBounds.y * scaleY)),
          width: Math.min(photoSize.width, Math.round(screenBounds.width * scaleX)),
          height: Math.min(photoSize.height, Math.round(screenBounds.height * scaleY)),
        };
      } else {
        // Photo is taller - camera preview likely crops height
        // Scale based on width, then center the height
        const widthBasedScale = photoSize.width / screenWidth;
        const effectivePhotoHeight = screenHeight * widthBasedScale;
        const heightOffset = (photoSize.height - effectivePhotoHeight) / 2;
        
        scaleX = widthBasedScale;
        scaleY = widthBasedScale;
        
        console.log('[CameraCoords] Height-cropped preview compensation:');
        console.log('  Scale:', widthBasedScale);
        console.log('  Height offset:', heightOffset);
        
        return {
          x: Math.max(0, Math.round(screenBounds.x * scaleX)),
          y: Math.max(0, Math.round(screenBounds.y * scaleY + heightOffset)),
          width: Math.min(photoSize.width, Math.round(screenBounds.width * scaleX)),
          height: Math.min(photoSize.height, Math.round(screenBounds.height * scaleY)),
        };
      }
    }
    
    console.log('[CameraCoords] Using simple scaling - aspects match');
    
    return {
      x: Math.max(0, Math.round(screenBounds.x * scaleX)),
      y: Math.max(0, Math.round(screenBounds.y * scaleY)),
      width: Math.min(photoSize.width, Math.round(screenBounds.width * scaleX)),
      height: Math.min(photoSize.height, Math.round(screenBounds.height * scaleY)),
    };
  }

  /**
   * Validate crop dimensions to ensure they're reasonable
   */
  private static validateCropDimensions(cropBounds: CropBounds, photoSize: PhotoSize): boolean {
    // Check minimum dimensions (at least 50px in each dimension)
    if (cropBounds.width < 50 || cropBounds.height < 50) {
      console.warn('[DocumentCropper] Crop dimensions too small:', cropBounds);
      return false;
    }

    // Check maximum dimensions (don't exceed photo bounds)
    if (cropBounds.x + cropBounds.width > photoSize.width ||
        cropBounds.y + cropBounds.height > photoSize.height) {
      console.warn('[DocumentCropper] Crop bounds exceed photo dimensions:', {
        cropBounds,
        photoSize,
      });
      return false;
    }

    // Check minimum area (at least 1% of the original image)
    const cropArea = cropBounds.width * cropBounds.height;
    const photoArea = photoSize.width * photoSize.height;
    const areaRatio = cropArea / photoArea;
    
    if (areaRatio < 0.01) {
      console.warn('[DocumentCropper] Crop area too small:', {
        cropArea,
        photoArea,
        areaRatio,
      });
      return false;
    }

    return true;
  }

  /**
   * Add padding around crop bounds to ensure document edges aren't cut off
   */
  private static addPaddingToBounds(
    cropBounds: CropBounds,
    photoSize: PhotoSize,
    paddingPercent: number = 0.05
  ): CropBounds {
    const paddingX = Math.round(cropBounds.width * paddingPercent);
    const paddingY = Math.round(cropBounds.height * paddingPercent);

    return {
      x: Math.max(0, cropBounds.x - paddingX),
      y: Math.max(0, cropBounds.y - paddingY),
      width: Math.min(
        photoSize.width - Math.max(0, cropBounds.x - paddingX),
        cropBounds.width + (paddingX * 2)
      ),
      height: Math.min(
        photoSize.height - Math.max(0, cropBounds.y - paddingY),
        cropBounds.height + (paddingY * 2)
      ),
    };
  }

  /**
   * Main cropping function that handles all edge cases and provides reliable results
   */
  static async cropDocumentImage(
    imageUri: string,
    screenBounds: CropBounds,
    photoSize: PhotoSize,
    options: {
      addPadding?: boolean;
      paddingPercent?: number;
      quality?: number;
    } = {}
  ): Promise<CropResult> {
    const {
      addPadding = true,
      paddingPercent = 0.05,
      quality = 0.9,
    } = options;

    try {
      const normalizedUri = this.normalizeUri(imageUri);
      
      console.log('\n=== DocumentCropper Debug ===');
      console.log('[DocumentCropper] Input URI:', normalizedUri);
      console.log('[DocumentCropper] Screen dimensions:', { screenWidth, screenHeight });
      console.log('[DocumentCropper] Screen bounds (blue box):', screenBounds);
      console.log('[DocumentCropper] Photo size (actual image):', photoSize);
      
      // Calculate scale factors
      const scaleX = photoSize.width / screenWidth;
      const scaleY = photoSize.height / screenHeight;
      console.log('[DocumentCropper] Scale factors:', { scaleX, scaleY });

      // Convert screen coordinates to image coordinates
      let imageBounds = this.convertScreenToImageCoordinates(screenBounds, photoSize);
      console.log('[DocumentCropper] Image bounds (after conversion):', imageBounds);
      console.log('[DocumentCropper] Conversion check:');
      console.log('  Screen X:', screenBounds.x, '-> Image X:', imageBounds.x, '(', screenBounds.x, '*', scaleX, ')');
      console.log('  Screen Y:', screenBounds.y, '-> Image Y:', imageBounds.y, '(', screenBounds.y, '*', scaleY, ')');

      // Add padding if requested
      if (addPadding) {
        imageBounds = this.addPaddingToBounds(imageBounds, photoSize, paddingPercent);
        console.log('[DocumentCropper] Bounds with padding:', imageBounds);
      }

      // Validate crop dimensions
      if (!this.validateCropDimensions(imageBounds, photoSize)) {
        return {
          success: false,
          croppedUri: normalizedUri,
          error: 'Invalid crop dimensions',
        };
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

      console.log('[DocumentCropper] Final crop data for ImageEditor:', cropData);
      console.log('[DocumentCropper] Crop area check:');
      console.log('  Crop area:', cropData.size.width * cropData.size.height, 'pixels');
      console.log('  Photo area:', photoSize.width * photoSize.height, 'pixels');
      console.log('  Area ratio:', (cropData.size.width * cropData.size.height) / (photoSize.width * photoSize.height));
      console.log('=== End DocumentCropper Debug ===\n');

      // Perform the crop
      const result = await ImageEditor.cropImage(normalizedUri, cropData);
      const croppedUri = typeof result === 'string' ? result : result.uri;
      const finalUri = this.normalizeUri(croppedUri);

      console.log('[DocumentCropper] Crop successful:', finalUri);

      return {
        success: true,
        croppedUri: finalUri,
      };

    } catch (error) {
      console.error('[DocumentCropper] Crop failed:', error);
      
      return {
        success: false,
        croppedUri: this.normalizeUri(imageUri),
        error: `Crop failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Create a fallback cropped version using center crop if detection bounds are invalid
   */
  static async createFallbackCrop(
    imageUri: string,
    photoSize: PhotoSize,
    aspectRatio: number = 1.6 // ID card aspect ratio
  ): Promise<CropResult> {
    try {
      // Calculate center crop dimensions maintaining aspect ratio
      const targetWidth = Math.min(photoSize.width * 0.8, photoSize.height * aspectRatio * 0.8);
      const targetHeight = targetWidth / aspectRatio;

      const centerBounds: CropBounds = {
        x: (photoSize.width - targetWidth) / 2,
        y: (photoSize.height - targetHeight) / 2,
        width: targetWidth,
        height: targetHeight,
      };

      console.log('[DocumentCropper] Creating fallback crop with bounds:', centerBounds);

      return await this.cropDocumentImage(
        imageUri,
        centerBounds,
        photoSize,
        { addPadding: false }
      );

    } catch (error) {
      console.error('[DocumentCropper] Fallback crop failed:', error);
      
      return {
        success: false,
        croppedUri: this.normalizeUri(imageUri),
        error: `Fallback crop failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}