import type { PropsWithChildren } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  type ScrollViewProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { appTheme } from "@/shared/config/theme";
import { useAppTheme } from "@/shared/lib/get-theme";

type ScreenProps = PropsWithChildren<ScrollViewProps>;

export function Screen({
  children,
  contentContainerStyle,
  style,
  ...props
}: ScreenProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <ScrollView
        {...props}
        style={[styles.base, { backgroundColor: theme.background }, style]}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, appTheme.spacing.screen),
            paddingBottom: appTheme.spacing.screen,
            paddingHorizontal: appTheme.spacing.screen,
          },
          contentContainerStyle,
        ]}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  base: {
    flex: 1,
  },
  content: {
    gap: appTheme.spacing.section,
  },
});
