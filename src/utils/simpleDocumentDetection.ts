/**
 * Simple document detection without machine learning
 * This module provides basic document detection simulation for UI purposes
 */

export interface DocumentDetectionResult {
  found: boolean;
  confidence: number;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  corners?: Array<{ x: number; y: number }>;
  documentType?: 'license' | 'passport' | 'id_card' | 'unknown';
}

/**
 * Simple document detection that just returns mock results
 * This simulates document detection without any ML processing
 */
export async function detectDocumentSimple(
  imageUri: string, 
  frameWidth: number, 
  frameHeight: number,
  screenWidth: number = 375,
  screenHeight: number = 667,
  frameData?: any
): Promise<DocumentDetectionResult> {
  try {
    console.log(`[SimpleDetection] Processing ${frameWidth}x${frameHeight} image`);
    
    // Simulate a short processing delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Simple simulation: randomly detect documents sometimes
    const shouldDetect = Math.random() > 0.3; // 70% chance of detection
    
    if (shouldDetect) {
      // Create reasonable document bounds (centered rectangle)
      // Use the provided screen dimensions for bounds
      const docWidth = screenWidth * 0.7; // 70% of screen width
      const docHeight = docWidth * 0.63; // Standard ID card ratio
      const x = (screenWidth - docWidth) / 2;
      const y = (screenHeight - docHeight) / 2;

      const confidence = 0.75 + Math.random() * 0.2; // 75-95% confidence

      console.log(`[SimpleDetection] Document detected with confidence: ${confidence.toFixed(2)}`);
      console.log(`[SimpleDetection] Bounds: x=${x}, y=${y}, w=${docWidth}, h=${docHeight}`);

      return {
        found: true,
        confidence,
        bounds: { x, y, width: docWidth, height: docHeight },
        corners: [
          { x, y },
          { x: x + docWidth, y },
          { x: x + docWidth, y: y + docHeight },
          { x, y: y + docHeight }
        ],
        documentType: 'id_card'
      };
    } else {
      console.log('[SimpleDetection] No document detected');
      return { found: false, confidence: 0 };
    }
    
  } catch (error) {
    console.error('[SimpleDetection] Error:', error);
    return { found: false, confidence: 0 };
  }
}