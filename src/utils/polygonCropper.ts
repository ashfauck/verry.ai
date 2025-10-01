import { Platform } from 'react-native';
import ImageEditor from '@react-native-community/image-editor';

/**
 * Point interface for polygon coordinates
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Result of polygon cropping operation
 */
export interface PolygonCropResult {
  success: boolean;
  croppedUri: string;
  error?: string;
  metadata?: {
    originalSize: { width: number; height: number };
    croppedSize: { width: number; height: number };
    perspectiveApplied: boolean;
  };
}

/**
 * Configuration options for polygon cropping
 */
export interface PolygonCropOptions {
  outputWidth?: number; // Target width for the output document
  outputHeight?: number; // Target height for the output document
  padding?: number; // Padding in pixels around the document
  quality?: number; // JPEG quality (0.0 to 1.0)
  format?: 'JPEG' | 'PNG';
}

/**
 * Utility functions for polygon operations
 */
class PolygonUtils {
  /**
   * Calculate the distance between two points
   */
  static distance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  /**
   * Order polygon points in clockwise order starting from top-left
   */
  static orderPoints(points: Point[]): Point[] {
    if (points.length !== 4) {
      throw new Error('Polygon must have exactly 4 points');
    }

    // Find the centroid
    const centroidX = points.reduce((sum, p) => sum + p.x, 0) / 4;
    const centroidY = points.reduce((sum, p) => sum + p.y, 0) / 4;

    // Sort points by angle from centroid
    const sortedPoints = points.map(point => ({
      ...point,
      angle: Math.atan2(point.y - centroidY, point.x - centroidX)
    })).sort((a, b) => a.angle - b.angle);

    // Find top-left point (minimum sum of x + y)
    let minSum = Infinity;
    let topLeftIndex = 0;
    
    sortedPoints.forEach((point, index) => {
      const sum = point.x + point.y;
      if (sum < minSum) {
        minSum = sum;
        topLeftIndex = index;
      }
    });

    // Reorder starting from top-left, going clockwise
    const orderedPoints: Point[] = [];
    for (let i = 0; i < 4; i++) {
      const index = (topLeftIndex + i) % 4;
      orderedPoints.push({ x: sortedPoints[index].x, y: sortedPoints[index].y });
    }

    return orderedPoints;
  }

  /**
   * Calculate the optimal output dimensions for the document
   */
  static calculateOutputDimensions(orderedPoints: Point[]): { width: number; height: number } {
    const [topLeft, topRight, bottomRight, bottomLeft] = orderedPoints;

    // Calculate width as the maximum of top and bottom edges
    const topWidth = this.distance(topLeft, topRight);
    const bottomWidth = this.distance(bottomLeft, bottomRight);
    const width = Math.max(topWidth, bottomWidth);

    // Calculate height as the maximum of left and right edges
    const leftHeight = this.distance(topLeft, bottomLeft);
    const rightHeight = this.distance(topRight, bottomRight);
    const height = Math.max(leftHeight, rightHeight);

    return { width: Math.round(width), height: Math.round(height) };
  }

  /**
   * Validate polygon points
   */
  static validatePolygon(points: Point[], imageWidth: number, imageHeight: number): boolean {
    if (!points || points.length !== 4) {
      return false;
    }

    return points.every(point => 
      typeof point.x === 'number' && 
      typeof point.y === 'number' &&
      point.x >= 0 && point.x <= imageWidth &&
      point.y >= 0 && point.y <= imageHeight &&
      !isNaN(point.x) && !isNaN(point.y)
    );
  }
}

/**
 * Perspective transformation matrix calculator
 */
class PerspectiveTransform {
  /**
   * Calculate transformation matrix from source quadrilateral to destination rectangle
   */
  static calculateTransformMatrix(
    srcPoints: Point[],
    destWidth: number,
    destHeight: number
  ): number[][] {
    const [src1, src2, src3, src4] = srcPoints;
    
    // Destination rectangle corners
    const dst1 = { x: 0, y: 0 };
    const dst2 = { x: destWidth, y: 0 };
    const dst3 = { x: destWidth, y: destHeight };
    const dst4 = { x: 0, y: destHeight };

    // Set up the system of equations for perspective transformation
    // We need to solve for the 8 parameters of the transformation matrix
    const A = [
      [src1.x, src1.y, 1, 0, 0, 0, -dst1.x * src1.x, -dst1.x * src1.y],
      [0, 0, 0, src1.x, src1.y, 1, -dst1.y * src1.x, -dst1.y * src1.y],
      [src2.x, src2.y, 1, 0, 0, 0, -dst2.x * src2.x, -dst2.x * src2.y],
      [0, 0, 0, src2.x, src2.y, 1, -dst2.y * src2.x, -dst2.y * src2.y],
      [src3.x, src3.y, 1, 0, 0, 0, -dst3.x * src3.x, -dst3.x * src3.y],
      [0, 0, 0, src3.x, src3.y, 1, -dst3.y * src3.x, -dst3.y * src3.y],
      [src4.x, src4.y, 1, 0, 0, 0, -dst4.x * src4.x, -dst4.x * src4.y],
      [0, 0, 0, src4.x, src4.y, 1, -dst4.y * src4.x, -dst4.y * src4.y]
    ];

    const b = [dst1.x, dst1.y, dst2.x, dst2.y, dst3.x, dst3.y, dst4.x, dst4.y];

    // For React Native, we'll use a simplified approach
    // Calculate the transformation using the four corner mappings
    return this.calculateSimplifiedTransform(srcPoints, destWidth, destHeight);
  }

  /**
   * Calculate a simplified transformation matrix
   */
  private static calculateSimplifiedTransform(
    srcPoints: Point[],
    destWidth: number,
    destHeight: number
  ): number[][] {
    const [topLeft, topRight, bottomRight, bottomLeft] = srcPoints;
    
    // Calculate the perspective transformation coefficients
    // This is a simplified version suitable for document scanning
    const srcWidth = Math.max(
      PolygonUtils.distance(topLeft, topRight),
      PolygonUtils.distance(bottomLeft, bottomRight)
    );
    const srcHeight = Math.max(
      PolygonUtils.distance(topLeft, bottomLeft),
      PolygonUtils.distance(topRight, bottomRight)
    );

    // Return transformation parameters
    return [
      [destWidth / srcWidth, 0, 0],
      [0, destHeight / srcHeight, 0],
      [0, 0, 1]
    ];
  }
}

/**
 * Main polygon document cropper class
 */
export class PolygonDocumentCropper {
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
   * Create a rectangular crop from polygon using perspective correction
   */
  private static async createRectangularCrop(
    imageUri: string,
    orderedPoints: Point[],
    outputDimensions: { width: number; height: number },
    options: PolygonCropOptions
  ): Promise<string> {
    // For React Native, we'll use a multi-step approach:
    // 1. Create a bounding rectangle that encompasses the polygon
    // 2. Crop to that rectangle first
    // 3. Apply additional processing if needed

    const minX = Math.min(...orderedPoints.map(p => p.x));
    const maxX = Math.max(...orderedPoints.map(p => p.x));
    const minY = Math.min(...orderedPoints.map(p => p.y));
    const maxY = Math.max(...orderedPoints.map(p => p.y));

    // Add padding
    const padding = options.padding || 0;
    const cropBounds = {
      offset: {
        x: Math.max(0, minX - padding),
        y: Math.max(0, minY - padding),
      },
      size: {
        width: maxX - minX + (padding * 2),
        height: maxY - minY + (padding * 2),
      },
    };

    console.log('[PolygonCropper] Creating rectangular crop with bounds:', cropBounds);

    // Perform the crop using ImageEditor
    const croppedUri = await ImageEditor.cropImage(imageUri, cropBounds);
    
    return typeof croppedUri === 'string' ? croppedUri : croppedUri.uri;
  }

  /**
   * Apply perspective correction to the cropped image
   * Note: For now, this is a placeholder. Full perspective correction would require
   * a native module or additional image processing library
   */
  private static async applyPerspectiveCorrection(
    croppedUri: string,
    orderedPoints: Point[],
    outputDimensions: { width: number; height: number }
  ): Promise<string> {
    // TODO: Implement perspective correction using a native module
    // For now, return the cropped image as-is
    console.log('[PolygonCropper] Perspective correction placeholder - returning cropped image');
    console.log('[PolygonCropper] Would transform from polygon:', orderedPoints);
    console.log('[PolygonCropper] To rectangle:', outputDimensions);
    
    return croppedUri;
  }

  /**
   * Main function to crop document using polygon coordinates with perspective correction
   */
  static async cropDocument(
    imageUri: string,
    polygon: Point[],
    options: PolygonCropOptions = {}
  ): Promise<PolygonCropResult> {
    try {
      console.log('\\n=== Polygon Document Cropping Started ===');
      console.log('[PolygonCropper] Input image URI:', imageUri);
      console.log('[PolygonCropper] Polygon points:', polygon);
      console.log('[PolygonCropper] Options:', options);

      const normalizedUri = this.normalizeUri(imageUri);
      
      // For now, assume image dimensions - in a real implementation,
      // you might get these from the image metadata
      const imageDimensions = { width: 4032, height: 3024 }; // Default camera resolution
      
      // Validate polygon
      if (!PolygonUtils.validatePolygon(polygon, imageDimensions.width, imageDimensions.height)) {
        throw new Error('Invalid polygon: must have exactly 4 valid points within image bounds');
      }

      // Order points correctly (clockwise from top-left)
      const orderedPoints = PolygonUtils.orderPoints(polygon);
      console.log('[PolygonCropper] Ordered points:', orderedPoints);

      // Calculate optimal output dimensions
      const outputDimensions = options.outputWidth && options.outputHeight 
        ? { width: options.outputWidth, height: options.outputHeight }
        : PolygonUtils.calculateOutputDimensions(orderedPoints);
      
      console.log('[PolygonCropper] Output dimensions:', outputDimensions);

      // Step 1: Create rectangular crop encompassing the polygon
      const croppedUri = await this.createRectangularCrop(
        normalizedUri,
        orderedPoints,
        outputDimensions,
        options
      );

      // Step 2: Apply perspective correction (placeholder for now)
      const perspectiveCorrectedUri = await this.applyPerspectiveCorrection(
        croppedUri,
        orderedPoints,
        outputDimensions
      );

      const finalUri = this.normalizeUri(perspectiveCorrectedUri);
      
      console.log('[PolygonCropper] ✅ Polygon cropping successful:', finalUri);
      console.log('=== Polygon Document Cropping Complete ===\\n');

      return {
        success: true,
        croppedUri: finalUri,
        metadata: {
          originalSize: imageDimensions,
          croppedSize: outputDimensions,
          perspectiveApplied: false // Will be true when perspective correction is implemented
        }
      };

    } catch (error) {
      console.error('[PolygonCropper] ❌ Polygon cropping failed:', error);
      
      return {
        success: false,
        croppedUri: this.normalizeUri(imageUri), // Return original image as fallback
        error: `Polygon crop failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Convenience method for cropping with detected document bounds
   */
  static async cropDetectedDocument(
    imageUri: string,
    detectedCorners: Point[],
    options: PolygonCropOptions = {}
  ): Promise<PolygonCropResult> {
    console.log('[PolygonCropper] Cropping detected document with corners:', detectedCorners);
    
    return this.cropDocument(imageUri, detectedCorners, {
      padding: 10, // Default padding for detected documents
      ...options
    });
  }

  /**
   * Create a fallback rectangular crop when polygon detection fails
   */
  static async createFallbackCrop(
    imageUri: string,
    imageSize: { width: number; height: number },
    options: PolygonCropOptions = {}
  ): Promise<PolygonCropResult> {
    console.log('[PolygonCropper] Creating fallback center crop');
    
    // Create a centered rectangle that's 80% of the image size
    const cropWidth = imageSize.width * 0.8;
    const cropHeight = imageSize.height * 0.6; // Assume document aspect ratio
    const offsetX = (imageSize.width - cropWidth) / 2;
    const offsetY = (imageSize.height - cropHeight) / 2;

    const fallbackPolygon: Point[] = [
      { x: offsetX, y: offsetY },
      { x: offsetX + cropWidth, y: offsetY },
      { x: offsetX + cropWidth, y: offsetY + cropHeight },
      { x: offsetX, y: offsetY + cropHeight }
    ];

    return this.cropDocument(imageUri, fallbackPolygon, options);
  }
}

/**
 * Main export function for easy usage
 */
export const cropDocument = PolygonDocumentCropper.cropDocument.bind(PolygonDocumentCropper);
export const cropDetectedDocument = PolygonDocumentCropper.cropDetectedDocument.bind(PolygonDocumentCropper);
export const createFallbackCrop = PolygonDocumentCropper.createFallbackCrop.bind(PolygonDocumentCropper);

// Export utility classes for advanced usage
export { PolygonUtils, PerspectiveTransform };