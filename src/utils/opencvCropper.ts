import { Platform } from 'react-native';
import { Mat, CvType, Size, Point2 } from 'react-native-fast-opencv';
import RNFS from 'react-native-fs';
import { debugCoordinates, CoordinateDebugger } from './coordinateDebugger';

/**
 * OpenCV-based Document Cropper with Perspective Transformation
 * 
 * This implements the exact solution you described:
 * - Takes 4 polygon points and full-size image
 * - Uses OpenCV getPerspectiveTransform + warpPerspective  
 * - Maintains proper document aspect ratio
 * - Works on both iOS and Android
 */

export interface DocumentPoint {
  x: number;
  y: number;
}

export interface OpenCVCropResult {
  success: boolean;
  croppedImagePath: string;
  error?: string;
  metadata?: {
    originalSize: { width: number; height: number };
    croppedSize: { width: number; height: number };
    polygonPoints: DocumentPoint[];
    orderedPoints: DocumentPoint[];
  };
}

export class OpenCVDocumentCropper {

  /**
   * Order polygon points in clockwise order: topLeft, topRight, bottomRight, bottomLeft
   */
  private static orderPoints(points: DocumentPoint[]): DocumentPoint[] {
    if (points.length !== 4) {
      throw new Error('Polygon must have exactly 4 points');
    }

    console.log('🔄 Ordering polygon points...');
    console.log('Input points:', points);

    // Sort by y-coordinate (top points first)
    const sorted = [...points].sort((a, b) => a.y - b.y);
    
    // Get top two points and sort by x-coordinate (left first)
    const topPoints = sorted.slice(0, 2).sort((a, b) => a.x - b.x);
    const topLeft = topPoints[0];
    const topRight = topPoints[1];
    
    // Get bottom two points and sort by x-coordinate (left first) 
    const bottomPoints = sorted.slice(2).sort((a, b) => a.x - b.x);
    const bottomLeft = bottomPoints[0];
    const bottomRight = bottomPoints[1];
    
    const orderedPoints = [topLeft, topRight, bottomRight, bottomLeft];
    console.log('✅ Ordered points (TL, TR, BR, BL):', orderedPoints);
    
    return orderedPoints;
  }

  /**
   * Calculate optimal output dimensions based on polygon edge lengths
   */
  private static calculateOutputDimensions(orderedPoints: DocumentPoint[]): { width: number; height: number } {
    const [topLeft, topRight, bottomRight, bottomLeft] = orderedPoints;

    // Calculate width as the maximum of top and bottom edges
    const topWidth = Math.hypot(topRight.x - topLeft.x, topRight.y - topLeft.y);
    const bottomWidth = Math.hypot(bottomRight.x - bottomLeft.x, bottomRight.y - bottomLeft.y);
    const maxWidth = Math.max(topWidth, bottomWidth);

    // Calculate height as the maximum of left and right edges  
    const leftHeight = Math.hypot(bottomLeft.x - topLeft.x, bottomLeft.y - topLeft.y);
    const rightHeight = Math.hypot(bottomRight.x - topRight.x, bottomRight.y - topRight.y);
    const maxHeight = Math.max(leftHeight, rightHeight);

    const dimensions = {
      width: Math.round(maxWidth),
      height: Math.round(maxHeight)
    };

    console.log('📐 Calculated output dimensions:');
    console.log('  Top width:', topWidth.toFixed(1), 'Bottom width:', bottomWidth.toFixed(1));
    console.log('  Left height:', leftHeight.toFixed(1), 'Right height:', rightHeight.toFixed(1));  
    console.log('  Final size:', dimensions);

    return dimensions;
  }

  /**
   * Main function to crop document using OpenCV perspective transformation
   */
  static async cropDocument(
    imagePath: string,
    polygon: DocumentPoint[]
  ): Promise<OpenCVCropResult> {
    
    console.log('\\n🎯 === OpenCV Document Cropping Started ===');
    console.log('📸 Image path:', imagePath);
    console.log('📐 Polygon points:', polygon);

    try {
      // Step 1: Validate and order polygon points
      if (!polygon || polygon.length !== 4) {
        throw new Error('Invalid polygon: must have exactly 4 points');
      }

      const orderedPoints = this.orderPoints(polygon);
      
      // Step 2: Calculate optimal output dimensions based on polygon
      const outputDimensions = this.calculateOutputDimensions(orderedPoints);
      
      // Step 3: Load the source image
      console.log('📂 Loading source image...');
      const srcMat = await Mat.fromUri(imagePath);
      const originalSize = { width: srcMat.cols, height: srcMat.rows };
      
      console.log('📏 Original image size:', originalSize);

      // Step 4: Prepare source points (from ordered polygon)
      const srcPoints = [
        new Point2(orderedPoints[0].x, orderedPoints[0].y), // Top-left
        new Point2(orderedPoints[1].x, orderedPoints[1].y), // Top-right  
        new Point2(orderedPoints[2].x, orderedPoints[2].y), // Bottom-right
        new Point2(orderedPoints[3].x, orderedPoints[3].y)  // Bottom-left
      ];

      // Step 5: Prepare destination points (perfect rectangle)
      const dstPoints = [
        new Point2(0, 0),                                           // Top-left
        new Point2(outputDimensions.width - 1, 0),                  // Top-right
        new Point2(outputDimensions.width - 1, outputDimensions.height - 1), // Bottom-right
        new Point2(0, outputDimensions.height - 1)                  // Bottom-left
      ];

      console.log('🎯 Source points:', srcPoints);
      console.log('🎯 Destination points:', dstPoints);

      // Step 6: Calculate perspective transformation matrix
      console.log('⚙️ Calculating perspective transformation matrix...');
      const transformMatrix = Mat.getPerspectiveTransform(srcPoints, dstPoints);
      
      // Step 7: Apply perspective transformation
      console.log('🔄 Applying perspective transformation...');
      const outputSize = new Size(outputDimensions.width, outputDimensions.height);
      const warpedMat = srcMat.warpPerspective(transformMatrix, outputSize);
      
      // Step 8: Save the result to a temporary file
      const timestamp = Date.now();
      const outputFileName = `cropped_document_${timestamp}.jpg`;
      const outputPath = Platform.OS === 'ios' 
        ? `${RNFS.TemporaryDirectoryPath}/${outputFileName}`
        : `${RNFS.CachesDirectoryPath}/${outputFileName}`;
      
      console.log('💾 Saving cropped image to:', outputPath);
      await warpedMat.saveImage(outputPath, 95); // 95% JPEG quality
      
      // Step 9: Clean up matrices
      srcMat.release();
      warpedMat.release();
      transformMatrix.release();
      
      console.log('✅ OpenCV document cropping successful!');
      console.log('📁 Output path:', outputPath);
      console.log('🎯 === OpenCV Document Cropping Complete ===\\n');

      return {
        success: true,
        croppedImagePath: outputPath,
        metadata: {
          originalSize,
          croppedSize: outputDimensions,
          polygonPoints: polygon,
          orderedPoints
        }
      };

    } catch (error) {
      console.error('❌ OpenCV document cropping failed:', error);
      
      return {
        success: false,
        croppedImagePath: imagePath, // Return original as fallback
        error: `OpenCV crop failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Scale polygon points from preview/frame space to full image space
   * Now uses advanced coordinate debugging and transformation
   */
  static scalePolygonToImageSpace(
    previewPolygon: DocumentPoint[],
    previewSize: { width: number; height: number },
    imageSize: { width: number; height: number },
    useAdvancedTransform: boolean = true
  ): DocumentPoint[] {
    
    if (useAdvancedTransform) {
      console.log('🎯 Using advanced coordinate transformation with debugging...');
      
      // Use the coordinate debugger to find the best transformation
      const debugResult = debugCoordinates(previewPolygon, previewSize, imageSize);
      
      // Return the recommended transformation
      return debugResult.recommendedTransform.transformedPoints;
    } else {
      // Fallback to simple scaling
      const scaleX = imageSize.width / previewSize.width;
      const scaleY = imageSize.height / previewSize.height;
      
      console.log('🔍 Using simple scaling transformation:');
      console.log('  Preview size:', previewSize);
      console.log('  Image size:', imageSize); 
      console.log('  Scale factors: X=' + scaleX.toFixed(4) + ', Y=' + scaleY.toFixed(4));
      
      const scaledPolygon = previewPolygon.map((point, index) => ({
        x: Math.round(point.x * scaleX),
        y: Math.round(point.y * scaleY)
      }));
      
      console.log('  Original polygon:', previewPolygon);
      console.log('  Scaled polygon:', scaledPolygon);
      
      return scaledPolygon;
    }
  }

  /**
   * Debug helper to validate polygon points
   */
  static validatePolygon(
    polygon: DocumentPoint[],
    imageSize: { width: number; height: number }
  ): { valid: boolean; issues: string[] } {
    
    const issues: string[] = [];
    
    if (!polygon || polygon.length !== 4) {
      issues.push('Polygon must have exactly 4 points');
      return { valid: false, issues };
    }
    
    // Check if all points are within image bounds
    polygon.forEach((point, index) => {
      if (point.x < 0 || point.x >= imageSize.width) {
        issues.push(`Point ${index} X coordinate (${point.x}) is outside image width (${imageSize.width})`);
      }
      if (point.y < 0 || point.y >= imageSize.height) {
        issues.push(`Point ${index} Y coordinate (${point.y}) is outside image height (${imageSize.height})`);
      }
      if (typeof point.x !== 'number' || typeof point.y !== 'number' || isNaN(point.x) || isNaN(point.y)) {
        issues.push(`Point ${index} has invalid coordinates: (${point.x}, ${point.y})`);
      }
    });
    
    // Check for minimum area (polygon shouldn't be too small)
    const orderedPoints = this.orderPoints(polygon);
    const dimensions = this.calculateOutputDimensions(orderedPoints);
    if (dimensions.width < 50 || dimensions.height < 50) {
      issues.push('Polygon area is too small (minimum 50x50 pixels)');
    }
    
    return { valid: issues.length === 0, issues };
  }
}

// Re-export for convenience
export const cropDocument = OpenCVDocumentCropper.cropDocument.bind(OpenCVDocumentCropper);
export const scalePolygonToImageSpace = OpenCVDocumentCropper.scalePolygonToImageSpace.bind(OpenCVDocumentCropper);
export const validatePolygon = OpenCVDocumentCropper.validatePolygon.bind(OpenCVDocumentCropper);