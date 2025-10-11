import React, {useState} from 'react';
import { apiService } from '../services/apiService';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useRecoilState, useRecoilValue} from 'recoil';
import {useNavigation} from '@react-navigation/native';
import {useTheme} from '../components/ThemeProvider';
import {Button} from '../components';
import {attemptIdState, verificationState} from '../store/atoms';
import {STRINGS, VALIDATION} from '../constants';
import type {NavigationProps} from '../types';

const EmailVerificationScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<NavigationProps['navigation']>();
  const [verification, setVerification] = useRecoilState(verificationState);
  
  const [email, setEmail] = useState(verification.email || '');
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const attemptId = useRecoilValue(attemptIdState);

  const validateEmail = (emailText: string): boolean => {
    return VALIDATION.email.pattern.test(emailText) && emailText.length <= VALIDATION.email.maxLength;
  };

  const validateCode = (code: string): boolean => {
    return VALIDATION.verificationCode.pattern.test(code);
  };

  const sendVerificationCode = async () => {
    if (!validateEmail(email)) {
      Alert.alert(STRINGS.common.error, STRINGS.auth.invalidEmail);
      return;
    }

    setIsLoading(true);
    try {
      // Generate a verificationAttemptId (UUID)
      // Always use verificationAttemptId from Recoil state, generate/store if missing
      if (!attemptId) {
        setVerification(prev => ({
          ...prev,
          attemptId,
        }));
      }

      const response = await apiService.sendVerificationEmail({
        email,
        verificationAttemptId: attemptId || '',
      });

      if (response.success) {
        setVerification(prev => ({
          ...prev,
          email,
          attemptId,
          error: null,
        }));
        setIsCodeSent(true);
        setTimer(60); // Start 60 second timer
        // Start countdown
        const interval = setInterval(() => {
          setTimer(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        Alert.alert(STRINGS.common.error, response.error || STRINGS.errors.networkError);
      }
    } catch (error: any) {
      Alert.alert(STRINGS.common.error, error.message || STRINGS.errors.networkError);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!validateCode(verificationCode)) {
      Alert.alert(STRINGS.common.error, STRINGS.auth.invalidCode);
      return;
    }

    setIsLoading(true);
    try {
      
      const response = await apiService.verifyEmailCode({
        email,
        code: verificationCode,
        verificationAttemptId: attemptId || '',
      });

      if (response.success) {
          setVerification(prev => ({
            ...prev,
            emailVerified: true,
            currentStep: 'document_front',
            error: null,
          }));

        navigation.navigate('DocumentCapture');
      } else {
          Alert.alert(STRINGS.common.error, response.error || STRINGS.errors.networkError);
      }
      
    } catch (error) {
      Alert.alert(STRINGS.common.error, STRINGS.errors.networkError);
    } finally {
      setIsLoading(false);
    }
  };

  const skipEmailVerification = () => {
    // Skip directly without confirmation alert
    setVerification(prev => ({
      ...prev,
      emailVerified: false,
      currentStep: 'document_front',
      error: null,
    }));
    navigation.navigate('DocumentCapture');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContainer: {
      flexGrow: 1,
      padding: theme.spacing.lg,
      justifyContent: 'center',
    },
    title: {
      fontSize: theme.typography.fontSize['2xl'],
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
    },
    subtitle: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
    },
    inputContainer: {
      marginBottom: theme.spacing.lg,
    },
    label: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.sm,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.inputBorder,
      backgroundColor: theme.colors.inputBackground,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.inputText,
    },
    codeInput: {
      textAlign: 'center',
      fontSize: theme.typography.fontSize.xl,
      letterSpacing: 4,
    },
    buttonContainer: {
      marginTop: theme.spacing.lg,
    },
    resendContainer: {
      alignItems: 'center',
      marginTop: theme.spacing.md,
    },
    resendText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
    },
    timerText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.primary,
      fontWeight: theme.typography.fontWeight.medium,
    },
    skipContainer: {
      alignItems: 'center',
      marginTop: theme.spacing.md,
    },
  });

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>{STRINGS.auth.emailVerification}</Text>
        
        {!isCodeSent ? (
          <>
            <Text style={styles.subtitle}>
              Enter your email address to receive a verification code
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{STRINGS.auth.emailLabel}</Text>
              <TextInput
                style={styles.input}
                placeholder={STRINGS.auth.emailPlaceholder}
                placeholderTextColor={theme.colors.inputPlaceholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View style={styles.buttonContainer}>
              <Button
                title={STRINGS.auth.sendCode}
                onPress={sendVerificationCode}
                loading={isLoading}
                disabled={!email.trim() || isLoading}
                fullWidth
              />
            </View>

            <View style={styles.skipContainer}>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to {email}
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{STRINGS.auth.verificationCode}</Text>
              <TextInput
                style={[styles.input, styles.codeInput]}
                placeholder={STRINGS.auth.codePlaceholder}
                placeholderTextColor={theme.colors.inputPlaceholder}
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="numeric"
                maxLength={6}
                editable={!isLoading}
              />
            </View>

            <View style={styles.buttonContainer}>
              <Button
                title={STRINGS.auth.verifyEmail}
                onPress={verifyCode}
                loading={isLoading}
                disabled={verificationCode.length !== 6 || isLoading}
                fullWidth
              />
            </View>

            <View style={styles.resendContainer}>
              {timer > 0 ? (
                <Text style={styles.timerText}>
                  Resend code in {timer}s
                </Text>
              ) : (
                <Button
                  title={STRINGS.auth.resendCode}
                  onPress={sendVerificationCode}
                  variant="ghost"
                  size="small"
                  disabled={isLoading}
                />
              )}
            </View>

            <View style={styles.skipContainer}>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EmailVerificationScreen;