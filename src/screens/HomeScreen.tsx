import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import {useRecoilValue, useRecoilState} from 'recoil';
import {useTheme} from '../components/ThemeProvider';
import {Button} from '../components';
import {verificationState, verificationProgressSelector, themeState} from '../store/atoms';
import {STRINGS} from '../constants/strings';

const HomeScreen: React.FC = () => {
  const {theme, themeMode, setThemeMode} = useTheme();
  const verification = useRecoilValue(verificationState);
  const progress = useRecoilValue(verificationProgressSelector);
  const [currentTheme, setCurrentTheme] = useRecoilState(themeState);

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
      borderBottomWidth: 1,
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
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      color: 'white',
      textAlign: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.appName}>{STRINGS.appName}</Text>
        </View>

        {progress === 100 ? (
          <View style={styles.completeContainer}>
            <Text style={styles.completeIcon}>🎉</Text>
            <Text style={styles.completeText}>
              {STRINGS.success.verificationComplete}
            </Text>
          </View>
        ) : (
          <View style={styles.progressContainer}>
            <Text style={styles.progressTitle}>Verification Progress</Text>
            <View style={styles.progressBar}>
              <View 
                style={[styles.progressFill, { width: `${progress}%` }]} 
              />
            </View>
            <Text style={styles.progressText}>{progress}% Complete</Text>
          </View>
        )}

        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>Verification Status</Text>
          
          <View style={styles.statusItem}>
            <Text style={styles.statusIcon}>
              {getVerificationStatus(verification.emailVerified)}
            </Text>
            <Text style={styles.statusText}>Email Verification</Text>
          </View>
          
          <View style={styles.statusItem}>
            <Text style={styles.statusIcon}>
              {getVerificationStatus(verification.documentFront !== null)}
            </Text>
            <Text style={styles.statusText}>Document Front</Text>
          </View>
          
          <View style={styles.statusItem}>
            <Text style={styles.statusIcon}>
              {getVerificationStatus(verification.documentBack !== null)}
            </Text>
            <Text style={styles.statusText}>Document Back</Text>
          </View>
          
          <View style={[styles.statusItem, { borderBottomWidth: 0 }]}>
            <Text style={styles.statusIcon}>
              {getVerificationStatus(verification.faceVerified)}
            </Text>
            <Text style={styles.statusText}>Facial Verification</Text>
          </View>
        </View>

        <View style={styles.settingsContainer}>
          <Text style={styles.settingsTitle}>{STRINGS.settings.theme}</Text>
          
          <View style={styles.themeRow}>
            <Text style={styles.themeText}>
              Current: {currentTheme === 'light' ? 'Light Mode' : 'Dark Mode'}
            </Text>
            <Button
              title={currentTheme === 'light' ? '🌙' : '☀️'}
              onPress={toggleTheme}
              variant="outline"
              size="small"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;