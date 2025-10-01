/**
 * Quick Coordinate Debug Test
 * 
 * Run this to immediately debug your coordinate mapping issue.
 * Replace the example values with your actual coordinates and sizes.
 */

import { debugCoordinates } from './coordinateDebugger';

/**
 * Test with your actual coordinates
 */
export const testCoordinateMapping = () => {
  console.log('🚀 === COORDINATE MAPPING DEBUG TEST ===\n');
  
  // REPLACE THESE WITH YOUR ACTUAL VALUES:
  
  // 1. Your frame coordinates (from the blue dotted frame)
  const frameCoordinates = [
    { x: 50, y: 100 },    // Top-left corner of blue frame
    { x: 325, y: 95 },    // Top-right corner
    { x: 330, y: 371.3333435058594 },  // Bottom-right (your example)
    { x: 45, y: 375 }     // Bottom-left corner
  ];
  
  // 2. Your preview/overlay size (where the frame is drawn)
  // This should be the size of your camera preview container
  const previewSize = { 
    width: 375,   // Replace with actual preview width
    height: 667   // Replace with actual preview height
  };
  
  // 3. Your captured image size
  const imageSize = {
    width: 4032,  // Replace with actual image width
    height: 3024  // Replace with actual image height
  };
  
  console.log('📋 INPUT DATA:');
  console.log('Frame coordinates:', frameCoordinates);
  console.log('Preview size:', previewSize);
  console.log('Image size:', imageSize);
  console.log('');
  
  // Run the debug analysis
  const result = debugCoordinates(frameCoordinates, previewSize, imageSize);
  
  console.log('\n🎯 === TEST RESULTS ===');
  console.log('✨ CORRECTED COORDINATES FOR CROPPING:');
  console.log(JSON.stringify(result.recommendedTransform.transformedPoints, null, 2));
  console.log(`\n📐 RECOMMENDED METHOD: ${result.recommendedTransform.method}`);
  
  // Show the aspect ratio analysis
  const previewAspect = previewSize.width / previewSize.height;
  const imageAspect = imageSize.width / imageSize.height;
  
  console.log('\n📊 ASPECT RATIO ANALYSIS:');
  console.log(`Preview aspect ratio: ${previewAspect.toFixed(3)}`);
  console.log(`Image aspect ratio: ${imageAspect.toFixed(3)}`);
  console.log(`Aspect difference: ${Math.abs(previewAspect - imageAspect).toFixed(3)}`);
  
  if (Math.abs(previewAspect - imageAspect) > 0.01) {
    console.log('❌ FOUND THE ISSUE: Aspect ratio mismatch!');
    console.log('🎯 Your camera preview and captured image have different aspect ratios.');
    console.log('✅ Use the "Cover Mode" transformation above.');
  } else {
    console.log('✅ Aspect ratios match - simple scaling should work');
  }
  
  return result;
};

/**
 * Test with multiple common scenarios
 */
export const testCommonScenarios = () => {
  console.log('🧪 === TESTING COMMON SCENARIOS ===\n');
  
  const scenarios = [
    {
      name: 'iPhone 13 (375×812) to 4K Image',
      frame: [{ x: 50, y: 100 }, { x: 325, y: 95 }, { x: 330, y: 371 }, { x: 45, y: 375 }],
      preview: { width: 375, height: 812 },
      image: { width: 4032, height: 3024 }
    },
    {
      name: 'iPad (768×1024) to 4K Image',
      frame: [{ x: 100, y: 200 }, { x: 668, y: 190 }, { x: 680, y: 750 }, { x: 90, y: 760 }],
      preview: { width: 768, height: 1024 },
      image: { width: 4032, height: 3024 }
    },
    {
      name: 'Android (360×640) to 4K Image',
      frame: [{ x: 30, y: 80 }, { x: 330, y: 75 }, { x: 335, y: 380 }, { x: 25, y: 385 }],
      preview: { width: 360, height: 640 },
      image: { width: 4032, height: 3024 }
    }
  ];
  
  scenarios.forEach((scenario, index) => {
    console.log(`\n${index + 1}. ${scenario.name}`);
    console.log('─'.repeat(50));
    
    const result = debugCoordinates(scenario.frame, scenario.preview, scenario.image);
    
    console.log(`Method: ${result.recommendedTransform.method}`);
    console.log('Transformed coordinates:', result.recommendedTransform.transformedPoints);
  });
};

/**
 * Test your specific coordinate from the text selection
 */
export const testYourSpecificCoordinate = () => {
  console.log('🎯 === TESTING YOUR SPECIFIC COORDINATE ===\n');
  
  // Your coordinate: y: 371.3333435058594
  // Let's test different scenarios with this coordinate
  
  const testCases = [
    {
      name: 'Your coordinate with typical iPhone dimensions',
      frame: [
        { x: 50, y: 100 },
        { x: 325, y: 95 },
        { x: 330, y: 371.3333435058594 },
        { x: 45, y: 376 }
      ],
      preview: { width: 375, height: 667 },
      image: { width: 4032, height: 3024 }
    },
    {
      name: 'Your coordinate with full screen dimensions',
      frame: [
        { x: 50, y: 100 },
        { x: 325, y: 95 },
        { x: 330, y: 371.3333435058594 },
        { x: 45, y: 376 }
      ],
      preview: { width: 375, height: 812 },
      image: { width: 4032, height: 3024 }
    }
  ];
  
  testCases.forEach(testCase => {
    console.log(`\n📱 ${testCase.name}:`);
    console.log('─'.repeat(40));
    
    const result = debugCoordinates(testCase.frame, testCase.preview, testCase.image);
    
    // Find the transformed Y coordinate for point 2
    const transformedY = result.recommendedTransform.transformedPoints[2].y;
    const originalY = 371.3333435058594;
    
    console.log(`Original Y: ${originalY}`);
    console.log(`Transformed Y: ${transformedY}`);
    console.log(`Scale factor: ${(transformedY / originalY).toFixed(4)}`);
  });
};

// Export a single function that runs all tests
export const runAllCoordinateTests = () => {
  testCoordinateMapping();
  testCommonScenarios();
  testYourSpecificCoordinate();
  
  console.log('\n🏁 === ALL TESTS COMPLETE ===');
  console.log('📝 Copy the "CORRECTED COORDINATES FOR CROPPING" and use those in your OpenCV cropper.');
};