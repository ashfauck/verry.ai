// Simple document detection utility
// In a real implementation, you'd use OpenCV or MLKit for better detection

export interface DocumentDetectionResult {
  found: boolean;
  confidence: number;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  corners?: {
    topLeft: { x: number; y: number };
    topRight: { x: number; y: number };
    bottomLeft: { x: number; y: number };
    bottomRight: { x: number; y: number };
  };
}

// Persistent state for more realistic detection
let detectionState = {
  currentlyDetecting: false,
  detectionStartTime: 0,
  stablePosition: null as null | { x: number; y: number; width: number; height: number },
  confidenceBuildup: 0,
  lastDetectionAttempt: 0,
};

// Mock document detection for demonstration
// In production, replace this with actual OpenCV/MLKit implementation
export const detectDocument = (frame: any): DocumentDetectionResult => {
  // Note: 'worklet' directive removed since we're not using frame processors currently
  
  const frameWidth = frame.width || 1920;
  const frameHeight = frame.height || 1080;
  const currentTime = Date.now();
  
  // Only try detection every 1 second to prevent too frequent captures
  if (currentTime - detectionState.lastDetectionAttempt < 1000) {
    return {
      found: false,
      confidence: 0,
      bounds: { x: 0, y: 0, width: 0, height: 0 }
    };
  }
  
  // Simulate more realistic detection behavior
  // Lower chance to start detecting to prevent automatic capture
  if (!detectionState.currentlyDetecting) {
    const shouldStartDetecting = Math.random() > 0.9; // Only 10% chance to start detecting
    if (shouldStartDetecting) {
      detectionState.currentlyDetecting = true;
      detectionState.detectionStartTime = currentTime;
      detectionState.lastDetectionAttempt = currentTime;
      detectionState.confidenceBuildup = 0.1;
      
      // Set a stable position for the document
      const docWidth = frameWidth * (0.65 + Math.random() * 0.15); // 65-80% of frame
      const docHeight = docWidth * 0.63; // ID card ratio (~1.6:1)
      const docX = (frameWidth - docWidth) / 2 + (Math.random() - 0.5) * 100; // Slight offset
      const docY = (frameHeight - docHeight) / 2 + (Math.random() - 0.5) * 80;
      
      detectionState.stablePosition = { x: docX, y: docY, width: docWidth, height: docHeight };
    }
  }
  
  if (!detectionState.currentlyDetecting || !detectionState.stablePosition) {
    detectionState.lastDetectionAttempt = currentTime;
    return {
      found: false,
      confidence: 0,
      bounds: { x: 0, y: 0, width: 0, height: 0 }
    };
  }
  
  // Build up confidence more slowly and require higher threshold
  const elapsedTime = currentTime - detectionState.detectionStartTime;
  const maxConfidenceTime = 5000; // 5 seconds to reach max confidence (slower)
  const baseConfidence = Math.min(elapsedTime / maxConfidenceTime, 1) * 0.7; // Lower max confidence
  
  // Add some noise but keep it realistic
  const noise = (Math.random() - 0.5) * 0.15;
  detectionState.confidenceBuildup = Math.max(0.1, Math.min(0.75, baseConfidence + noise));
  
  // Small position variations to simulate hand movement
  const posNoise = 15;
  const currentPos = {
    x: detectionState.stablePosition.x + (Math.random() - 0.5) * posNoise,
    y: detectionState.stablePosition.y + (Math.random() - 0.5) * posNoise,
    width: detectionState.stablePosition.width + (Math.random() - 0.5) * posNoise,
    height: detectionState.stablePosition.height + (Math.random() - 0.5) * posNoise,
  };
  
  // More likely to lose detection to prevent auto-capture
  const shouldLoseDetection = Math.random() > 0.85; // 15% chance per frame (higher)
  if (shouldLoseDetection && elapsedTime > 2000) {
    detectionState.currentlyDetecting = false;
    detectionState.stablePosition = null;
    detectionState.confidenceBuildup = 0;
    detectionState.lastDetectionAttempt = currentTime;
    return {
      found: false,
      confidence: 0,
      bounds: { x: 0, y: 0, width: 0, height: 0 }
    };
  }
  
  detectionState.lastDetectionAttempt = currentTime;
  return {
    found: true,
    confidence: detectionState.confidenceBuildup,
    bounds: currentPos,
    corners: {
      topLeft: { x: currentPos.x, y: currentPos.y },
      topRight: { x: currentPos.x + currentPos.width, y: currentPos.y },
      bottomLeft: { x: currentPos.x, y: currentPos.y + currentPos.height },
      bottomRight: { x: currentPos.x + currentPos.width, y: currentPos.y + currentPos.height }
    }
  };
};

// Reset detection state (useful when switching screens)
export const resetDetectionState = () => {
  detectionState = {
    currentlyDetecting: false,
    detectionStartTime: 0,
    stablePosition: null,
    confidenceBuildup: 0,
    lastDetectionAttempt: 0,
  };
};

// Stability checker to prevent false captures
export class DocumentStabilityChecker {
  private detectionHistory: DocumentDetectionResult[] = [];
  private readonly requiredStableFrames = 6; // Increased to prevent accidental capture
  private readonly confidenceThreshold = 0.85; // Higher threshold required
  private readonly positionTolerance = 40; // pixels - more strict positioning
  
  addDetection(detection: DocumentDetectionResult): boolean {
    this.detectionHistory.push(detection);
    
    // Keep only recent detections
    if (this.detectionHistory.length > this.requiredStableFrames) {
      this.detectionHistory.shift();
    }
    
    // Check if we have enough stable detections
    if (this.detectionHistory.length < this.requiredStableFrames) {
      return false;
    }
    
    // All recent detections must be found with high confidence
    const allFound = this.detectionHistory.every(d => 
      d.found && d.confidence >= this.confidenceThreshold
    );
    
    if (!allFound) {
      return false;
    }
    
    // Check position stability
    const firstBounds = this.detectionHistory[0].bounds;
    const isStable = this.detectionHistory.every(d => {
      const dx = Math.abs(d.bounds.x - firstBounds.x);
      const dy = Math.abs(d.bounds.y - firstBounds.y);
      const dw = Math.abs(d.bounds.width - firstBounds.width);
      const dh = Math.abs(d.bounds.height - firstBounds.height);
      
      return dx < this.positionTolerance && 
             dy < this.positionTolerance && 
             dw < this.positionTolerance && 
             dh < this.positionTolerance;
    });
    
    return isStable;
  }
  
  reset() {
    this.detectionHistory = [];
  }
  
  getLatestBounds() {
    if (this.detectionHistory.length === 0) return null;
    return this.detectionHistory[this.detectionHistory.length - 1].bounds;
  }
}