import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import AppIcon from '../Assets/appIcon.svg';
import { useTheme } from './ThemeProvider';

interface VerryIconProps {
  size: number;
}

const VerryIcon: React.FC<VerryIconProps> = ({ size }) => {
  return <AppIcon width={size} height={size} />;
};

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'horizontal' | 'vertical';
  showTagline?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'medium', 
  variant = 'horizontal',
  showTagline = false,
  style,
  textStyle 
}) => {
  const { theme } = useTheme();
  
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          iconSize: 24,
          textSize: 18,
          taglineSize: 12,
          spacing: 8,
        };
      case 'large':
        return {
          iconSize: 48,
          textSize: 32,
          taglineSize: 16,
          spacing: 16,
        };
      default: // medium
        return {
          iconSize: 32,
          textSize: 24,
          taglineSize: 14,
          spacing: 12,
        };
    }
  };
  
  const sizeStyles = getSizeStyles();
  
  const iconComponent = (
    <View style={[
      styles.iconContainer,
      {
        width: sizeStyles.iconSize,
        height: sizeStyles.iconSize,
      }
    ]}>
      <VerryIcon size={sizeStyles.iconSize} />
    </View>
  );
  
  const textComponent = (
    <View style={variant === 'horizontal' ? styles.textContainerHorizontal : styles.textContainerVertical}>
      <Text style={[
        styles.appName,
        {
          fontSize: sizeStyles.textSize,
          color: theme.colors.textPrimary,
        },
        textStyle
      ]}>
        Verry.ai
      </Text>
      {showTagline && (
        <Text style={[
          styles.tagline,
          {
            fontSize: sizeStyles.taglineSize,
            color: theme.colors.textSecondary,
          }
        ]}>
          Secure Identity Verification
        </Text>
      )}
    </View>
  );
  
  return (
    <View style={[
      variant === 'horizontal' ? styles.containerHorizontal : styles.containerVertical,
      { gap: sizeStyles.spacing },
      style
    ]}>
      {iconComponent}
      {textComponent}
    </View>
  );
};

const styles = StyleSheet.create({
  containerHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  containerVertical: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  textContainerHorizontal: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  textContainerVertical: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  appName: {
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  tagline: {
    fontFamily: 'System',
    marginTop: 2,
  },
});