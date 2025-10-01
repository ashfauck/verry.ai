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

  // Use simplified container-based preview bounds (matching frameCropper logic)
  const containerWidth = screenWidth;
  const containerHeight = screenHeight;
  const containerAspect = containerWidth / containerHeight;
  const photoAspect = photoSize.width / photoSize.height;
  
  // Preview bounds = container bounds (simplified approach)
  const previewBounds = {
    x: 0,
    y: 0,
    width: containerWidth,
    height: containerHeight
  };
  
  // Direct scaling from container to photo
  const containerToPhotoScaleX = photoSize.width / containerWidth;
  const containerToPhotoScaleY = photoSize.height / containerHeight;
  
  // Apply direct scaling
  const photoX = documentBounds.x * containerToPhotoScaleX;
  const photoY = documentBounds.y * containerToPhotoScaleY;
  const photoWidth = documentBounds.width * containerToPhotoScaleX;
  const photoHeight = documentBounds.height * containerToPhotoScaleY;
  
  const imageBounds = {
    x: Math.max(0, Math.round(photoX)),
    y: Math.max(0, Math.round(photoY)),
    width: Math.max(50, Math.min(photoSize.width - Math.max(0, Math.round(photoX)), Math.round(photoWidth))),
    height: Math.max(50, Math.min(photoSize.height - Math.max(0, Math.round(photoY)), Math.round(photoHeight))),
  };
  
  const aspectMismatch = Math.abs(containerAspect - photoAspect) > 0.1;
  const frameWithinBounds = documentBounds.x >= 0 && documentBounds.y >= 0 && 
    documentBounds.x + documentBounds.width <= containerWidth &&
    documentBounds.y + documentBounds.height <= containerHeight;

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
        Blue Box (container):{'\n'}
        x:{documentBounds.x.toFixed(0)} y:{documentBounds.y.toFixed(0)}{'\n'}
        w:{documentBounds.width.toFixed(0)} h:{documentBounds.height.toFixed(0)}{'\n'}
        {'\n'}
        Final Crop (photo):{'\n'}
        x:{imageBounds.x} y:{imageBounds.y}{'\n'}
        w:{imageBounds.width} h:{imageBounds.height}{'\n'}
        {'\n'}
        Container→Photo Scale: {containerToPhotoScaleX.toFixed(3)}×{containerToPhotoScaleY.toFixed(3)}{'\n'}
        Crop Area: {((imageBounds.width * imageBounds.height) / (photoSize.width * photoSize.height) * 100).toFixed(1)}%{'\n'}
        Aspects: {containerAspect.toFixed(3)} | {photoAspect.toFixed(3)}{'\n'}
        Method: Direct-Container-Mapping
      </Text>
      
      {!frameWithinBounds ? (
        <Text style={styles.warningText}>
          ⚠️ Frame outside container bounds!{'\n'}
          Check frame positioning
        </Text>
      ) : aspectMismatch ? (
        <Text style={styles.warningText}>
          ⚠️ Aspect mismatch detected{'\n'}
          Using direct container mapping
        </Text>
      ) : (
        <Text style={styles.successText}>
          ✅ Frame positioned correctly{'\n'}
          Direct mapping applied
        </Text>
      )}
    </View>
  );
};