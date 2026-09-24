import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";

export const fullScreenBackStackOptions = {
  headerShown: false,
  gestureEnabled: true,
  fullScreenGestureEnabled: true,
  fullScreenGestureShadowEnabled: true,
} satisfies NativeStackNavigationOptions;

export const edgeBackStackOptions = {
  headerShown: false,
  gestureEnabled: true,
  fullScreenGestureEnabled: false,
} satisfies NativeStackNavigationOptions;
