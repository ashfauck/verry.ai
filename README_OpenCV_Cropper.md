# OpenCV Document Cropper Implementation

## Overview

This implementation provides a complete OpenCV-based document cropping solution for React Native apps using `react-native-fast-opencv`. It performs accurate perspective transformation to crop documents from photographs, maintaining proper aspect ratios and handling complex polygon shapes.

## Key Features

- ✅ **Perspective Transformation**: Uses OpenCV's `getPerspectiveTransform` and `warpPerspective` for accurate document correction
- ✅ **Automatic Point Ordering**: Intelligently orders polygon points (top-left, top-right, bottom-right, bottom-left)
- ✅ **Dynamic Output Sizing**: Calculates optimal output dimensions based on polygon geometry
- ✅ **Coordinate Scaling**: Handles scaling from preview/frame space to full image coordinates
- ✅ **Validation**: Comprehensive polygon validation before processing
- ✅ **Error Handling**: Robust error handling with detailed logging
- ✅ **Cross-Platform**: Works on both iOS and Android
- ✅ **Integration Ready**: Designed to integrate seamlessly with existing camera workflows

## Files Created

### Core Implementation
- `src/utils/opencvCropper.ts` - Main OpenCV cropper class and functions
- `src/screens/DocumentReviewScreenOpenCV.tsx` - Enhanced review screen with OpenCV integration
- `src/examples/OpenCVIntegrationExample.ts` - Complete usage examples and integration patterns

### Usage Examples
- Complete workflow from camera capture to perspective correction
- React hooks for easy component integration
- Side-by-side comparison with existing polygon cropper

## Installation Requirements

This implementation requires the following package:

```bash
npm install react-native-fast-opencv
# or
yarn add react-native-fast-opencv
```

Follow the package's setup instructions for iOS and Android:
- [react-native-fast-opencv setup guide](https://github.com/jamesmontemagno/react-native-fast-opencv)

## Usage Examples

### Basic Usage

```typescript
import { cropDocument, scalePolygonToImageSpace } from '../utils/opencvCropper';

// 1. Define polygon points (from document detection)
const previewPolygon = [
  { x: 100, y: 200 },   // Top-left
  { x: 350, y: 190 },   // Top-right
  { x: 360, y: 450 },   // Bottom-right
  { x: 90, y: 460 }     // Bottom-left
];

// 2. Scale to full image coordinates
const scaledPolygon = scalePolygonToImageSpace(
  previewPolygon,
  { width: 375, height: 667 },  // Preview size
  { width: 4032, height: 3024 } // Image size
);

// 3. Crop with perspective transformation
const result = await cropDocument('file:///path/to/image.jpg', scaledPolygon);

if (result.success) {
  console.log('Cropped image saved to:', result.croppedImagePath);
} else {
  console.error('Cropping failed:', result.error);
}
```

### React Hook Usage

```typescript
import { useOpenCVDocumentProcessor } from '../examples/OpenCVIntegrationExample';

function DocumentProcessingComponent() {
  const { processDocument, isProcessing, result, error } = useOpenCVDocumentProcessor();

  const handleProcess = async () => {
    await processDocument(imagePath, polygon, previewSize);
  };

  return (
    <View>
      <Button 
        title="Process Document" 
        onPress={handleProcess}
        disabled={isProcessing}
      />
      {isProcessing && <ActivityIndicator />}
      {result && result.success && (
        <Image source={{ uri: result.croppedImagePath }} />
      )}
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
    </View>
  );
}
```

### Integration with Existing Camera Flow

```typescript
import { DocumentCaptureWorkflow } from '../examples/OpenCVIntegrationExample';

// In your camera capture handler
const onPhotoCaptured = async (photo, detectedPolygon) => {
  const result = await DocumentCaptureWorkflow.processWithOpenCV(
    photo.path,
    detectedPolygon,
    { width: screenWidth, height: screenHeight }
  );
  
  if (result.success) {
    navigation.navigate('DocumentReview', {
      originalImage: photo.path,
      croppedImage: result.croppedImagePath,
      metadata: result.metadata
    });
  }
};
```

## API Reference

### Core Functions

#### `cropDocument(imagePath, polygon)`
Main cropping function using OpenCV perspective transformation.

**Parameters:**
- `imagePath: string` - Path to the source image
- `polygon: DocumentPoint[]` - Array of 4 points defining the document corners

**Returns:** `Promise<OpenCVCropResult>`

#### `scalePolygonToImageSpace(previewPolygon, previewSize, imageSize)`
Scales polygon coordinates from preview space to full image space.

**Parameters:**
- `previewPolygon: DocumentPoint[]` - Polygon in preview coordinates
- `previewSize: {width, height}` - Preview dimensions
- `imageSize: {width, height}` - Full image dimensions

**Returns:** `DocumentPoint[]` - Scaled polygon

#### `validatePolygon(polygon, imageSize)`
Validates polygon points before processing.

**Parameters:**
- `polygon: DocumentPoint[]` - Polygon to validate
- `imageSize: {width, height}` - Image dimensions for bounds checking

**Returns:** `{valid: boolean, issues: string[]}`

### Types

```typescript
interface DocumentPoint {
  x: number;
  y: number;
}

interface OpenCVCropResult {
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
```

## How It Works

### 1. Point Ordering
The algorithm automatically orders polygon points in clockwise fashion:
- Sorts points by Y-coordinate to find top/bottom pairs
- Sorts each pair by X-coordinate to determine left/right
- Results in [topLeft, topRight, bottomRight, bottomLeft] order

### 2. Output Dimension Calculation
Calculates optimal output size based on polygon geometry:
- Measures top and bottom edge lengths, uses maximum as width
- Measures left and right edge lengths, uses maximum as height
- Ensures the output maintains document proportions

### 3. Perspective Transformation
Uses OpenCV's perspective transformation pipeline:
- Creates transformation matrix from source to destination points
- Destination points form a perfect rectangle
- Applies `warpPerspective` to correct perspective distortion

### 4. Coordinate Scaling
Handles coordinate system transformations:
- Maps from camera preview coordinates to full image coordinates
- Accounts for different aspect ratios and scaling factors
- Validates coordinates are within image bounds

## Testing and Debugging

The implementation includes comprehensive logging and debug information:

```typescript
// Enable debug output
console.log('🎯 === OpenCV Document Cropping Started ===');
console.log('📸 Image path:', imagePath);
console.log('📐 Polygon points:', polygon);
// ... detailed processing logs
console.log('🎯 === OpenCV Document Cropping Complete ===');
```

### Debug Information Available
- Original and scaled polygon coordinates
- Image and preview dimensions
- Scale factors and coordinate mappings
- Processing timings and results
- Validation warnings and errors

## Performance Considerations

- **Image Size**: Larger images require more processing time
- **Memory Usage**: OpenCV operations use native memory - matrices are properly released
- **Quality vs Speed**: JPEG quality setting affects output file size and processing time
- **Validation**: Polygon validation prevents unnecessary processing of invalid inputs

## Error Handling

The implementation provides comprehensive error handling:

- **Invalid Polygon**: Validates point count and coordinates
- **File Access**: Handles image loading and saving errors  
- **OpenCV Errors**: Catches and reports native processing errors
- **Memory Management**: Ensures OpenCV matrices are properly released

## Integration Notes

### With Existing Polygon Cropper
The OpenCV cropper can work alongside your existing polygon cropper:

```typescript
// DocumentReviewScreenOpenCV.tsx shows side-by-side comparison
const [selectedMethod, setSelectedMethod] = useState<'polygon' | 'opencv' | 'compare'>('opencv');
```

### With Camera Preview Coordinates
Make sure to properly scale coordinates from preview to full image:

```typescript
// From your camera preview overlay
const previewPolygon = getPolygonFromOverlay(); // Preview coordinates
const imageSize = await getImageDimensions(capturedImage);
const scaledPolygon = scalePolygonToImageSpace(previewPolygon, previewSize, imageSize);
```

### Navigation Integration
Update your navigation to include the new review screen:

```typescript
// Add to your navigation stack
const Stack = createNativeStackNavigator();

<Stack.Screen 
  name="DocumentReviewOpenCV" 
  component={DocumentReviewScreenOpenCV} 
/>
```

## Future Enhancements

Potential improvements for the implementation:
- **Document Detection**: Integration with ML-based document detection
- **Image Enhancement**: Post-processing filters (brightness, contrast, etc.)
- **Multi-page Support**: Batch processing for multiple documents
- **Background Processing**: Off-main-thread processing for better UX
- **Caching**: Intelligent caching of processed images

## Troubleshooting

### Common Issues

1. **"Module not found" error**
   - Ensure `react-native-fast-opencv` is properly installed and linked
   - Clear Metro cache: `npx react-native start --reset-cache`

2. **Perspective transformation fails**
   - Check polygon point ordering and validation
   - Ensure points form a valid quadrilateral
   - Verify coordinates are within image bounds

3. **Coordinate mapping issues**
   - Verify preview size matches actual camera preview dimensions
   - Check image dimensions are correctly retrieved
   - Validate scale factors are reasonable

4. **Memory issues**
   - Ensure OpenCV matrices are properly released
   - Check for memory leaks in processing loop
   - Consider processing images at lower resolution for preview

### Debug Steps

1. Enable detailed logging in `opencvCropper.ts`
2. Use `validatePolygon()` to check point validity
3. Test with simple rectangle coordinates first
4. Compare results with existing polygon cropper
5. Verify image dimensions and coordinate scaling

## Conclusion

This OpenCV document cropper implementation provides a robust, production-ready solution for document perspective correction in React Native apps. It handles the complex coordinate transformations and perspective mathematics while providing a simple, easy-to-integrate API.

The implementation is designed to be:
- **Reliable**: Comprehensive error handling and validation
- **Performant**: Efficient native OpenCV operations
- **Flexible**: Easy to customize and extend
- **Well-documented**: Extensive logging and examples

You now have a complete solution that can accurately crop and perspective-correct documents from camera captures, ready to integrate into your existing document verification workflow!