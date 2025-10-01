/**
 * Cover Mode Test - Show expected results with your exact coordinates
 */

export const testCoverModeWithYourValues = () => {
  console.log('\n🎯 === COVER MODE TEST WITH YOUR VALUES ===');
  
  // Your exact values from logs
  const frameCoords = {
    x: 64.66666412353516,
    y: 371.3333435058594,
    width: 301,
    height: 189.33334350585938
  };
  
  const photoSize = { width: 4224, height: 2376 };
  const containerSize = { width: 430, height: 932 };
  
  console.log('📋 Input:');
  console.log('  Frame:', frameCoords);
  console.log('  Photo:', photoSize);
  console.log('  Container:', containerSize);
  
  // Calculate aspects
  const containerAspect = containerSize.width / containerSize.height; // 0.461
  const photoAspect = photoSize.width / photoSize.height; // 1.778
  const aspectDiff = Math.abs(containerAspect - photoAspect); // 1.317
  
  console.log('\n🔍 Aspect Analysis:');
  console.log('  Container aspect:', containerAspect.toFixed(3));
  console.log('  Photo aspect:', photoAspect.toFixed(3));
  console.log('  Difference:', aspectDiff.toFixed(3));
  console.log('  Needs cover mode:', aspectDiff > 0.1 ? 'YES ✅' : 'NO');
  
  // Cover mode calculation
  const scaleToFillWidth = containerSize.width / photoSize.width; // 0.1018
  const scaleToFillHeight = containerSize.height / photoSize.height; // 0.3925
  const coverScale = Math.max(scaleToFillWidth, scaleToFillHeight); // 0.3925
  
  console.log('\n⚙️ Cover Mode Calculation:');
  console.log('  Scale to fill width:', scaleToFillWidth.toFixed(4));
  console.log('  Scale to fill height:', scaleToFillHeight.toFixed(4));
  console.log('  Cover scale (max):', coverScale.toFixed(4));
  
  // Rendered preview size within container
  const renderedWidth = photoSize.width * coverScale; // 1657.7
  const renderedHeight = photoSize.height * coverScale; // 932.0
  
  console.log('  Rendered preview size:', renderedWidth.toFixed(1), '×', renderedHeight.toFixed(1));
  
  // Centering offset (where preview sits within container)
  const offsetX = (containerSize.width - renderedWidth) / 2; // -613.8
  const offsetY = (containerSize.height - renderedHeight) / 2; // 0.0
  
  console.log('  Preview offset:', offsetX.toFixed(1), ',', offsetY.toFixed(1));
  
  // Transform frame coordinates
  const adjustedX = frameCoords.x - offsetX; // 64.7 - (-613.8) = 678.5
  const adjustedY = frameCoords.y - offsetY; // 371.3 - 0.0 = 371.3
  
  console.log('\n🎯 Coordinate Transformation:');
  console.log('  Original frame:', frameCoords.x.toFixed(1), ',', frameCoords.y.toFixed(1));
  console.log('  Adjusted for offset:', adjustedX.toFixed(1), ',', adjustedY.toFixed(1));
  
  // Scale to photo space
  const scaleToPhoto = 1 / coverScale; // 2.548
  const finalX = adjustedX * scaleToPhoto; // 1729.2
  const finalY = adjustedY * scaleToPhoto; // 946.1
  const finalWidth = frameCoords.width * scaleToPhoto; // 767.0
  const finalHeight = frameCoords.height * scaleToPhoto; // 482.7
  
  console.log('  Scale to photo space:', scaleToPhoto.toFixed(3));
  console.log('  Final photo coordinates:', finalX.toFixed(1), ',', finalY.toFixed(1));
  console.log('  Final crop size:', finalWidth.toFixed(1), '×', finalHeight.toFixed(1));
  
  const expectedCrop = {
    x: Math.round(finalX),
    y: Math.round(finalY),
    width: Math.round(finalWidth),
    height: Math.round(finalHeight)
  };
  
  console.log('\n✨ EXPECTED CROP RESULT:');
  console.log('  Crop area: (' + expectedCrop.x + ', ' + expectedCrop.y + ')');
  console.log('  Crop size: ' + expectedCrop.width + ' × ' + expectedCrop.height + ' pixels');
  
  // Validate
  const inBounds = expectedCrop.x >= 0 && expectedCrop.y >= 0 && 
    expectedCrop.x + expectedCrop.width <= photoSize.width &&
    expectedCrop.y + expectedCrop.height <= photoSize.height;
    
  console.log('  Within photo bounds:', inBounds ? 'YES ✅' : 'NO ❌');
  
  if (inBounds) {
    console.log('\n🎉 This should now crop the exact content from your blue frame!');
  } else {
    console.log('\n⚠️ Coordinates are outside photo bounds - needs adjustment');
  }
  
  console.log('🎯 === COVER MODE TEST COMPLETE ===\n');
  
  return expectedCrop;
};

// Run test immediately when imported
console.log('🔧 Running cover mode test...');
testCoverModeWithYourValues();