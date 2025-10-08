import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useTheme} from '../components/ThemeProvider';
import {Button} from '../components';
import {STRINGS} from '../constants/strings';
import type {NavigationProps} from '../types';

const NotFoundScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<NavigationProps['navigation']>();

  const handleGoHome = () => {
    // Reset navigation stack and go to onboarding
    navigation.reset({
      index: 0,
      routes: [{name: 'Onboarding'}],
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    illustration: {
      fontSize: 120,
      marginBottom: theme.spacing.xl,
    },
    title: {
      fontSize: theme.typography.fontSize['3xl'],
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    subtitle: {
      fontSize: theme.typography.fontSize.lg,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: theme.typography.lineHeight.lg,
      marginBottom: theme.spacing['2xl'],
      paddingHorizontal: theme.spacing.lg,
    },
    description: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: theme.typography.lineHeight.base,
      marginBottom: theme.spacing['2xl'],
      paddingHorizontal: theme.spacing.lg,
    },
    buttonContainer: {
      width: '100%',
      paddingHorizontal: theme.spacing.lg,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.illustration}>🔍</Text>
        
        <Text style={styles.title}>Verification Not Found</Text>
        
        <Text style={styles.subtitle}>
          We couldn't find the verification you're looking for.
        </Text>
        
        <Text style={styles.description}>
          The verification link may be invalid, expired, or already used. 
          Please check the link or contact support if you continue to have issues.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Go to Home"
          onPress={handleGoHome}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
};

export default NotFoundScreen;