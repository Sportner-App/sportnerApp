import { Text as NativeText, type TextProps } from "react-native";

export type AppTextVariant =
  | "display"
  | "headingLarge"
  | "headingMedium"
  | "headingSmall"
  | "bodyLarge"
  | "body"
  | "bodySmall"
  | "label"
  | "caption"
  | "overline";

const VARIANT_CLASSES: Record<AppTextVariant, string> = {
  display: "font-display text-display",
  headingLarge: "font-display text-heading-lg",
  headingMedium: "font-display text-heading-md",
  headingSmall: "font-display text-heading-sm",
  bodyLarge: "font-body text-body-lg",
  body: "font-body text-body",
  bodySmall: "font-body text-body-sm",
  label: "font-body-bold text-label",
  caption: "font-body text-caption",
  overline: "font-mono text-overline",
};

type AppTextProps = TextProps & {
  variant?: AppTextVariant;
  className?: string;
};

/** Project-wide text primitive. Callers choose semantic variants, not raw sizes. */
export function AppText({
  variant = "body",
  className,
  ...props
}: AppTextProps) {
  return (
    <NativeText
      className={`${VARIANT_CLASSES[variant]} ${className ?? ""}`}
      {...props}
    />
  );
}
