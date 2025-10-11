import { Animated, Platform, StatusBar, View, Text, StyleSheet } from 'react-native';
import React from 'react';

interface SnackbarProps {
  message: string;
  type?: 'error' | 'success' | 'info' | 'warning';
  visible: boolean;
}

const Snackbar: React.FC<SnackbarProps> = ({ message, type = 'info', visible }) => {
  if (!visible) return null;
  // Calculate top offset for status bar/notch
  const topOffset = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;
  let backgroundColor = '#1976D2';
  if (type === 'error') backgroundColor = '#D32F2F';
  if (type === 'success') backgroundColor = '#388E3C';
  if (type === 'info') backgroundColor = '#1976D2';
  if (type === 'warning') backgroundColor = '#FFA000';
  const containerStyle = [
    styles.container,
    { paddingTop: topOffset + 16, minHeight: topOffset + 48, backgroundColor }
  ];
  return (
    <Animated.View style={containerStyle}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0, // Cover status bar
    left: 0,
    right: 0,
  paddingTop: 0, // Adjusted to be set dynamically
    paddingBottom: 16,
    zIndex: 9999,
    alignItems: 'center',
    elevation: 10,
    backgroundColor: '#1976D2',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // ...existing code...
});

export default Snackbar;
