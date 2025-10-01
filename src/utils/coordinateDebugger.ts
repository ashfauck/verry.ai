/**
 * Coordinate System Debugger
 * 
 * This utility helps diagnose coordinate mapping issues between:
 * - Camera preview space
 * - Screen/overlay space  
 * - Full captured image space
 * - Final cropped output space
 */

import { Dimensions, Platform } from 'react-native';
import { DocumentPoint } from './opencvCropper';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface CoordinateSystemInfo {
  name: string;
  width: number;
  height: number;
  aspectRatio: number;
  pixelDensity?: number;
  description: string;
}

export interface CoordinateDebugData {
  systems: CoordinateSystemInfo[];
  transformations: CoordinateTransformation[];
  validation: CoordinateValidation;
  recommendations: string[];
}

export interface CoordinateTransformation {
  from: string;
  to: string;
  scaleX: number;
  scaleY: number;
  offsetX?: number;
  offsetY?: number;
  method: string;
  description: string;
}

export interface CoordinateValidation {
  issues: string[];
  warnings: string[];
  suggestions: string[];
}

export class CoordinateDebugger {
  
  /**
   * Comprehensive coordinate system analysis
   */
  static analyzeCoordinateSystems(
    previewSize: { width: number; height: number },
    imageSize: { width: number; height: number },
    frameCoordinates: DocumentPoint[],
    actualCameraViewSize?: { width: number; height: number }
  ): CoordinateDebugData {
    
    console.log('\n🔍 === COORDINATE SYSTEM ANALYSIS ===');
    
    // 1. Define all coordinate systems
    const systems: CoordinateSystemInfo[] = [
      {
        name: 'Device Screen',
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        aspectRatio: SCREEN_WIDTH / SCREEN_HEIGHT,
        pixelDensity: Platform.OS === 'ios' ? 2 : undefined,
        description: 'React Native screen dimensions'
      },
      {
        name: 'Preview/Overlay',
        width: previewSize.width,
        height: previewSize.height,
        aspectRatio: previewSize.width / previewSize.height,
        description: 'Camera preview container size where frame is drawn'
      },
      {
        name: 'Captured Image',
        width: imageSize.width,
        height: imageSize.height,
        aspectRatio: imageSize.width / imageSize.height,
        description: 'Full resolution captured photo dimensions'
      }
    ];

    if (actualCameraViewSize) {
      systems.push({
        name: 'Camera View',
        width: actualCameraViewSize.width,
        height: actualCameraViewSize.height,
        aspectRatio: actualCameraViewSize.width / actualCameraViewSize.height,
        description: 'Actual rendered camera view bounds (may differ from preview size)'
      });
    }

    // 2. Calculate transformations
    const transformations = this.calculateTransformations(systems, previewSize, imageSize);
    
    // 3. Validate coordinates and systems
    const validation = this.validateCoordinates(systems, frameCoordinates, previewSize);
    
    // 4. Generate recommendations
    const recommendations = this.generateRecommendations(systems, validation, transformations);
    
    // 5. Log everything
    this.logAnalysis({ systems, transformations, validation, recommendations });
    
    return { systems, transformations, validation, recommendations };
  }
  
  /**
   * Calculate all possible coordinate transformations
   */
  private static calculateTransformations(
    systems: CoordinateSystemInfo[],
    previewSize: { width: number; height: number },
    imageSize: { width: number; height: number }
  ): CoordinateTransformation[] {
    
    const transformations: CoordinateTransformation[] = [];
    
    // Preview to Image (Direct scaling)
    transformations.push({
      from: 'Preview/Overlay',
      to: 'Captured Image',
      scaleX: imageSize.width / previewSize.width,
      scaleY: imageSize.height / previewSize.height,
      method: 'Direct Scaling',
      description: 'Simple proportional scaling from preview to image'
    });
    
    // Screen to Image
    transformations.push({
      from: 'Device Screen',
      to: 'Captured Image',
      scaleX: imageSize.width / SCREEN_WIDTH,
      scaleY: imageSize.height / SCREEN_HEIGHT,
      method: 'Screen-to-Image',
      description: 'Direct scaling from screen coordinates to image'
    });
    
    // Aspect ratio corrected transformations
    const previewAspect = previewSize.width / previewSize.height;
    const imageAspect = imageSize.width / imageSize.height;
    
    if (Math.abs(previewAspect - imageAspect) > 0.01) {
      // Different aspect ratios - need cover/contain calculations
      
      // Cover mode (camera typically uses this)
      const coverScaleX = Math.max(previewSize.width / imageSize.width, previewSize.height / imageSize.height);
      const coverScaleY = coverScaleX;
      const coveredImageWidth = imageSize.width * coverScaleX;
      const coveredImageHeight = imageSize.height * coverScaleY;
      const coverOffsetX = (previewSize.width - coveredImageWidth) / 2;
      const coverOffsetY = (previewSize.height - coveredImageHeight) / 2;
      
      transformations.push({
        from: 'Preview/Overlay',
        to: 'Captured Image',
        scaleX: 1 / coverScaleX,
        scaleY: 1 / coverScaleY,
        offsetX: -coverOffsetX / coverScaleX,
        offsetY: -coverOffsetY / coverScaleY,
        method: 'Cover Mode',
        description: 'Aspect-ratio aware cover mode transformation (most likely correct)'
      });
      
      // Contain mode
      const containScale = Math.min(previewSize.width / imageSize.width, previewSize.height / imageSize.height);
      const containedWidth = imageSize.width * containScale;
      const containedHeight = imageSize.height * containScale;
      const containOffsetX = (previewSize.width - containedWidth) / 2;
      const containOffsetY = (previewSize.height - containedHeight) / 2;
      
      transformations.push({
        from: 'Preview/Overlay',
        to: 'Captured Image',
        scaleX: 1 / containScale,
        scaleY: 1 / containScale,
        offsetX: -containOffsetX / containScale,
        offsetY: -containOffsetY / containScale,
        method: 'Contain Mode',
        description: 'Aspect-ratio aware contain mode transformation'
      });
    }
    
    return transformations;
  }
  
  /**
   * Validate coordinate systems and detect issues
   */
  private static validateCoordinates(
    systems: CoordinateSystemInfo[],
    frameCoordinates: DocumentPoint[],
    previewSize: { width: number; height: number }
  ): CoordinateValidation {
    
    const issues: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    // Check aspect ratios
    const previewSystem = systems.find(s => s.name === 'Preview/Overlay');
    const imageSystem = systems.find(s => s.name === 'Captured Image');
    
    if (previewSystem && imageSystem) {
      const aspectDiff = Math.abs(previewSystem.aspectRatio - imageSystem.aspectRatio);
      if (aspectDiff > 0.1) {
        issues.push(`Significant aspect ratio mismatch: Preview ${previewSystem.aspectRatio.toFixed(3)} vs Image ${imageSystem.aspectRatio.toFixed(3)}`);
        suggestions.push('Use cover/contain mode transformations instead of direct scaling');
      } else if (aspectDiff > 0.01) {
        warnings.push(`Minor aspect ratio difference: ${aspectDiff.toFixed(4)}`);
      }
    }
    
    // Check frame coordinates bounds
    frameCoordinates.forEach((point, index) => {
      if (point.x < 0 || point.x > previewSize.width) {
        issues.push(`Frame point ${index} X coordinate (${point.x}) outside preview width (${previewSize.width})`);
      }
      if (point.y < 0 || point.y > previewSize.height) {
        issues.push(`Frame point ${index} Y coordinate (${point.y}) outside preview height (${previewSize.height})`);
      }
      
      if (point.x < 10 || point.x > previewSize.width - 10) {
        warnings.push(`Frame point ${index} very close to horizontal edge`);
      }
      if (point.y < 10 || point.y > previewSize.height - 10) {
        warnings.push(`Frame point ${index} very close to vertical edge`);
      }
    });
    
    // Check for reasonable frame size
    const frameWidth = Math.max(...frameCoordinates.map(p => p.x)) - Math.min(...frameCoordinates.map(p => p.x));
    const frameHeight = Math.max(...frameCoordinates.map(p => p.y)) - Math.min(...frameCoordinates.map(p => p.y));
    const frameArea = frameWidth * frameHeight;
    const previewArea = previewSize.width * previewSize.height;
    const frameRatio = frameArea / previewArea;
    
    if (frameRatio < 0.1) {
      warnings.push(`Frame covers only ${(frameRatio * 100).toFixed(1)}% of preview area - very small`);
    } else if (frameRatio > 0.9) {
      warnings.push(`Frame covers ${(frameRatio * 100).toFixed(1)}% of preview area - very large`);
    }
    
    // Check coordinate system consistency
    if (previewSize.width === SCREEN_WIDTH && previewSize.height === SCREEN_HEIGHT) {
      suggestions.push('Preview size matches screen size - ensure this is actually the camera preview size, not screen size');
    }
    
    return { issues, warnings, suggestions };
  }
  
  /**
   * Generate specific recommendations for fixing coordinate issues
   */
  private static generateRecommendations(
    systems: CoordinateSystemInfo[],
    validation: CoordinateValidation,
    transformations: CoordinateTransformation[]
  ): string[] {
    
    const recommendations: string[] = [];
    
    // Based on validation issues
    if (validation.issues.some(issue => issue.includes('aspect ratio'))) {
      recommendations.push('🎯 Use the "Cover Mode" transformation instead of direct scaling');
      recommendations.push('📏 Measure the actual camera preview render size, not the container size');
    }
    
    if (validation.issues.some(issue => issue.includes('outside preview'))) {
      recommendations.push('⚠️  Frame coordinates are outside preview bounds - check frame detection logic');
      recommendations.push('🔧 Validate frame coordinates before processing');
    }
    
    // Based on coordinate systems
    const previewSystem = systems.find(s => s.name === 'Preview/Overlay');
    const imageSystem = systems.find(s => s.name === 'Captured Image');
    
    if (previewSystem && imageSystem) {
      const aspectDiff = Math.abs(previewSystem.aspectRatio - imageSystem.aspectRatio);
      
      if (aspectDiff > 0.1) {
        recommendations.push('🎯 LIKELY ISSUE: Camera preview uses "cover" mode scaling');
        recommendations.push('✅ Try the Cover Mode transformation from the analysis above');
        recommendations.push('🔍 Log actual camera view bounds vs container bounds');
      }
    }
    
    // General recommendations
    recommendations.push('📱 Test on multiple devices with different screen sizes and aspect ratios');
    recommendations.push('🎯 Add visual debugging overlay showing transformed coordinates');
    recommendations.push('📊 Log coordinate transformations step by step');
    
    return recommendations;
  }
  
  /**
   * Apply the recommended transformation
   */
  static applyRecommendedTransformation(
    frameCoordinates: DocumentPoint[],
    previewSize: { width: number; height: number },
    imageSize: { width: number; height: number }
  ): { transformedPoints: DocumentPoint[]; method: string; details: any } {
    
    console.log('\n🎯 APPLYING RECOMMENDED TRANSFORMATION');
    
    const previewAspect = previewSize.width / previewSize.height;
    const imageAspect = imageSize.width / imageSize.height;
    const aspectDiff = Math.abs(previewAspect - imageAspect);
    
    let transformedPoints: DocumentPoint[];
    let method: string;
    let details: any;
    
    if (aspectDiff > 0.01) {
      // Use cover mode transformation (most likely correct)
      method = 'Cover Mode (Aspect-Aware)';
      
      // Calculate cover scale - preview fills container by scaling up uniformly
      const scaleToFitWidth = previewSize.width / imageSize.width;
      const scaleToFitHeight = previewSize.height / imageSize.height;
      const coverScale = Math.max(scaleToFitWidth, scaleToFitHeight);
      
      // Calculate actual rendered size and offset
      const renderedWidth = imageSize.width * coverScale;
      const renderedHeight = imageSize.height * coverScale;
      const offsetX = (previewSize.width - renderedWidth) / 2;
      const offsetY = (previewSize.height - renderedHeight) / 2;
      
      details = {
        coverScale,
        renderedWidth: renderedWidth.toFixed(2),
        renderedHeight: renderedHeight.toFixed(2),
        offsetX: offsetX.toFixed(2),
        offsetY: offsetY.toFixed(2),
        scaleToImage: (1 / coverScale).toFixed(4)
      };
      
      // Transform points: subtract offset, then scale to image space
      transformedPoints = frameCoordinates.map(point => ({
        x: Math.round((point.x - offsetX) / coverScale),
        y: Math.round((point.y - offsetY) / coverScale)
      }));
      
    } else {
      // Direct scaling is fine
      method = 'Direct Scaling';
      
      const scaleX = imageSize.width / previewSize.width;
      const scaleY = imageSize.height / previewSize.height;
      
      details = { scaleX, scaleY };
      
      transformedPoints = frameCoordinates.map(point => ({
        x: Math.round(point.x * scaleX),
        y: Math.round(point.y * scaleY)
      }));
    }
    
    console.log(`📐 Method: ${method}`);
    console.log('📊 Details:', details);
    console.log('🔄 Original points:', frameCoordinates);
    console.log('✨ Transformed points:', transformedPoints);
    
    return { transformedPoints, method, details };
  }
  
  /**
   * Visual debugging helper - generates overlay instructions
   */
  static generateDebugOverlay(
    frameCoordinates: DocumentPoint[],
    transformedPoints: DocumentPoint[],
    previewSize: { width: number; height: number },
    imageSize: { width: number; height: number }
  ): string {
    
    return `
// Add this debug overlay to your camera preview:
const debugOverlay = (
  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
    {/* Original frame coordinates */}
    ${frameCoordinates.map((point, i) => `
    <View 
      style={{
        position: 'absolute',
        left: ${point.x - 5},
        top: ${point.y - 5},
        width: 10,
        height: 10,
        backgroundColor: 'red',
        borderRadius: 5,
      }}
    />
    <Text 
      style={{
        position: 'absolute',
        left: ${point.x + 10},
        top: ${point.y - 10},
        color: 'red',
        fontSize: 12,
        fontWeight: 'bold',
      }}
    >
      ${i}
    </Text>`).join('')}
    
    {/* Preview info */}
    <Text style={{
      position: 'absolute',
      top: 20,
      left: 20,
      color: 'white',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: 5,
      fontSize: 10,
    }}>
      Preview: ${previewSize.width} × ${previewSize.height}{'\n'}
      Image: ${imageSize.width} × ${imageSize.height}{'\n'}
      Transform: Cover Mode
    </Text>
  </View>
);`;
  }
  
  /**
   * Log complete analysis
   */
  private static logAnalysis(data: CoordinateDebugData): void {
    console.log('\n📊 COORDINATE SYSTEMS:');
    data.systems.forEach(system => {
      console.log(`  ${system.name}: ${system.width} × ${system.height} (AR: ${system.aspectRatio.toFixed(3)})`);
      console.log(`    ${system.description}`);
    });
    
    console.log('\n🔄 TRANSFORMATIONS:');
    data.transformations.forEach(transform => {
      console.log(`  ${transform.from} → ${transform.to}: ${transform.method}`);
      console.log(`    Scale: X=${transform.scaleX.toFixed(4)}, Y=${transform.scaleY.toFixed(4)}`);
      if (transform.offsetX !== undefined) {
        console.log(`    Offset: X=${transform.offsetX.toFixed(2)}, Y=${transform.offsetY?.toFixed(2)}`);
      }
      console.log(`    ${transform.description}`);
    });
    
    console.log('\n⚠️  VALIDATION:');
    if (data.validation.issues.length > 0) {
      console.log('  ISSUES:');
      data.validation.issues.forEach(issue => console.log(`    ❌ ${issue}`));
    }
    if (data.validation.warnings.length > 0) {
      console.log('  WARNINGS:');
      data.validation.warnings.forEach(warning => console.log(`    ⚠️  ${warning}`));
    }
    
    console.log('\n💡 RECOMMENDATIONS:');
    data.recommendations.forEach(rec => console.log(`  ${rec}`));
    console.log('\n🔍 === ANALYSIS COMPLETE ===\n');
  }
}

/**
 * Quick debug function for immediate use
 */
export const debugCoordinates = (
  frameCoordinates: DocumentPoint[],
  previewSize: { width: number; height: number },
  imageSize: { width: number; height: number }
) => {
  const analysis = CoordinateDebugger.analyzeCoordinateSystems(
    previewSize,
    imageSize,
    frameCoordinates
  );
  
  const recommended = CoordinateDebugger.applyRecommendedTransformation(
    frameCoordinates,
    previewSize,
    imageSize
  );
  
  console.log('\n🎯 QUICK RECOMMENDATION:');
  console.log('Use these transformed coordinates for cropping:');
  console.log(recommended.transformedPoints);
  console.log(`Method: ${recommended.method}`);
  
  return {
    analysis,
    recommendedTransform: recommended,
    debugOverlay: CoordinateDebugger.generateDebugOverlay(
      frameCoordinates,
      recommended.transformedPoints,
      previewSize,
      imageSize
    )
  };
};