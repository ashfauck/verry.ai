import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import {useTheme} from '../components/ThemeProvider';
import environment, {isDevelopment, isProduction} from '../config/environment';
import {logger} from '../utils/logger';

const EnvironmentInfoScreen: React.FC = () => {
  const {theme} = useTheme();

  // Log environment info on mount
  React.useEffect(() => {
    logger.info('Environment Info Screen mounted', {
      nodeEnv: environment.nodeEnv,
      apiBaseUrl: environment.apiBaseUrl,
      debugMode: environment.debugMode,
    });
  }, []);

  const renderConfigItem = (label: string, value: string | number | boolean) => (
    <View style={[styles.configItem, {borderBottomColor: theme.colors.border}]}>
      <Text style={[styles.configLabel, {color: theme.colors.textSecondary}]}>
        {label}
      </Text>
      <Text style={[styles.configValue, {color: theme.colors.textPrimary}]}>
        {String(value)}
      </Text>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      padding: 20,
    },
    header: {
      marginBottom: 30,
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    section: {
      marginBottom: 25,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      marginBottom: 15,
    },
    configItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    configLabel: {
      fontSize: 14,
      flex: 1,
    },
    configValue: {
      fontSize: 14,
      fontWeight: '500',
      textAlign: 'right',
      flex: 1,
    },
    environmentBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: isDevelopment() ? '#10B981' : '#F59E0B',
      alignSelf: 'center',
      marginBottom: 20,
    },
    environmentBadgeText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Environment Configuration</Text>
          <Text style={styles.subtitle}>Current app configuration settings</Text>
          
          <View style={styles.environmentBadge}>
            <Text style={styles.environmentBadgeText}>
              {environment.nodeEnv}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Environment</Text>
          {renderConfigItem('Node Environment', environment.nodeEnv)}
          {renderConfigItem('Debug Mode', environment.debugMode)}
          {renderConfigItem('Log Level', environment.logLevel)}
          {renderConfigItem('Flipper Enabled', environment.enableFlipper)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Configuration</Text>
          {renderConfigItem('Base URL', environment.apiBaseUrl)}
          {renderConfigItem('API Version', environment.apiVersion)}
          {renderConfigItem('Timeout (ms)', environment.apiTimeout)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Document Scanner</Text>
          {renderConfigItem('Image Quality', environment.documentScannerQuality)}
          {renderConfigItem('Max Documents', environment.documentScannerMaxDocuments)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Face Verification</Text>
          {renderConfigItem('Detection Confidence', environment.faceDetectionConfidence)}
          {renderConfigItem('Capture Timeout (ms)', environment.faceCaptureTimeout)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Camera Settings</Text>
          {renderConfigItem('Quality', environment.cameraQuality)}
          {renderConfigItem('Flash Mode', environment.cameraFlashMode)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analytics & Reporting</Text>
          {renderConfigItem('Analytics Enabled', environment.analyticsEnabled)}
          {renderConfigItem('Error Reporting', environment.errorReportingEnabled)}
          {renderConfigItem('Certificate Pinning', environment.certificatePinning || false)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Theme & UI</Text>
          {renderConfigItem('Default Theme', environment.defaultTheme)}
          {renderConfigItem('Metro Port', environment.metroPort)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EnvironmentInfoScreen;