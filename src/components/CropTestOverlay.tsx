import React from 'react';
import {View, Text, StyleSheet, Dimensions} from 'react-native';
import {useTheme} from './ThemeProvider';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

interface CropTestOverlayProps {
  documentBounds: {x: number; y: number; width: number; height: number} | null;
  photoSize: {width: number; height: number} | null;
  showOverlay: boolean;
}

/**
 * Visual overlay to test crop alignment
 * Shows the predicted crop area and coordinate information
 */
export const CropTestOverlay: React.FC<CropTestOverlayProps> = ({
  documentBounds,
  photoSize,
  showOverlay,
}) => {
  const {theme} = useTheme();

  if (!showOverlay || !documentBounds || !photoSize) {
    return null;
  }

  // Calculate camera preview bounds within the container (same logic as frameCropper)
  const containerWidth = screenWidth;
  const containerHeight = screenHeight;
  const containerAspect = containerWidth / containerHeight;
  const photoAspect = photoSize.width / photoSize.height;
  
  // Calculate actual camera preview bounds (cover-mode)
  let previewBounds: { x: number; y: number; width: number; height: number };
  
  if (Math.abs(containerAspect - photoAspect) < 0.01) {
    // Aspects match - preview fills entire container
    previewBounds = { x: 0, y: 0, width: containerWidth, height: containerHeight };
  } else if (photoAspect > containerAspect) {
    // Photo is wider than container - fit to container height, center horizontally
    const previewHeight = containerHeight;
    const previewWidth = previewHeight * photoAspect;
    previewBounds = {
      x: (containerWidth - previewWidth) / 2,
      y: 0,
      width: previewWidth,
      height: previewHeight
    };
  } else {
    // Photo is taller than container - fit to container width, center vertically  
    const previewWidth = containerWidth;
    const previewHeight = previewWidth / photoAspect;
    previewBounds = {
      x: 0,
      y: (containerHeight - previewHeight) / 2,
      width: previewWidth,
      height: previewHeight
    };
  }
  
  // Convert frame coordinates from container space to preview space
  const frameInPreview = {
    x: documentBounds.x - previewBounds.x,
    y: documentBounds.y - previewBounds.y,
    width: documentBounds.width,
    height: documentBounds.height
  };
  
  // Scale from preview coordinates to photo coordinates
  const previewToPhotoScaleX = photoSize.width / previewBounds.width;
  const previewToPhotoScaleY = photoSize.height / previewBounds.height;
  
  // Apply accurate scaling
  const photoX = frameInPreview.x * previewToPhotoScaleX;
  const photoY = frameInPreview.y * previewToPhotoScaleY;
  const photoWidth = frameInPreview.width * previewToPhotoScaleX;
  const photoHeight = frameInPreview.height * previewToPhotoScaleY;
  
  const imageBounds = {
    x: Math.max(0, Math.round(photoX)),
    y: Math.max(0, Math.round(photoY)),
    width: Math.max(50, Math.min(photoSize.width - Math.max(0, Math.round(photoX)), Math.round(photoWidth))),
    height: Math.max(50, Math.min(photoSize.height - Math.max(0, Math.round(photoY)), Math.round(photoHeight))),
  };
  
  const aspectMismatch = Math.abs(containerAspect - photoAspect) > 0.1;
  const frameOutsidePreview = frameInPreview.x < 0 || frameInPreview.y < 0 || 
    frameInPreview.x + frameInPreview.width > previewBounds.width ||
    frameInPreview.y + frameInPreview.height > previewBounds.height;

  const styles = StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 250, // Moved down to avoid header overlap
      right: 10,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      borderRadius: 8,
      maxWidth: 200,
      zIndex: 20, // Higher z-index to ensure visibility
    },
    title: {
      color: 'white',
      fontSize: 12,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    infoText: {
      color: 'white',
      fontSize: 10,
      fontFamily: 'monospace',
      lineHeight: 14,
    },
    warningText: {
      color: '#FF6B6B',
      fontSize: 10,
      fontWeight: 'bold',
      marginTop: 4,
    },
    successText: {
      color: '#51CF66',
      fontSize: 10,
      fontWeight: 'bold',
      marginTop: 4,
    },
  });

  return (
    <View style={styles.overlay}>
      <Text style={styles.title}>Crop Test Info</Text>
      
      <Text style={styles.infoText}>
        Screen: {screenWidth}×{screenHeight}{'\n'}
        Photo: {photoSize.width}×{photoSize.height}{'\n'}
        {'\n'}
        Preview Bounds:{'\n'}
        x:{previewBounds.x.toFixed(0)} y:{previewBounds.y.toFixed(0)}{'\n'}
        w:{previewBounds.width.toFixed(0)} h:{previewBounds.height.toFixed(0)}{'\n'}
        {'\n'}
        Blue Box (container):{'\n'}
        x:{documentBounds.x.toFixed(0)} y:{documentBounds.y.toFixed(0)}{'\n'}
        w:{documentBounds.width.toFixed(0)} h:{documentBounds.height.toFixed(0)}{'\n'}
        {'\n'}
        Frame in Preview:{'\n'}
        x:{frameInPreview.x.toFixed(0)} y:{frameInPreview.y.toFixed(0)}{'\n'}
        w:{frameInPreview.width.toFixed(0)} h:{frameInPreview.height.toFixed(0)}{'\n'}
        {'\n'}
        Final Crop (photo):{'\n'}
        x:{imageBounds.x} y:{imageBounds.y}{'\n'}
        w:{imageBounds.width} h:{imageBounds.height}{'\n'}
        {'\n'}
        Preview→Photo Scale: {previewToPhotoScaleX.toFixed(3)}×{previewToPhotoScaleY.toFixed(3)}{'\n'}
        Aspects: {containerAspect.toFixed(3)} | {photoAspect.toFixed(3)}{'\n'}
        Method: Camera-Preview-Aware
      </Text>
      
      {frameOutsidePreview ? (
        <Text style={styles.warningText}>
          ⚠️ Frame outside preview bounds!{'\n'}
          Cropping may be inaccurate
        </Text>
      ) : aspectMismatch ? (
        <Text style={styles.warningText}>
          ⚠️ Aspect mismatch detected{'\n'}
          Using preview bounds compensation
        </Text>
      ) : (
        <Text style={styles.successText}>
          ✅ Frame within preview bounds{'\n'}
          Accurate cropping expected
        </Text>
      )}
    </View>
  );
};