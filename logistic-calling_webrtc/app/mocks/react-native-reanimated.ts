// Mock implementation for react-native-reanimated
// This is a temporary fallback to allow the app to build without reanimated's native modules

import { View as RNView, ViewProps } from 'react-native';
import React from 'react';

// Mock Animated View component
export const View: React.ComponentType<ViewProps> = RNView as any;

// Mock useSharedValue hook
export const useSharedValue = (initialValue: any) => {
  return { value: initialValue };
};

// Mock useAnimatedStyle hook
export const useAnimatedStyle = (callback: () => any) => {
  return callback();
};

// Mock useDerivedValue hook
export const useDerivedValue = (callback: () => any, dependencies?: any[]) => {
  return { value: callback() };
};

// Mock withTiming function
export const withTiming = (toValue: any, config?: any, callback?: any) => {
  if (callback) callback(true);
  return toValue;
};

// Mock withSpring function
export const withSpring = (toValue: any, config?: any, callback?: any) => {
  if (callback) callback(true);
  return toValue;
};

// Mock withDelay function
export const withDelay = (delay: number, animation: any) => {
  return animation;
};

// Mock withSequence function
export const withSequence = (...animations: any[]) => {
  return animations[animations.length - 1];
};

// Mock withRepeat function
export const withRepeat = (animation: any, numberOfReps?: number, reverse?: boolean, callback?: any) => {
  if (callback) callback(true);
  return animation;
};

// Mock useAnimatedScrollHandler
export const useAnimatedScrollHandler = (handlers: any) => {
  return handlers;
};

// Mock useAnimatedGestureHandler
export const useAnimatedGestureHandler = (handlers: any) => {
  return handlers;
};

// Mock useAnimatedProps
export const useAnimatedProps = (callback: () => any) => {
  return callback();
};

// Mock useAnimatedReaction
export const useAnimatedReaction = (prepare: () => any, react: (prepared: any) => void, dependencies?: any[]) => {
  // No-op in mock
};

// Mock runOnJS
export const runOnJS = (fn: Function) => {
  return (...args: any[]) => fn(...args);
};

// Mock Extrapolate enum
export const Extrapolate = {
  CLAMP: 'clamp',
  EXTEND: 'extend',
  IDENTITY: 'identity',
};

// Mock interpolate
export const interpolate = (
  value: number,
  inputRange: number[],
  outputRange: number[],
  extrapolate?: any
) => {
  return value;
};

// Mock Easing
export const Easing = {
  linear: (t: number) => t,
  ease: (t: number) => t,
  quad: (t: number) => t * t,
  cubic: (t: number) => t * t * t,
  bezier: () => (t: number) => t,
  in: (easing: any) => easing,
  out: (easing: any) => easing,
  inOut: (easing: any) => easing,
};

// Mock useEvent (required by react-native-gesture-handler)
export const useEvent = (handler: any, eventNames?: string[], rebuild?: boolean) => {
  return handler;
};

const Animated = {
  View,
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  useAnimatedScrollHandler,
  useAnimatedGestureHandler,
  useAnimatedProps,
  useAnimatedReaction,
  runOnJS,
  Extrapolate,
  interpolate,
  Easing,
  useEvent,
};

// Export Reanimated object for gesture-handler compatibility
export const Reanimated = {
  useEvent,
  useSharedValue,
  useDerivedValue,
  useAnimatedStyle,
  useAnimatedProps,
  useAnimatedReaction,
  withTiming,
  withSpring,
  runOnJS,
};

export default Animated;
