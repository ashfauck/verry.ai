import {Dimensions} from 'react-native';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

export interface CoordinateSystemInfo {
  name: string;
  width: number;
  height: number;
  aspectRatio: number;
}

export interface BoundsInfo {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  right: number;
  bottom: number;
}

/**
 * Utility to validate and debug coordinate system conversions
 */
export class CoordinateValidator {
  
  static getSystemInfo(width: number, height: number, name: string): CoordinateSystemInfo {
    return {
      name,
      width,
      height,
      aspectRatio: width / height,
    };
  }

  static getBoundsInfo(bounds: {x: number; y: number; width: number; height: number}): BoundsInfo {
    return {
      ...bounds,
      centerX: bounds.x + bounds.width / 2,
      centerY: bounds.y + bounds.height / 2,
      right: bounds.x + bounds.width,
      bottom: bounds.y + bounds.height,
    };
  }

  static validateConversion(
    sourceBounds: {x: number; y: number; width: number; height: number},
    sourceSystem: CoordinateSystemInfo,
    targetBounds: {x: number; y: number; width: number; height: number},
    targetSystem: CoordinateSystemInfo
  ): boolean {
    const scaleX = targetSystem.width / sourceSystem.width;
    const scaleY = targetSystem.height / sourceSystem.height;
    
    const expectedX = sourceBounds.x * scaleX;
    const expectedY = sourceBounds.y * scaleY;
    const expectedWidth = sourceBounds.width * scaleX;
    const expectedHeight = sourceBounds.height * scaleY;
    
    const tolerance = 1; // 1 pixel tolerance
    
    const isValid = (
      Math.abs(targetBounds.x - expectedX) <= tolerance &&
      Math.abs(targetBounds.y - expectedY) <= tolerance &&
      Math.abs(targetBounds.width - expectedWidth) <= tolerance &&
      Math.abs(targetBounds.height - expectedHeight) <= tolerance
    );
    
    if (!isValid) {
      console.error('Coordinate conversion validation failed:');
      console.error('Source system:', sourceSystem);
      console.error('Target system:', targetSystem);
      console.error('Scale factors:', { scaleX, scaleY });
      console.error('Source bounds:', sourceBounds);
      console.error('Expected target bounds:', {
        x: expectedX,
        y: expectedY,
        width: expectedWidth,
        height: expectedHeight,
      });
      console.error('Actual target bounds:', targetBounds);
    }
    
    return isValid;
  }

  static debugCoordinateFlow(
    detectionBounds: {x: number; y: number; width: number; height: number},
    frameSize: {width: number; height: number},
    screenBounds: {x: number; y: number; width: number; height: number},
    photoSize: {width: number; height: number},
    finalCropBounds: {x: number; y: number; width: number; height: number}
  ) {
    console.log('\\n=== COORDINATE SYSTEM FLOW DEBUG ===');
    
    const frameSystem = this.getSystemInfo(frameSize.width, frameSize.height, 'Camera Frame');
    const screenSystem = this.getSystemInfo(screenWidth, screenHeight, 'Screen Display');
    const photoSystem = this.getSystemInfo(photoSize.width, photoSize.height, 'Photo/Image');
    
    console.log('1. Frame System (Detection):', frameSystem);
    console.log('   Detection bounds:', this.getBoundsInfo(detectionBounds));
    
    console.log('\\n2. Screen System (Blue Box Display):', screenSystem);
    console.log('   Screen bounds:', this.getBoundsInfo(screenBounds));
    
    // Validate frame to screen conversion
    const frameToScreenValid = this.validateConversion(detectionBounds, frameSystem, screenBounds, screenSystem);
    console.log('   Frame->Screen conversion valid:', frameToScreenValid);
    
    console.log('\\n3. Photo System (Actual Crop):', photoSystem);
    console.log('   Final crop bounds:', this.getBoundsInfo(finalCropBounds));
    
    // Validate screen to photo conversion  
    const screenToPhotoValid = this.validateConversion(screenBounds, screenSystem, finalCropBounds, photoSystem);
    console.log('   Screen->Photo conversion valid:', screenToPhotoValid);
    
    // Show relative positioning
    const detectionCenter = {
      x: (detectionBounds.x + detectionBounds.width / 2) / frameSize.width,
      y: (detectionBounds.y + detectionBounds.height / 2) / frameSize.height,
    };
    const screenCenter = {
      x: (screenBounds.x + screenBounds.width / 2) / screenWidth,
      y: (screenBounds.y + screenBounds.height / 2) / screenHeight,
    };
    const cropCenter = {
      x: (finalCropBounds.x + finalCropBounds.width / 2) / photoSize.width,
      y: (finalCropBounds.y + finalCropBounds.height / 2) / photoSize.height,
    };
    
    console.log('\\n4. Relative Centers (should be equal):');
    console.log('   Detection center (%):', detectionCenter);
    console.log('   Screen center (%):', screenCenter);
    console.log('   Crop center (%):', cropCenter);
    
    const centerDrift = Math.sqrt(
      Math.pow(detectionCenter.x - cropCenter.x, 2) + 
      Math.pow(detectionCenter.y - cropCenter.y, 2)
    );
    console.log('   Center drift:', centerDrift.toFixed(4), centerDrift < 0.01 ? '✅' : '❌');
    
    console.log('=== END COORDINATE FLOW DEBUG ===\\n');
    
    return {
      frameToScreenValid,
      screenToPhotoValid,
      centerDrift,
      allValid: frameToScreenValid && screenToPhotoValid && centerDrift < 0.01,
    };
  }
}