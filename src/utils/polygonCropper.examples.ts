/**
 * POLYGON DOCUMENT CROPPER - USAGE EXAMPLES
 * 
 * This file demonstrates how to use the polygon-based document cropper
 * for precise document extraction with perspective correction.
 */

import { 
  cropDocument, 
  cropDetectedDocument, 
  createFallbackCrop,
  Point, 
  PolygonCropResult,
  PolygonCropOptions,
  PolygonUtils 
} from './polygonCropper';

/**
 * EXAMPLE 1: Basic Usage with Detected Document Corners
 * 
 * This is the most common use case - you have detected the 4 corners
 * of a document and want to crop it to a perfect rectangle.
 */
export async function basicDocumentCropping(
  imageUri: string, 
  detectedCorners: Point[]
): Promise<PolygonCropResult> {
  
  console.log('=== Basic Document Cropping Example ===');
  
  // Example detected corners from document detection algorithm
  // These would typically come from your frame processor or ML model
  const corners: Point[] = [
    { x: 450, y: 800 },   // Top-left corner
    { x: 3580, y: 850 },  // Top-right corner  
    { x: 3530, y: 2200 }, // Bottom-right corner
    { x: 400, y: 2150 }   // Bottom-left corner
  ];
  
  // Basic options for high-quality document cropping
  const options: PolygonCropOptions = {
    padding: 15,        // Add 15 pixels padding around document
    quality: 0.9,       // High JPEG quality
    format: 'JPEG'      // Output format
  };
  
  // Perform the crop using detected corners
  const result = await cropDetectedDocument(imageUri, corners, options);
  
  if (result.success) {
    console.log('✅ Document cropped successfully!');
    console.log('📁 Cropped image URI:', result.croppedUri);
    console.log('📊 Metadata:', result.metadata);
  } else {
    console.error('❌ Cropping failed:', result.error);
  }
  
  return result;
}

/**
 * EXAMPLE 2: Custom Polygon with Specific Output Dimensions
 * 
 * Use this when you want to create a custom crop area or
 * need specific output dimensions.
 */
export async function customPolygonCropping(
  imageUri: string
): Promise<PolygonCropResult> {
  
  console.log('=== Custom Polygon Cropping Example ===');
  
  // Define a custom polygon (e.g., from user interaction)
  const customPolygon: Point[] = [
    { x: 300, y: 600 },   // Top-left
    { x: 3700, y: 650 },  // Top-right
    { x: 3650, y: 2400 }, // Bottom-right
    { x: 250, y: 2350 }   // Bottom-left
  ];
  
  // Custom options with specific output size
  const options: PolygonCropOptions = {
    outputWidth: 1200,   // Force specific width
    outputHeight: 800,   // Force specific height
    padding: 25,         // Larger padding
    quality: 0.85        // Slightly lower quality for smaller file size
  };
  
  // Perform the crop with custom polygon
  const result = await cropDocument(imageUri, customPolygon, options);
  
  return result;
}

/**
 * EXAMPLE 3: Frame Processor Integration
 * 
 * This shows how to integrate with react-native-vision-camera
 * frame processor for real-time document detection and cropping.
 */
export function frameProcessorIntegration() {
  // This would be inside your frame processor
  const frameProcessor = `
    'worklet';
    
    // Example frame processor code (pseudo-code)
    function detectDocumentAndCrop(frame) {
      // Your document detection algorithm here
      const detectedCorners = detectDocumentCorners(frame);
      
      if (detectedCorners && detectedCorners.length === 4) {
        // Convert frame coordinates to image coordinates
        const imageCorners = detectedCorners.map(corner => ({
          x: corner.x * (frame.width / previewWidth),
          y: corner.y * (frame.height / previewHeight)
        }));
        
        // Store corners for later cropping
        runOnJS(storeCornersForCropping)(imageCorners);
      }
    }
  `;
  
  console.log('Frame processor integration example:', frameProcessor);
}

/**
 * EXAMPLE 4: Batch Processing Multiple Documents
 * 
 * Process multiple documents in sequence with error handling.
 */
export async function batchDocumentProcessing(
  documents: Array<{ uri: string; corners: Point[] }>
): Promise<PolygonCropResult[]> {
  
  console.log('=== Batch Document Processing Example ===');
  
  const results: PolygonCropResult[] = [];
  
  for (let i = 0; i < documents.length; i++) {
    const { uri, corners } = documents[i];
    
    try {
      console.log(`Processing document ${i + 1}/${documents.length}...`);
      
      const options: PolygonCropOptions = {
        padding: 20,
        quality: 0.8, // Lower quality for batch processing
        format: 'JPEG'
      };
      
      const result = await cropDetectedDocument(uri, corners, options);
      results.push(result);
      
      if (result.success) {
        console.log(`✅ Document ${i + 1} processed successfully`);
      } else {
        console.error(`❌ Document ${i + 1} failed:`, result.error);
      }
      
    } catch (error) {
      console.error(`💥 Document ${i + 1} crashed:`, error);
      results.push({
        success: false,
        croppedUri: uri,
        error: `Processing failed: ${error}`
      });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  console.log(`Batch processing complete: ${successCount}/${documents.length} successful`);
  
  return results;
}

/**
 * EXAMPLE 5: Advanced Error Handling and Fallbacks
 * 
 * Comprehensive error handling with multiple fallback strategies.
 */
export async function robustDocumentCropping(
  imageUri: string,
  detectedCorners?: Point[]
): Promise<PolygonCropResult> {
  
  console.log('=== Robust Document Cropping Example ===');
  
  // Strategy 1: Try polygon cropping with detected corners
  if (detectedCorners && detectedCorners.length === 4) {
    try {
      const result = await cropDetectedDocument(imageUri, detectedCorners, {
        padding: 20,
        quality: 0.9
      });
      
      if (result.success) {
        console.log('✅ Strategy 1 (Polygon cropping) succeeded');
        return result;
      }
    } catch (error) {
      console.warn('Strategy 1 failed:', error);
    }
  }
  
  // Strategy 2: Try with a more permissive polygon
  if (detectedCorners && detectedCorners.length === 4) {
    try {
      // Create a slightly larger polygon for better coverage
      const expandedCorners = detectedCorners.map(corner => ({
        x: corner.x - 50, // Expand outward
        y: corner.y - 50
      }));
      
      const result = await cropDetectedDocument(imageUri, expandedCorners, {
        padding: 50,
        quality: 0.8
      });
      
      if (result.success) {
        console.log('✅ Strategy 2 (Expanded polygon) succeeded');
        return result;
      }
    } catch (error) {
      console.warn('Strategy 2 failed:', error);
    }
  }
  
  // Strategy 3: Fallback to center crop
  try {
    const imageSize = { width: 4032, height: 3024 }; // Default camera resolution
    const result = await createFallbackCrop(imageUri, imageSize, {
      padding: 100,
      quality: 0.7
    });
    
    if (result.success) {
      console.log('✅ Strategy 3 (Fallback crop) succeeded');
      return result;
    }
  } catch (error) {
    console.warn('Strategy 3 failed:', error);
  }
  
  // All strategies failed - return error result
  console.error('❌ All cropping strategies failed');
  return {
    success: false,
    croppedUri: imageUri,
    error: 'All cropping strategies failed. Please retake the photo.'
  };
}

/**
 * EXAMPLE 6: Performance Optimized Cropping
 * 
 * Optimized for performance with minimal quality loss.
 */
export async function performanceOptimizedCropping(
  imageUri: string,
  corners: Point[]
): Promise<PolygonCropResult> {
  
  console.log('=== Performance Optimized Cropping Example ===');
  
  // Validate corners first to avoid unnecessary processing
  if (!PolygonUtils.validatePolygon(corners, 4032, 3024)) {
    return {
      success: false,
      croppedUri: imageUri,
      error: 'Invalid polygon coordinates'
    };
  }
  
  // Order points for optimal processing
  const orderedCorners = PolygonUtils.orderPoints(corners);
  
  // Calculate optimal output dimensions
  const outputDimensions = PolygonUtils.calculateOutputDimensions(orderedCorners);
  
  // Use performance-optimized settings
  const options: PolygonCropOptions = {
    outputWidth: Math.min(outputDimensions.width, 1500), // Limit max size
    outputHeight: Math.min(outputDimensions.height, 1000),
    padding: 10, // Minimal padding
    quality: 0.75, // Balanced quality/size
    format: 'JPEG'
  };
  
  const startTime = Date.now();
  const result = await cropDetectedDocument(imageUri, orderedCorners, options);
  const processingTime = Date.now() - startTime;
  
  console.log(`Processing completed in ${processingTime}ms`);
  
  return result;
}

/**
 * EXAMPLE 7: Integration with Document Verification Flow
 * 
 * Shows how to integrate with a complete document verification workflow.
 */
export class DocumentVerificationIntegration {
  
  static async processDocumentCapture(
    imageUri: string,
    detectedCorners: Point[],
    documentType: 'front' | 'back'
  ): Promise<{
    success: boolean;
    croppedUri?: string;
    metadata?: any;
    error?: string;
  }> {
    
    console.log(`=== Processing ${documentType} document ===`);
    
    try {
      // Validate the detection quality
      const validationResult = this.validateDetection(detectedCorners);
      if (!validationResult.valid) {
        return {
          success: false,
          error: `Detection quality too low: ${validationResult.reason}`
        };
      }
      
      // Apply document type specific settings
      const options = this.getOptionsForDocumentType(documentType);
      
      // Perform the crop
      const cropResult = await cropDetectedDocument(imageUri, detectedCorners, options);
      
      if (cropResult.success) {
        // Store the result for the verification flow
        await this.storeCroppedDocument(documentType, cropResult);
        
        return {
          success: true,
          croppedUri: cropResult.croppedUri,
          metadata: cropResult.metadata
        };
      } else {
        return {
          success: false,
          error: cropResult.error
        };
      }
      
    } catch (error) {
      return {
        success: false,
        error: `Processing failed: ${error}`
      };
    }
  }
  
  private static validateDetection(corners: Point[]): { valid: boolean; reason?: string } {
    if (!corners || corners.length !== 4) {
      return { valid: false, reason: 'Invalid corner count' };
    }
    
    // Check if polygon is reasonable (not too small, not too skewed)
    const area = this.calculatePolygonArea(corners);
    if (area < 100000) { // Minimum area threshold
      return { valid: false, reason: 'Document too small' };
    }
    
    return { valid: true };
  }
  
  private static calculatePolygonArea(corners: Point[]): number {
    // Simple polygon area calculation
    let area = 0;
    for (let i = 0; i < corners.length; i++) {
      const j = (i + 1) % corners.length;
      area += corners[i].x * corners[j].y;
      area -= corners[j].x * corners[i].y;
    }
    return Math.abs(area) / 2;
  }
  
  private static getOptionsForDocumentType(type: 'front' | 'back'): PolygonCropOptions {
    return {
      padding: type === 'front' ? 15 : 20, // Back side might need more padding
      quality: 0.9,
      format: 'JPEG'
    };
  }
  
  private static async storeCroppedDocument(
    type: 'front' | 'back', 
    result: PolygonCropResult
  ): Promise<void> {
    // Store in your app's storage/state management
    console.log(`Storing ${type} document:`, result.croppedUri);
  }
}

// Export all examples for easy testing
export const examples = {
  basicDocumentCropping,
  customPolygonCropping,
  batchDocumentProcessing,
  robustDocumentCropping,
  performanceOptimizedCropping,
  DocumentVerificationIntegration
};