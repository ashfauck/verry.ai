import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useRecoilValue } from 'recoil';
import { Logo } from '@components/Logo';
import { useTheme } from '@components/ThemeProvider';
import { isVerificationCompleteSelector } from '@store/atoms';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '@navigation/AppNavigator';

type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;

const SplashScreen: React.FC = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const { theme } = useTheme();
  const isVerificationComplete = useRecoilValue(isVerificationCompleteSelector);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Navigate to the appropriate screen after splash
      if (isVerificationComplete) {
        navigation.replace('Home');
      } else {
        navigation.replace('Onboarding');
      }
    }, 2000); // Show splash for 2 seconds

    return () => clearTimeout(timer);
  }, [navigation, isVerificationComplete]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Logo 
        size="large" 
        variant="vertical" 
        showTagline={false} 
        style={styles.logoContainer} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SplashScreen;