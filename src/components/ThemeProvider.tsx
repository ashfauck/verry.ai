import React, {createContext, useContext, useEffect, useMemo} from 'react';
import {StatusBar, useColorScheme} from 'react-native';
import {useRecoilState} from 'recoil';
import {themeState} from '@store/atoms';
import {COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, ANIMATION} from '@constants/theme';
import type {Theme, ThemeMode} from '../types';

interface ThemeContextValue {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({children}) => {
  const [themeMode, setThemeMode] = useRecoilState(themeState);
  const systemColorScheme = useColorScheme();
  
  // Determine if dark mode should be active
  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemColorScheme]);

  // Create theme object
  const theme: Theme = useMemo(() => ({
    colors: isDark ? COLORS.dark : COLORS.light,
    typography: TYPOGRAPHY,
    spacing: SPACING,
    borderRadius: BORDER_RADIUS,
    shadows: SHADOWS,
    animation: ANIMATION,
  }), [isDark]);

  // Update status bar style when theme changes
  useEffect(() => {
    StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content', true);
  }, [isDark]);

  const value: ThemeContextValue = {
    theme,
    themeMode,
    isDark,
    setThemeMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
        translucent={false}
      />
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;