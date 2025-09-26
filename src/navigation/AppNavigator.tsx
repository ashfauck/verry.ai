import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {useRecoilValue} from 'recoil';
import {isVerificationCompleteSelector} from '@store/atoms';

import EmailVerificationScreen from '@screens/EmailVerificationScreen';
import DocumentVerificationScreen from '@screens/DocumentVerificationScreen';
import DocumentConfirmationScreen from '@screens/DocumentConfirmationScreen';
import FaceVerificationScreen from '@screens/FaceVerificationScreen';
import OnboardingScreen from '@screens/OnboardingScreen';
import HomeScreen from '@screens/HomeScreen';

export type RootStackParamList = {
  Onboarding: undefined;
  EmailVerification: undefined;
  DocumentVerification: {step: 'front' | 'back'};
  DocumentConfirmation: {
    step: 'front' | 'back';
    originalImageUri: string;
    croppedImageUri: string;
    bounds: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
  FaceVerification: undefined;
  Home: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const isVerificationComplete = useRecoilValue(isVerificationCompleteSelector);

  return (
    <Stack.Navigator
      initialRouteName={isVerificationComplete ? 'Home' : 'Onboarding'}
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
      <Stack.Screen name="DocumentVerification" component={DocumentVerificationScreen} />
      <Stack.Screen name="DocumentConfirmation" component={DocumentConfirmationScreen} />
      <Stack.Screen name="FaceVerification" component={FaceVerificationScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;