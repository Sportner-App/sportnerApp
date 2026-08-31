const {
  colors,
  sports,
  fonts,
  typography,
  spacing,
  radius,
  shadows,
  media,
  palette,
} = require("./src/constants/design-tokens");

const themed = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: themed("brand-primary"),
          /** App canvas; retained alias for screens using brand-secondary. */
          secondary: themed("background-primary"),
          tertiary: palette.navyMuted,
          neutral: themed("text-tertiary"),
          surface: themed("surface-primary"),
          raised: themed("surface-secondary"),
          charcoal: colors.surface.dark,
        },
        background: {
          primary: themed("background-primary"),
          secondary: themed("background-secondary"),
        },
        surface: {
          primary: themed("surface-primary"),
          secondary: themed("surface-secondary"),
          dark: colors.surface.dark,
        },
        text: {
          primary: themed("text-primary"),
          secondary: themed("text-secondary"),
          tertiary: themed("text-tertiary"),
          inverse: themed("text-inverse"),
        },
        border: {
          default: themed("border-default"),
          strong: themed("border-strong"),
        },
        overlay: {
          dark: colors.overlay.dark,
        },
        sport: {
          basketball: {
            DEFAULT: sports.basketball.accent,
            soft: sports.basketball.soft,
          },
          football: {
            DEFAULT: sports.football.accent,
            soft: sports.football.soft,
          },
          running: {
            DEFAULT: sports.running.accent,
            soft: sports.running.soft,
          },
          volleyball: {
            DEFAULT: sports.volleyball.accent,
            soft: sports.volleyball.soft,
          },
          tennis: {
            DEFAULT: sports.tennis.accent,
            soft: sports.tennis.soft,
          },
        },
        success: colors.success,
        warning: colors.warning,
        destructive: colors.destructive,
      },
      fontFamily: {
        display: [fonts.display],
        "display-semibold": [fonts.displaySemiBold],
        body: [fonts.body],
        "body-bold": [fonts.bodyBold],
        mono: [fonts.mono],
        "mono-bold": [fonts.monoBold],
      },
      fontSize: {
        display: [
          `${typography.display.fontSize}px`,
          {
            lineHeight: `${typography.display.lineHeight}px`,
            letterSpacing: `${typography.display.letterSpacing}px`,
          },
        ],
        "heading-lg": [
          `${typography.headingLarge.fontSize}px`,
          {
            lineHeight: `${typography.headingLarge.lineHeight}px`,
            letterSpacing: `${typography.headingLarge.letterSpacing}px`,
          },
        ],
        "heading-md": [
          `${typography.headingMedium.fontSize}px`,
          {
            lineHeight: `${typography.headingMedium.lineHeight}px`,
            letterSpacing: `${typography.headingMedium.letterSpacing}px`,
          },
        ],
        "heading-sm": [
          `${typography.headingSmall.fontSize}px`,
          {
            lineHeight: `${typography.headingSmall.lineHeight}px`,
            letterSpacing: `${typography.headingSmall.letterSpacing}px`,
          },
        ],
        "body-lg": [
          `${typography.bodyLarge.fontSize}px`,
          { lineHeight: `${typography.bodyLarge.lineHeight}px` },
        ],
        "body-sm": [
          `${typography.bodySmall.fontSize}px`,
          { lineHeight: `${typography.bodySmall.lineHeight}px` },
        ],
        label: [
          `${typography.label.fontSize}px`,
          { lineHeight: `${typography.label.lineHeight}px` },
        ],
        caption: [
          `${typography.caption.fontSize}px`,
          { lineHeight: `${typography.caption.lineHeight}px` },
        ],
        overline: [
          `${typography.overline.fontSize}px`,
          {
            lineHeight: `${typography.overline.lineHeight}px`,
            letterSpacing: `${typography.overline.letterSpacing}px`,
          },
        ],
      },
      spacing: {
        xs: `${spacing.xs}px`,
        sm: `${spacing.sm}px`,
        md: `${spacing.md}px`,
        lg: `${spacing.lg}px`,
        xl: `${spacing.xl}px`,
        "2xl": `${spacing["2xl"]}px`,
        "3xl": `${spacing["3xl"]}px`,
      },
      borderRadius: {
        small: `${radius.small}px`,
        medium: `${radius.medium}px`,
        large: `${radius.large}px`,
        xlarge: `${radius.xl}px`,
        pill: `${radius.pill}px`,
        media: `${media.cardRadius}px`,
        hero: `${media.heroRadius}px`,
      },
      boxShadow: {
        "elevation-sm": shadows.sm.css,
        "elevation-md": shadows.md.css,
        "elevation-lg": shadows.lg.css,
        glow: shadows.glow.css,
      },
    },
  },
  plugins: [],
};
