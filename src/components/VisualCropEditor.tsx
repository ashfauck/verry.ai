import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  Platform
} from 'react-native';
// For now, we'll use a simplified version without complex gestures
import { useTheme } from './ThemeProvider';
import ImageEditor from '@react-native-community/image-editor';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface VisualCropEditorProps {
  imageUri: string;
  imageSize: { width: number; height: number };
  initialCropArea?: CropArea;
  onCropComplete: (croppedImageUri: string, cropArea: CropArea) => void;
  onCancel: () => void;
}

/**
 * Visual Crop Editor - Let user manually adjust crop area on the actual photo
 * This eliminates all coordinate mapping issues by working directly on the displayed image
 */
export const VisualCropEditor: React.FC<VisualCropEditorProps> = ({
  imageUri,
  imageSize,
  initialCropArea,
  onCropComplete,
  onCancel
}) => {
  const { theme } = useTheme();
  
  // Calculate display size (fit image within screen with padding)
  const padding = 40;
  const maxDisplayWidth = screenWidth - (padding * 2);
  const maxDisplayHeight = screenHeight * 0.6; // Use 60% of screen for image
  
  const imageAspect = imageSize.width / imageSize.height;
  const maxAspect = maxDisplayWidth / maxDisplayHeight;
  
  let displayWidth, displayHeight;
  if (imageAspect > maxAspect) {
    // Image is wider - fit to width
    displayWidth = maxDisplayWidth;
    displayHeight = maxDisplayWidth / imageAspect;
  } else {
    // Image is taller - fit to height
    displayHeight = maxDisplayHeight;
    displayWidth = maxDisplayHeight * imageAspect;
  }
  
  // Scale factors between display and actual image
  const scaleX = imageSize.width / displayWidth;
  const scaleY = imageSize.height / displayHeight;
  
  // Initialize crop area (start with center portion if no initial area provided)
  const [cropArea, setCropArea] = useState<CropArea>(() => {
    if (initialCropArea) {
      // Convert initial crop area from image space to display space
      return {
        x: initialCropArea.x / scaleX,
        y: initialCropArea.y / scaleY,
        width: initialCropArea.width / scaleX,
        height: initialCropArea.height / scaleY
      };
    }
    
    // Default: center 80% of the image
    const defaultWidth = displayWidth * 0.8;
    const defaultHeight = displayHeight * 0.6;
    return {
      x: (displayWidth - defaultWidth) / 2,
      y: (displayHeight - defaultHeight) / 2,
      width: defaultWidth,
      height: defaultHeight
    };
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Handle crop area changes
  const updateCropArea = (newArea: Partial<CropArea>) => {
    setCropArea(prev => {
      const updated = { ...prev, ...newArea };
      
      // Clamp to image bounds
      updated.x = Math.max(0, Math.min(updated.x, displayWidth - updated.width));
      updated.y = Math.max(0, Math.min(updated.y, displayHeight - updated.height));
      updated.width = Math.max(50, Math.min(updated.width, displayWidth - updated.x));
      updated.height = Math.max(50, Math.min(updated.height, displayHeight - updated.y));
      
      return updated;
    });
  };
  
  // Convert display crop area to image space and perform crop
  const handleCrop = async () => {
    setIsProcessing(true);
    
    try {
      // Convert crop area from display space to image space
      const imageCropArea = {
        x: Math.round(cropArea.x * scaleX),
        y: Math.round(cropArea.y * scaleY),
        width: Math.round(cropArea.width * scaleX),
        height: Math.round(cropArea.height * scaleY)
      };
      
      console.log('🎯 Visual Crop Editor - Converting coordinates:');
      console.log('  Display crop:', cropArea);
      console.log('  Scale factors:', { scaleX: scaleX.toFixed(3), scaleY: scaleY.toFixed(3) });
      console.log('  Image crop:', imageCropArea);
      
      // Perform the crop
      const cropData = {
        offset: { x: imageCropArea.x, y: imageCropArea.y },
        size: { width: imageCropArea.width, height: imageCropArea.height }
      };
      
      const result = await ImageEditor.cropImage(imageUri, cropData);
      const croppedUri = typeof result === 'string' ? result : result.uri;
      
      console.log('✅ Visual crop successful:', croppedUri);
      onCropComplete(croppedUri, imageCropArea);
      
    } catch (error) {
      console.error('❌ Visual crop failed:', error);
      Alert.alert('Crop Failed', 'Unable to crop the image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      position: 'absolute',
      top: 60,
      left: 0,
      right: 0,
      paddingHorizontal: 20,
      zIndex: 10,
    },
    headerText: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 8,
    },
    instructionText: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: 14,
      textAlign: 'center',
    },
    imageContainer: {
      position: 'relative',
      width: displayWidth,
      height: displayHeight,
    },
    image: {
      width: displayWidth,
      height: displayHeight,
      resizeMode: 'contain',
    },
    cropOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: displayWidth,
      height: displayHeight,
    },
    cropArea: {
      position: 'absolute',
      borderWidth: 2,
      borderColor: '#00FF00',
      borderStyle: 'dashed',
    },
    dimOverlay: {
      position: 'absolute',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    cropHandle: {
      position: 'absolute',
      width: 20,
      height: 20,
      backgroundColor: '#00FF00',
      borderRadius: 10,
      borderWidth: 2,
      borderColor: 'white',
    },
    topLeftHandle: { top: -10, left: -10 },
    topRightHandle: { top: -10, right: -10 },
    bottomLeftHandle: { bottom: -10, left: -10 },
    bottomRightHandle: { bottom: -10, right: -10 },
    centerDragArea: {
      position: 'absolute',
      top: 10,
      left: 10,
      right: 10,
      bottom: 10,
      backgroundColor: 'transparent',
    },
    buttonContainer: {
      position: 'absolute',
      bottom: 60,
      left: 20,
      right: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    button: {
      flex: 1,
      paddingVertical: 16,
      marginHorizontal: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    cropButton: {
      backgroundColor: theme.colors.primary,
    },
    buttonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    cropControls: {
      position: 'absolute',
      bottom: 200,
      left: 20,
      right: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    controlRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 8,
    },
    adjustButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginHorizontal: 4,
      borderRadius: 4,
      minWidth: 40,
      alignItems: 'center',
    },
    adjustButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: 'bold',
    },
    cropInfo: {
      position: 'absolute',
      bottom: 140,
      left: 20,
      right: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      borderRadius: 8,
    },
    cropInfoText: {
      color: 'white',
      fontSize: 12,
      textAlign: 'center',
      fontFamily: Platform.OS === 'ios' ? 'Menlo-Regular' : 'monospace',
    }
  });
  
  // Create dim overlays around crop area
  const renderDimOverlays = () => (
    <>
      {/* Top */}
      <View style={[styles.dimOverlay, {
        top: 0,
        left: 0,
        width: displayWidth,
        height: cropArea.y
      }]} />
      
      {/* Bottom */}
      <View style={[styles.dimOverlay, {
        top: cropArea.y + cropArea.height,
        left: 0,
        width: displayWidth,
        height: displayHeight - (cropArea.y + cropArea.height)
      }]} />
      
      {/* Left */}
      <View style={[styles.dimOverlay, {
        top: cropArea.y,
        left: 0,
        width: cropArea.x,
        height: cropArea.height
      }]} />
      
      {/* Right */}
      <View style={[styles.dimOverlay, {
        top: cropArea.y,
        left: cropArea.x + cropArea.width,
        width: displayWidth - (cropArea.x + cropArea.width),
        height: cropArea.height
      }]} />
    </>
  );
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Adjust Crop Area</Text>
        <Text style={styles.instructionText}>
          Adjust the green frame and tap "Crop Document" when ready
        </Text>
      </View>
      
      {/* Image with crop overlay */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUri }} style={styles.image} />
        
        {/* Crop overlay */}
        <View style={styles.cropOverlay}>
          {/* Dim areas outside crop */}
          {renderDimOverlays()}
          
          {/* Crop area border - simplified without gestures for now */}
          <View style={[styles.cropArea, {
            left: cropArea.x,
            top: cropArea.y,
            width: cropArea.width,
            height: cropArea.height
          }]}>
            {/* Resize handles */}
            <TouchableOpacity style={[styles.cropHandle, styles.topLeftHandle]} />
            <TouchableOpacity style={[styles.cropHandle, styles.topRightHandle]} />
            <TouchableOpacity style={[styles.cropHandle, styles.bottomLeftHandle]} />
            <TouchableOpacity style={[styles.cropHandle, styles.bottomRightHandle]} />
            
            {/* Center drag area */}
            <TouchableOpacity 
              style={styles.centerDragArea}
              onPress={() => {
                // For now, just use the current crop area as-is
                // In a full implementation, you'd add gesture handling here
                console.log('Crop area selected:', cropArea);
              }}
            />
          </View>
        </View>
      </View>
      
      {/* Crop controls */}
      <View style={styles.cropControls}>
        <View style={styles.controlRow}>
          <TouchableOpacity 
            style={styles.adjustButton}
            onPress={() => updateCropArea({ width: cropArea.width - 10 })}
          >
            <Text style={styles.adjustButtonText}>W-</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.adjustButton}
            onPress={() => updateCropArea({ width: cropArea.width + 10 })}
          >
            <Text style={styles.adjustButtonText}>W+</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.adjustButton}
            onPress={() => updateCropArea({ height: cropArea.height - 10 })}
          >
            <Text style={styles.adjustButtonText}>H-</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.adjustButton}
            onPress={() => updateCropArea({ height: cropArea.height + 10 })}
          >
            <Text style={styles.adjustButtonText}>H+</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.controlRow}>
          <TouchableOpacity 
            style={styles.adjustButton}
            onPress={() => updateCropArea({ x: cropArea.x - 5 })}
          >
            <Text style={styles.adjustButtonText}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.adjustButton}
            onPress={() => updateCropArea({ y: cropArea.y - 5 })}
          >
            <Text style={styles.adjustButtonText}>↑</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.adjustButton}
            onPress={() => updateCropArea({ y: cropArea.y + 5 })}
          >
            <Text style={styles.adjustButtonText}>↓</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.adjustButton}
            onPress={() => updateCropArea({ x: cropArea.x + 5 })}
          >
            <Text style={styles.adjustButtonText}>→</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Crop info */}
      <View style={styles.cropInfo}>
        <Text style={styles.cropInfoText}>
          Crop Size: {Math.round(cropArea.width * scaleX)} × {Math.round(cropArea.height * scaleY)} pixels{'\n'}
          Position: ({Math.round(cropArea.x * scaleX)}, {Math.round(cropArea.y * scaleY)}){'\n'}
          Scale: {scaleX.toFixed(2)}× display to image
        </Text>
      </View>
      
      {/* Action buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
          disabled={isProcessing}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.cropButton]}
          onPress={handleCrop}
          disabled={isProcessing}
        >
          <Text style={styles.buttonText}>
            {isProcessing ? 'Cropping...' : 'Crop Document'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};