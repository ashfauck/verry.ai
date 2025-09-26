import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface GuidanceProps {
  searching: boolean;
  lastFailure?: 'confidence' | 'sharpness' | 'area' | 'glare' | 'drift';
  darkMode?: boolean;
}

const messages: Record<string, string> = {
  confidence: 'Align the document inside the frame',
  sharpness: 'Hold steady',
  area: 'Move closer',
  glare: 'Reduce glare / tilt slightly',
  drift: 'Hold still',
};

export const DetectionGuidance: React.FC<GuidanceProps> = ({ searching, lastFailure, darkMode }) => {
  const base = searching ? 'Searching for document…' : lastFailure ? messages[lastFailure] : 'Capturing…';
  return (
    <View style={[styles.container, darkMode && styles.dark]}> 
      <Text style={[styles.text, darkMode && styles.textDark]}>{base}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  dark: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  text: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  textDark: {
    color: '#fff'
  }
});

export default DetectionGuidance;
