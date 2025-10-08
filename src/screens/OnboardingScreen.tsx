import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useRecoilValue} from 'recoil';
import {useTheme} from '../components/ThemeProvider';
import {Button} from '../components';
import {STRINGS} from '../constants/strings';
import {useVerificationStatus} from '../hooks/useVerificationStatus';
import {useDeepLinking} from '../hooks/useDeepLinking';
import {verificationIdState, attemptIdState} from '../store/atoms';
import type {NavigationProps} from '../types';

const {width: screenWidth} = Dimensions.get('window');

interface OnboardingStep {
  title: string;
  description: string;
  icon: string;
}

const OnboardingScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<NavigationProps['navigation']>();
  const [currentStep, setCurrentStep] = useState(0);
  
  // Verification status and deep linking
  const verificationId = useRecoilValue(verificationIdState);
  const attemptId = useRecoilValue(attemptIdState);
  const {checkVerificationStatus, isLoading, hasError, error} = useVerificationStatus();
  useDeepLinking(); // Initialize deep linking listener

  const onboardingSteps: OnboardingStep[] = [
    {
      title: STRINGS.onboarding.step1Title,
      description: STRINGS.onboarding.step1Description,
      icon: '📧',
    },
    {
      title: STRINGS.onboarding.step2Title,
      description: STRINGS.onboarding.step2Description,
      icon: '📄',
    },
    {
      title: STRINGS.onboarding.step3Title,
      description: STRINGS.onboarding.step3Description,
      icon: '👤',
    },
  ];

  // Handle verification status check and navigation
  const handleVerificationCheck = async () => {
    if (!verificationId) {
      // No verification ID from deep link, proceed normally
      navigation.navigate('EmailVerification');
      return;
    }

    // If we have both verification_id and attempt_id from deep link, proceed directly
    if (verificationId && attemptId) {
      console.log('Deep link contains both verification_id and attempt_id, proceeding to EmailVerification');
      navigation.navigate('EmailVerification');
      return;
    }

    // If we only have verification_id, check with API
    try {
      const result = await checkVerificationStatus(verificationId);
      
      if (result.success) {
        if (result.hasAttemptId) {
          // API confirms attempt_id exists, proceed to email verification
          navigation.navigate('EmailVerification');
        } else {
          // No attempt_id in API response, go to not found
          navigation.navigate('NotFound');
        }
      } else {
        // API call failed, show error and go to not found
        Alert.alert(
          'Verification Error',
          result.error || 'Failed to verify the link. Please try again.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('NotFound'),
            },
          ]
        );
      }
    } catch (error) {
      // Unexpected error
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('NotFound'),
          },
        ]
      );
    }
  };

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleVerificationCheck();
    }
  };

  const handleSkip = () => {
    handleVerificationCheck();
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
    welcomeTitle: {
      fontSize: theme.typography.fontSize['4xl'],
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    appName: {
      fontSize: theme.typography.fontSize['2xl'],
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.primary,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
    },
    stepContainer: {
      alignItems: 'center',
      marginVertical: theme.spacing['2xl'],
    },
    stepIcon: {
      fontSize: 80,
      marginBottom: theme.spacing.xl,
    },
    stepTitle: {
      fontSize: theme.typography.fontSize['2xl'],
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    stepDescription: {
      fontSize: theme.typography.fontSize.lg,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: theme.typography.lineHeight.lg,
      paddingHorizontal: theme.spacing.lg,
    },
    indicatorContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: theme.spacing.xl,
    },
    indicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginHorizontal: 4,
    },
    indicatorActive: {
      backgroundColor: theme.colors.primary,
    },
    indicatorInactive: {
      backgroundColor: theme.colors.border,
    },
    buttonContainer: {
      padding: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
    },
    skipButton: {
      alignSelf: 'flex-end',
      marginBottom: theme.spacing.lg,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {currentStep === 0 && (
          <>
            <Text style={styles.welcomeTitle}>Welcome to</Text>
            <Text style={styles.appName}>{STRINGS.appName}</Text>
            <Text style={styles.stepDescription}>{STRINGS.appTagline}</Text>
          </>
        )}
        
        <View style={styles.stepContainer}>
          <Text style={styles.stepIcon}>
            {onboardingSteps[currentStep].icon}
          </Text>
          <Text style={styles.stepTitle}>
            {onboardingSteps[currentStep].title}
          </Text>
          <Text style={styles.stepDescription}>
            {onboardingSteps[currentStep].description}
          </Text>
        </View>

        <View style={styles.indicatorContainer}>
          {onboardingSteps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentStep
                  ? styles.indicatorActive
                  : styles.indicatorInactive,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <View style={styles.skipButton}>
          <Button
            title={STRINGS.common.skip}
            onPress={handleSkip}
            variant="ghost"
            size="small"
          />
        </View>
        
        <Button
          title={
            currentStep === onboardingSteps.length - 1
              ? STRINGS.onboarding.getStarted
              : STRINGS.common.next
          }
          onPress={handleNext}
          fullWidth
          loading={isLoading}
          disabled={isLoading}
        />
      </View>
    </SafeAreaView>
  );
};

export default OnboardingScreen;