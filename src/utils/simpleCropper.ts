import { Platform } from 'react-native';
import ImageEditor from '@react-native-community/image-editor';

/**
 * SIMPLE DIRECT CROPPER
 * 
 * This cropper uses the most basic approach: direct proportional scaling
 * from screen coordinates to photo coordinates without any complex transformations.
 */

export interface SimpleCropBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SimpleCropResult {
  success: boolean;
  croppedUri: string;
  error?: string;
  debugInfo?: {
    inputBounds: SimpleCropBounds;
    screenSize: { width: number; height: number };
    photoSize: { width: number; height: number };
    scaleFactors: { x: number; y: number };
    finalCropBounds: SimpleCropBounds;
    cropAreaPercent: number;
  };
}

export class SimpleCropper {
  
  private static normalizeUri(uri: string): string {
    if (!uri) return uri;
    if (uri.startsWith('http')) return uri;
    if (Platform.OS === 'ios' && !uri.startsWith('file://')) {
      return `file://${uri}`;
    }
    return uri;
  }

  /**
   * Crop image using simple direct proportional scaling
   * This is the most straightforward approach - what you see is what you get
   */
  static async cropToBlueFrame(
    imageUri: string,
    blueDottedFrameBounds: SimpleCropBounds,
    screenSize: { width: number; height: number },
    photoSize: { width: number; height: number }
  ): Promise<SimpleCropResult> {
    
    console.log('\\n🔵 === SIMPLE BLUE FRAME CROPPER ===');
    console.log('📸 Photo size:', photoSize);
    console.log('📱 Screen size:', screenSize);
    console.log('🔵 Blue frame bounds:', blueDottedFrameBounds);
    
    try {
      // Step 1: Calculate direct scale factors
      const scaleX = photoSize.width / screenSize.width;
      const scaleY = photoSize.height / screenSize.height;
      
      console.log('📏 Scale factors:');
      console.log('  X-scale:', scaleX.toFixed(4), `(${photoSize.width} / ${screenSize.width})`);
      console.log('  Y-scale:', scaleY.toFixed(4), `(${photoSize.height} / ${screenSize.height})`);
      
      // Step 2: Apply scaling directly to blue frame coordinates
      const cropBounds: SimpleCropBounds = {
        x: Math.round(blueDottedFrameBounds.x * scaleX),
        y: Math.round(blueDottedFrameBounds.y * scaleY),
        width: Math.round(blueDottedFrameBounds.width * scaleX),
        height: Math.round(blueDottedFrameBounds.height * scaleY)
      };
      
      console.log('✂️ Calculated crop bounds in photo:');
      console.log('  Position: (', cropBounds.x, ',', cropBounds.y, ')');
      console.log('  Size: ', cropBounds.width, 'x', cropBounds.height);
      
      // Step 3: Validate bounds
      if (cropBounds.x < 0 || cropBounds.y < 0 || 
          cropBounds.x + cropBounds.width > photoSize.width ||
          cropBounds.y + cropBounds.height > photoSize.height) {
        
        console.warn('⚠️ Crop bounds exceed photo boundaries, clamping...');
        
        cropBounds.x = Math.max(0, cropBounds.x);
        cropBounds.y = Math.max(0, cropBounds.y);
        cropBounds.width = Math.min(cropBounds.width, photoSize.width - cropBounds.x);
        cropBounds.height = Math.min(cropBounds.height, photoSize.height - cropBounds.y);
        
        console.log('  Clamped to:', cropBounds);
      }
      
      // Step 4: Calculate crop area percentage
      const cropArea = cropBounds.width * cropBounds.height;
      const photoArea = photoSize.width * photoSize.height;
      const cropPercent = (cropArea / photoArea) * 100;
      
      console.log('📊 Crop statistics:');
      console.log('  Crop area:', cropArea.toLocaleString(), 'pixels');
      console.log('  Photo area:', photoArea.toLocaleString(), 'pixels');
      console.log('  Crop percentage:', cropPercent.toFixed(2) + '%');
      
      // Step 5: Perform the actual crop
      const normalizedUri = this.normalizeUri(imageUri);
      
      const cropData = {
        offset: {
          x: cropBounds.x,
          y: cropBounds.y,
        },
        size: {
          width: cropBounds.width,
          height: cropBounds.height,
        },
      };
      
      console.log('🔧 ImageEditor crop data:', cropData);
      
      const result = await ImageEditor.cropImage(normalizedUri, cropData);
      const croppedUri = typeof result === 'string' ? result : result.uri;
      const finalUri = this.normalizeUri(croppedUri);
      
      console.log('✅ Simple cropping successful!');
      console.log('📁 Cropped image:', finalUri);
      console.log('🔵 === END SIMPLE CROPPER ===\\n');
      
      return {
        success: true,
        croppedUri: finalUri,
        debugInfo: {
          inputBounds: blueDottedFrameBounds,
          screenSize,
          photoSize,
          scaleFactors: { x: scaleX, y: scaleY },
          finalCropBounds: cropBounds,
          cropAreaPercent: cropPercent
        }
      };
      
    } catch (error) {
      console.error('❌ Simple cropping failed:', error);
      
      return {
        success: false,
        croppedUri: this.normalizeUri(imageUri),
        error: `Simple crop failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Debug helper to visualize the coordinate transformation
   */
  static debugCoordinateTransformation(
    blueDottedFrameBounds: SimpleCropBounds,
    screenSize: { width: number; height: number },
    photoSize: { width: number; height: number }
  ) {
    console.log('\\n🔍 === DEBUG COORDINATE TRANSFORMATION ===');
    
    const scaleX = photoSize.width / screenSize.width;
    const scaleY = photoSize.height / screenSize.height;
    
    console.log('📱 Screen dimensions:', screenSize);
    console.log('📸 Photo dimensions:', photoSize);
    console.log('📏 Scale factors: X=' + scaleX.toFixed(4) + ', Y=' + scaleY.toFixed(4));
    
    console.log('\\n🔵 Blue frame transformation:');
    console.log('  Screen position: (' + blueDottedFrameBounds.x + ', ' + blueDottedFrameBounds.y + ')');
    console.log('  Photo position: (' + Math.round(blueDottedFrameBounds.x * scaleX) + ', ' + Math.round(blueDottedFrameBounds.y * scaleY) + ')');
    
    console.log('\\n📐 Size transformation:');
    console.log('  Screen size: ' + blueDottedFrameBounds.width + ' x ' + blueDottedFrameBounds.height);
    console.log('  Photo size: ' + Math.round(blueDottedFrameBounds.width * scaleX) + ' x ' + Math.round(blueDottedFrameBounds.height * scaleY));
    
    const cropArea = Math.round(blueDottedFrameBounds.width * scaleX) * Math.round(blueDottedFrameBounds.height * scaleY);
    const photoArea = photoSize.width * photoSize.height;
    const percentage = (cropArea / photoArea) * 100;
    
    console.log('\\n📊 Expected results:');
    console.log('  Crop area:', cropArea.toLocaleString(), 'pixels');
    console.log('  Percentage of photo:', percentage.toFixed(2) + '%');
    console.log('🔍 === END DEBUG ===\\n');
  }
}