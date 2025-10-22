import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Animated,
  Image,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useRecoilValue, useRecoilState} from 'recoil';
import {useTheme} from '../components/ThemeProvider';
import {Button, Logo} from '../components';
import {verificationState, verificationProgressSelector, themeState, verificationIdState, attemptIdState} from '../store/atoms';
import {STRINGS} from '../constants/strings';
import {isDevelopment} from '../config/environment';
import {apiService} from '../services/apiService';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const {theme, themeMode, setThemeMode, isDark} = useTheme();
  const verification = useRecoilValue(verificationState);
  const progress = useRecoilValue(verificationProgressSelector);
  const [currentTheme, setCurrentTheme] = useRecoilState(themeState);
  const [localProgress, setLocalProgress] = useState(70);
  const progressAnimation = useRef(new Animated.Value(10)).current;
  const verificationId = useRecoilValue(verificationIdState);
  const attemptId = useRecoilValue(attemptIdState);
  const [hasScoredFinal, setHasScoredFinal] = useState(false);

  useEffect(() => {
    if (localProgress < 100) {
      const timer = setTimeout(() => {
        const newProgress = Math.min(localProgress + 10, 100);
        setLocalProgress(newProgress);
        
        // Animate to the new progress value smoothly
        Animated.timing(progressAnimation, {
          toValue: newProgress,
          duration: 600, // Smooth 600ms animation
          useNativeDriver: false, // Width animations don't support native driver
        }).start();
      }, 600); // Increment every 600 milliseconds

      return () => clearTimeout(timer);
    }
  }, [localProgress, progressAnimation]);

  // Fire final stage scoring when HomeScreen mounts (verification complete)
  // useEffect(() => {
  //   if (verificationId && attemptId && !hasScoredFinal) {
  //     setHasScoredFinal(true);
  //     apiService.scoreMobileAppStage({
  //       verification_id: verificationId,
  //       attempt_id: attemptId,
  //       stage: 'final',
  //     }).catch(error => {
  //       console.warn('Final stage scoring failed:', error);
  //       // Don't block user flow on scoring failure
  //     });
  //   }
  // }, [verificationId, attemptId, hasScoredFinal]);

  const toggleTheme = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setCurrentTheme(newTheme);
    setThemeMode(newTheme);
  };

  const getVerificationStatus = (verified: boolean) => {
    return verified ? '✅' : '⏳';
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContainer: {
      flexGrow: 1,
      padding: theme.spacing.lg,
    },
    header: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      marginBottom: theme.spacing.xl,
    },
    welcomeText: {
      fontSize: theme.typography.fontSize['3xl'],
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    appName: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.primary,
    },
    logoContainer: {
      marginTop: theme.spacing.md,
    },
    progressContainer: {
      backgroundColor: theme.colors.cardBackground,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.xl,
      ...theme.shadows.sm,
    },
    progressTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.md,
    },
    progressBar: {
      height: 8,
      backgroundColor: theme.colors.border,
      borderRadius: 4,
      marginBottom: theme.spacing.md,
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.colors.success,
      borderRadius: 4,
    },
    progressText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    statusContainer: {
      backgroundColor: theme.colors.cardBackground,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.xl,
      ...theme.shadows.sm,
    },
    statusTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.md,
    },
    statusItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 0,
      borderBottomColor: theme.colors.divider,
    },
    statusIcon: {
      fontSize: 20,
      marginRight: theme.spacing.md,
    },
    statusText: {
      flex: 1,
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.textPrimary,
    },
    settingsContainer: {
      backgroundColor: theme.colors.cardBackground,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      ...theme.shadows.sm,
    },
    settingsTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.md,
    },
    themeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      bottom: theme.spacing.md,
    },
    themeText: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.textPrimary,
    },
    completeContainer: {
      alignItems: 'center',
      padding: theme.spacing.xl,
      backgroundColor: theme.colors.success,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.xl,
    },
    completeIcon: {
      fontSize: 60,
      marginBottom: theme.spacing.md,
    },
    completeText: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.textPrimary,
      // letterSpacing: 1,
      lineHeight: 30,
      textAlign: 'center',
      marginTop: theme.spacing.xl,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Logo size="large" variant="vertical" showTagline={true} style={styles.logoContainer} />
        </View> */}
        <View style={styles.header}>
          <Image
            source={!isDark ? require("../Assets/KYC_Completed_light.png") : require("../Assets/KYC_Completed.png")}
            style={[
              {
                width: 200,
                height: 200,
                resizeMode: "center",
                alignContent: "center",
                alignSelf: "center",
              },
            ]}
            resizeMode="center"
          />
          <Text style={{...styles.completeText, fontSize: theme.typography.fontSize['3xl']}}>{STRINGS.success.kycComplete}</Text>
          <Text style={styles.completeText}>{STRINGS.success.thanks}</Text>
        </View>
        {/* {localProgress === 100 ? (
          <View style={styles.completeContainer}>
            <Text style={styles.completeIcon}>🎉</Text>
            <Text style={styles.completeText}>
              {STRINGS.success.thanks}
            </Text>
          </View>
        ) : (
          <View style={styles.progressContainer}>
            <Text style={styles.progressTitle}>Verification Progress</Text>
            <View style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.progressFill, 
                  { 
                    width: progressAnimation.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    })
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{localProgress}% Complete</Text>
          </View>
        )} */}

        {/* <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>Verification Status</Text>

          <View style={styles.statusItem}>
            <Text style={styles.statusIcon}>
              {getVerificationStatus(verification.emailVerified !== null)}
            </Text>
            <Text style={styles.statusText}>Email Verification</Text>
          </View>

          <View style={styles.statusItem}>
            <Text style={styles.statusIcon}>
              {getVerificationStatus(verification.documentVerified !== null)}
            </Text>
            <Text style={styles.statusText}>Document Verification</Text>
          </View>
          <View style={[styles.statusItem, { borderBottomWidth: 0 }]}>
            <Text style={styles.statusIcon}>
              {getVerificationStatus(verification.faceVerified !== null)}
            </Text>
            <Text style={styles.statusText}>Facial Verification</Text>
          </View>
        </View> */}

        {/*  */}

        {/* {isDevelopment() && (
          <>
            <View style={styles.settingsContainer}>
              <Text style={styles.settingsTitle}>{STRINGS.settings.theme}</Text>
              <View style={styles.themeRow}>
                <Text style={styles.themeText}>
                  Current:{" "}
                  {currentTheme === "light" ? "Light Mode" : "Dark Mode"}
                </Text>
                <Button
                  title={currentTheme === "light" ? "🌙" : "☀️"}
                  onPress={toggleTheme}
                  variant="outline"
                  size="small"
                />
              </View>
              <Text style={styles.settingsTitle}>Developer Tools</Text>
              <Button
                title="Environment Configuration"
                onPress={() => (navigation as any).navigate("EnvironmentInfo")}
                variant="outline"
                size="small"
              />
            </View>
          </>
        )} */}
      </ScrollView>
      {/* Go to Home Button at the bottom */}
      <View
        style={{
          padding: theme.spacing.lg,
          backgroundColor: theme.colors.background,
        }}
      >
        <Button
          title="Go to Home"
          fullWidth
          onPress={() => (navigation as any).navigate("Onboarding")}
        />
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;