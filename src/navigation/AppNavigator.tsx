import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {useRecoilValue} from 'recoil';
import {isVerificationCompleteSelector} from '@store/atoms';

import EmailVerificationScreen from '@screens/EmailVerificationScreen';
import DocumentCaptureScreen from '@screens/DocumentCaptureScreen';
import DocumentVerificationScreen from '@screens/DocumentVerificationScreen';
import FaceVerificationScreen from '@screens/FaceVerificationScreen';
import OnboardingScreen from '@screens/OnboardingScreen';
import HomeScreen from '@screens/HomeScreen';
import EnvironmentInfoScreen from '@screens/EnvironmentInfoScreen';
import NotFoundScreen from '@screens/NotFoundScreen';

export type RootStackParamList = {
  Onboarding: undefined;
  EmailVerification: undefined;
  DocumentCapture: undefined;
  DocumentVerification: {documentSide?: 'front' | 'back'; returnScreen?: string; step?: 'front' | 'back'};
  FaceVerification: undefined;
  Home: undefined;
  EnvironmentInfo: undefined;
  NotFound: undefined;
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
      <Stack.Screen name="DocumentCapture" component={DocumentCaptureScreen} />
      <Stack.Screen name="DocumentVerification" component={DocumentVerificationScreen} />
      <Stack.Screen name="FaceVerification" component={FaceVerificationScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="EnvironmentInfo" component={EnvironmentInfoScreen} />
      <Stack.Screen name="NotFound" component={NotFoundScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;