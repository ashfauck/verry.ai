// NOTE: We avoid showing Alerts inside the service; UI decides how to fallback.
// This keeps logic testable and prevents duplicate user prompts.

// Try to import the native scanner, but handle errors gracefully
let DocumentScanner: any = null;
try {
  const module = require('react-native-document-scanner-plugin');
  DocumentScanner = module.default || module;
} catch (error) {
  console.log('[DocumentScanner] Native module not available:', error);
}

export interface DocumentScanResult {
  success: boolean;
  scannedImagePath?: string;
  error?: string;
}

export interface DocumentScanOptions {
  // Image quality from 1-100 (100 being highest quality)
  croppedImageQuality?: number;
  // Maximum number of documents (Android only)
  maxNumDocuments?: number;
  // Response type
  responseType?: 'imageFilePath' | 'base64';
}

/**
 * Document Scanner Service using native document scanner
 * Provides automatic document detection, cropping, and enhancement
 */
export class DocumentScannerService {
  
  /**
   * Scan a document using the native document scanner
   */
  static async scanDocument(options: DocumentScanOptions = {}): Promise<DocumentScanResult> {
    const {
      croppedImageQuality = 100,
      maxNumDocuments = 1,
      responseType = 'imageFilePath'
    } = options;

    // Try to use the native scanner first
    if (DocumentScanner) {
      try {
        console.log('[DocumentScanner] Attempting to use native scanner');
        
        const result = await DocumentScanner.scanDocument({
          croppedImageQuality,
          maxNumDocuments,
          responseType
        });

        console.log('[DocumentScanner] Native scan result:', result);

        if (result.status === 'success' && result.scannedImages && result.scannedImages.length > 0) {
          return {
            success: true,
            scannedImagePath: result.scannedImages[0]
          };
        } else if (result.status === 'cancel') {
          return {
            success: false,
            error: 'User cancelled document scan'
          };
        } else {
          return {
            success: false,
            error: 'Document scan failed'
          };
        }
      } catch (error) {
        console.log('[DocumentScanner] Native scanner failed, falling back:', error);
        // Fall through to fallback mode
      }
    }

    // Fallback: return explicit error without UI side-effects.
    return {
      success: false,
      error: 'native_scanner_unavailable'
    };
  }

  /**
   * Check if document scanner is available on this device
   */
  static async isAvailable(): Promise<boolean> {
    try {
      return !!DocumentScanner; // only true if native module loaded
    } catch (error) {
      console.error('[DocumentScanner] Availability check failed:', error);
      return false;
    }
  }
}