import type { PropsWithChildren } from "react";
import { StyleSheet, type ViewStyle } from "react-native";

import { appTheme } from "@/shared/config/theme";
import { useAppTheme } from "@/shared/lib/get-theme";
import { View } from "@/shared/ui/themed";

type SectionCardProps = PropsWithChildren<{
  accentColor?: string;
  lightColor?: string;
  darkColor?: string;
  style?: ViewStyle;
}>;

export function SectionCard({
  accentColor,
  children,
  darkColor,
  lightColor,
  style,
}: SectionCardProps) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: theme.border,
          backgroundColor: theme.surface,
        },
        accentColor ? { borderLeftColor: accentColor } : null,
        style,
      ]}
      lightColor={lightColor}
      darkColor={darkColor}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderLeftWidth: 4,
    borderLeftColor: "transparent",
    borderWidth: 1,
    borderRadius: appTheme.radii.card,
    padding: appTheme.spacing.card,
    ...appTheme.shadows.card,
  },
});
