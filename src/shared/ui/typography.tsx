import type { PropsWithChildren } from "react";
import { StyleSheet, type StyleProp, type TextStyle } from "react-native";

import { appTheme } from "@/shared/config/theme";
import { useAppTheme } from "@/shared/lib/get-theme";
import { Text, type TextProps } from "@/shared/ui/themed";

type TypographyProps = PropsWithChildren<
  TextProps & {
    style?: StyleProp<TextStyle>;
  }
>;

export function Eyebrow(props: TypographyProps) {
  const theme = useAppTheme();
  return (
    <Text
      {...props}
      style={[styles.eyebrow, { color: theme.textMuted }, props.style]}
    />
  );
}

export function PageTitle(props: TypographyProps) {
  const theme = useAppTheme();
  return (
    <Text
      {...props}
      style={[styles.pageTitle, { color: theme.text }, props.style]}
    />
  );
}

export function BodyText(props: TypographyProps) {
  const theme = useAppTheme();
  return (
    <Text
      {...props}
      style={[styles.bodyText, { color: theme.textSoft }, props.style]}
    />
  );
}

export function SectionTitle(props: TypographyProps) {
  const theme = useAppTheme();
  return (
    <Text
      {...props}
      style={[styles.sectionTitle, { color: theme.text }, props.style]}
    />
  );
}

export function LabelText(props: TypographyProps) {
  const theme = useAppTheme();
  return (
    <Text
      {...props}
      style={[styles.labelText, { color: theme.textMuted }, props.style]}
    />
  );
}

export function MetricText(props: TypographyProps) {
  const theme = useAppTheme();
  return (
    <Text
      {...props}
      style={[styles.metricText, { color: theme.metric }, props.style]}
    />
  );
}

export function MonoLabel(props: TypographyProps) {
  const theme = useAppTheme();
  return (
    <Text
      {...props}
      style={[styles.monoLabel, { color: theme.textMuted }, props.style]}
    />
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    fontFamily: appTheme.fonts.monoStrong,
    fontSize: appTheme.fontSizes.label,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  pageTitle: {
    fontFamily: appTheme.fonts.display,
    fontSize: appTheme.fontSizes.hero,
    lineHeight: 40,
  },
  bodyText: {
    fontFamily: appTheme.fonts.body,
    fontSize: appTheme.fontSizes.body,
    lineHeight: 22,
  },
  sectionTitle: {
    fontFamily: appTheme.fonts.bodyStrong,
    fontSize: appTheme.fontSizes.bodyLarge,
  },
  labelText: {
    fontFamily: appTheme.fonts.mono,
    fontSize: appTheme.fontSizes.label,
    textTransform: "uppercase",
  },
  metricText: {
    fontFamily: appTheme.fonts.displayMedium,
    fontSize: appTheme.fontSizes.metric,
  },
  monoLabel: {
    fontFamily: appTheme.fonts.mono,
    fontSize: appTheme.fontSizes.label,
  },
});
