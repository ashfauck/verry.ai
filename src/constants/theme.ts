// Color palette for light and dark themes
export const COLORS = {
  light: {
    // Primary colors
    primary: '#1E3A8A',
    primaryLight: '#3B82F6',
    primaryDark: '#1E40AF',
    
    // Secondary colors
    secondary: '#10B981',
    secondaryLight: '#34D399',
    secondaryDark: '#059669',
    
    // Background colors
    background: '#FFFFFF',
    backgroundSecondary: '#F8FAFC',
    surface: '#FFFFFF',
    
    // Text colors
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    
    // Border and divider colors
    border: '#E5E7EB',
    divider: '#F3F4F6',
    
    // Status colors
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
    
    // Button colors
    buttonPrimary: '#1E3A8A',
    buttonSecondary: '#F3F4F6',
    buttonText: '#FFFFFF',
    buttonTextSecondary: '#1F2937',
    
    // Input colors
    inputBackground: '#FFFFFF',
    inputBorder: '#D1D5DB',
    inputText: '#1F2937',
    inputPlaceholder: '#9CA3AF',
    
    // Card colors
    cardBackground: '#FFFFFF',
    cardBorder: '#E5E7EB',
    cardShadow: 'rgba(0, 0, 0, 0.1)',
  },
  orangeDark: {
    // Primary colors
    primary: '#47CEF1',
    primaryLight: '#9F5255',
    primaryDark: '#47CEF9',
    
    // Secondary colors
    secondary: '#10B981',
    secondaryLight: '#34D399',
    secondaryDark: '#059669',
    
    // Background colors
    background: '#000',
    backgroundSecondary: '#44444E',
    surface: '#373551',
    
    // Text colors
    textPrimary: '#F9FAFB',
    textSecondary: '#D1D5DB',
    textTertiary: '#9CA3AF',
    
    // Border and divider colors
    border: '#374151',
    divider: '#4B5563',
    
    // Status colors
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
    
    // Button colors
    buttonPrimary: '#FF5758',
    buttonSecondary: '#D3DAD9',
    buttonText: '#fff',
    buttonTextSecondary: '#F9FAFB',
    
    // Input colors
    inputBackground: '#374151',
    inputBorder: '#4B5563',
    inputText: '#F9FAFB',
    inputPlaceholder: '#9CA3AF',
    
    // Card colors
    cardBackground: '#444',
    cardBorder: '#A04747',
    cardShadow: 'rgba(0, 0, 0, 0.25)',
  },
  dark: {
    // Primary colors
    primary: '#3B82F6',
    primaryLight: '#60A5FA',
    primaryDark: '#2563EB',
    
    // Secondary colors
    secondary: '#10B981',
    secondaryLight: '#34D399',
    secondaryDark: '#059669',
    
    // Background colors
    background: '#111827',
    backgroundSecondary: '#1F2937',
    surface: '#374151',
    
    // Text colors
    textPrimary: '#F9FAFB',
    textSecondary: '#D1D5DB',
    textTertiary: '#9CA3AF',
    
    // Border and divider colors
    border: '#374151',
    divider: '#4B5563',
    
    // Status colors
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
    
    // Button colors
    buttonPrimary: '#3B82F6',
    buttonSecondary: '#374151',
    buttonText: '#FFFFFF',
    buttonTextSecondary: '#F9FAFB',
    
    // Input colors
    inputBackground: '#374151',
    inputBorder: '#4B5563',
    inputText: '#F9FAFB',
    inputPlaceholder: '#9CA3AF',
    
    // Card colors
    cardBackground: '#1F2937',
    cardBorder: '#374151',
    cardShadow: 'rgba(0, 0, 0, 0.25)',
  },
} as const;

// Typography
export const TYPOGRAPHY = {
  // Font families
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  // Line heights
  lineHeight: {
    xs: 16,
    sm: 20,
    base: 24,
    lg: 28,
    xl: 32,
    '2xl': 36,
    '3xl': 42,
    '4xl': 48,
    '5xl': 64,
  },
  
  // Font weights
  fontWeight: {
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

// Border radius
export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// Shadows
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;

// Animation durations
export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;