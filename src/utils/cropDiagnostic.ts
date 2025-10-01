/**
 * Crop Diagnostic Tool
 * 
 * Use this to quickly verify that the coordinate mapping is now working correctly
 */

export const diagnoseCropping = (
  frameCoords: { x: number; y: number; width: number; height: number },
  photoSize: { width: number; height: number },
  containerSize: { width: number; height: number }
) => {
  console.log('\n🔍 === CROP DIAGNOSTIC ===');
  console.log('📋 Input Data:');
  console.log('  Frame (blue box):', frameCoords);
  console.log('  Photo size:', photoSize);
  console.log('  Container size:', containerSize);
  
  // Check for aspect ratio mismatch and use appropriate transformation
  const containerAspect = containerSize.width / containerSize.height;
  const photoAspect = photoSize.width / photoSize.height;
  const aspectDiff = Math.abs(containerAspect - photoAspect);
  
  let expectedCrop;
  let transformMethod;
  
  if (aspectDiff > 0.1) {
    // Cover mode transformation
    transformMethod = 'Cover Mode (Aspect-Aware)';
    
    const scaleToFillWidth = containerSize.width / photoSize.width;
    const scaleToFillHeight = containerSize.height / photoSize.height;
    const coverScale = Math.max(scaleToFillWidth, scaleToFillHeight);
    
    const renderedWidth = photoSize.width * coverScale;
    const renderedHeight = photoSize.height * coverScale;
    const offsetX = (containerSize.width - renderedWidth) / 2;
    const offsetY = (containerSize.height - renderedHeight) / 2;
    
    const adjustedX = frameCoords.x - offsetX;
    const adjustedY = frameCoords.y - offsetY;
    const scaleToPhoto = 1 / coverScale;
    
    expectedCrop = {
      x: Math.round(adjustedX * scaleToPhoto),
      y: Math.round(adjustedY * scaleToPhoto),
      width: Math.round(frameCoords.width * scaleToPhoto),
      height: Math.round(frameCoords.height * scaleToPhoto)
    };
    
    console.log('  Cover mode details:');
    console.log('    Cover scale: ' + coverScale.toFixed(4));
    console.log('    Rendered size: ' + renderedWidth.toFixed(1) + ' × ' + renderedHeight.toFixed(1));
    console.log('    Offset: (' + offsetX.toFixed(1) + ', ' + offsetY.toFixed(1) + ')');
    console.log('    Adjusted frame: (' + adjustedX.toFixed(1) + ', ' + adjustedY.toFixed(1) + ')');
    
  } else {
    // Direct scaling
    transformMethod = 'Direct Scaling';
    
    const scaleX = photoSize.width / containerSize.width;
    const scaleY = photoSize.height / containerSize.height;
    
    expectedCrop = {
      x: Math.round(frameCoords.x * scaleX),
      y: Math.round(frameCoords.y * scaleY),
      width: Math.round(frameCoords.width * scaleX),
      height: Math.round(frameCoords.height * scaleY)
    };
  }
  
  console.log('\n📐 Calculation:');
  console.log('  Transform method: ' + transformMethod);
  console.log('  Aspect ratio difference: ' + aspectDiff.toFixed(4));
  console.log('  Expected crop area:', expectedCrop);
  
  // Verify the scaling makes sense
  const frameArea = frameCoords.width * frameCoords.height;
  const expectedCropArea = expectedCrop.width * expectedCrop.height;
  const photoArea = photoSize.width * photoSize.height;
  
  const frameToContainerRatio = frameArea / (containerSize.width * containerSize.height);
  const expectedCropToPhotoRatio = expectedCropArea / photoArea;
  
  console.log('\n📊 Area Analysis:');
  console.log('  Frame covers ' + (frameToContainerRatio * 100).toFixed(1) + '% of container');
  console.log('  Expected crop covers ' + (expectedCropToPhotoRatio * 100).toFixed(1) + '% of photo');
  console.log('  Ratio difference: ' + Math.abs(frameToContainerRatio - expectedCropToPhotoRatio).toFixed(4));
  
  if (Math.abs(frameToContainerRatio - expectedCropToPhotoRatio) < 0.01) {
    console.log('✅ GOOD: Area ratios match - scaling should be accurate');
  } else {
    console.log('⚠️ WARNING: Area ratios differ - check for aspect ratio issues');
  }
  
  // Check if coordinates are within bounds
  const withinBounds = 
    expectedCrop.x >= 0 && expectedCrop.y >= 0 &&
    expectedCrop.x + expectedCrop.width <= photoSize.width &&
    expectedCrop.y + expectedCrop.height <= photoSize.height;
    
  if (withinBounds) {
    console.log('✅ GOOD: Expected crop is within photo bounds');
  } else {
    console.log('❌ ERROR: Expected crop exceeds photo bounds');
  }
  
  console.log('\n🎯 === EXPECTED RESULT ===');
  console.log('The crop should extract this area from the photo:');
  console.log('  Top-left corner: (' + expectedCrop.x + ', ' + expectedCrop.y + ')');
  console.log('  Size: ' + expectedCrop.width + ' × ' + expectedCrop.height + ' pixels');
  console.log('  This should match exactly what was inside your blue dotted frame');
  console.log('🔍 === DIAGNOSTIC COMPLETE ===\n');
  
  return expectedCrop;
};

// Test with your exact values from the logs
export const testWithYourValues = () => {
  console.log('🧪 Testing with your actual values from the logs...\n');
  
  const frameCoords = {
    x: 64.66666412353516,
    y: 371.3333435058594,
    width: 301,
    height: 189.33334350585938
  };
  
  const photoSize = {
    width: 4224,  // ✅ CORRECT: From your logs
    height: 2376
  };
  
  const containerSize = {
    width: 430,
    height: 932
  };
  
  return diagnoseCropping(frameCoords, photoSize, containerSize);
};

// Quick test function you can call immediately
export const quickTest = () => {
  const expected = testWithYourValues();
  
  console.log('🚀 Quick Summary:');
  console.log('Before fix: You were passing frame size (301×189) as photo size');
  console.log('After fix: Now using actual photo size (4224×2376)');
  console.log('Expected crop area: ' + expected.x + ',' + expected.y + ' size ' + expected.width + '×' + expected.height);
  console.log('This should now match your blue dotted frame content! 🎯');
};