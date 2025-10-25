import React from 'react';
import { View } from 'react-native';

// Mock Screen component
export const Screen = (props: any) => <View {...props} />;

// Mock ScreenContainer component
export const ScreenContainer = (props: any) => <View {...props} />;

// Mock ScreenStack component
export const ScreenStack = (props: any) => <View {...props} />;

// Mock NativeScreen component
export const NativeScreen = (props: any) => <View {...props} />;

// Mock ScreenStackHeaderConfig
export const ScreenStackHeaderConfig = (props: any) => <View {...props} />;

// Mock enableScreens function
export const enableScreens = () => {
  console.log('react-native-screens: enableScreens (mocked)');
};

// Mock screensEnabled function
export const screensEnabled = () => {
  console.log('react-native-screens: screensEnabled (mocked)');
  return false;
};

// Export everything
export default {
  Screen,
  ScreenContainer,
  ScreenStack,
  NativeScreen,
  ScreenStackHeaderConfig,
  enableScreens,
  screensEnabled,
};
