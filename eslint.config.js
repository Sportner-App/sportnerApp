// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

/** Ortak katman: hiçbir feature'a bağımlı olmamalı (bkz. src/README.md). */
const SHARED_LAYER = [
  "src/components/**",
  "src/hooks/**",
  "src/lib/**",
  "src/utils/**",
  "src/constants/**",
  "src/types/**",
  "src/i18n/**",
  "src/contexts/**",
];

/** Provider kompozisyonu: feature provider'larını toplayan tek bilinçli istisna. */
const COMPOSITION_ROOT = "src/contexts/index.tsx";

/** Ortam değişkenlerinin okunabildiği tek runtime dosyası (bkz. CLAUDE.md). */
const ENV_SOURCE = "src/constants/env.ts";

/** Renklerin tanımlandığı tek yerler; diğer her dosya `themeColors` kullanır. */
const COLOR_SOURCES = [
  "src/constants/design-tokens.js",
  "src/constants/theme-palettes.ts",
];

const HEX_COLOR =
  "^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$";
const TAILWIND_HEX = "\\[#[0-9a-fA-F]{3,8}\\]";

const noEnvAccess = {
  selector: "MemberExpression[object.name='process'][property.name='env']",
  message: `Ortam değişkenleri yalnızca ${ENV_SOURCE} içinde okunur; değeri oradan import et.`,
};

const noHexLiterals = [
  {
    selector: `Literal[value=/${HEX_COLOR}/]`,
    message:
      "Hex renk yazma; themeColors token'ını kullan (src/constants/theme.ts). Yeni renk gerekiyorsa design-tokens.js'e ekle.",
  },
  {
    selector: `TemplateElement[value.raw=/${HEX_COLOR}/]`,
    message: "Hex renk yazma; themeColors token'ını kullan.",
  },
  {
    selector: `Literal[value=/${TAILWIND_HEX}/]`,
    message:
      "Tailwind'de keyfi hex sınıfı (bg-[#...]) yazma; token sınıfı kullan (bg-destructive, text-text-secondary…).",
  },
  {
    selector: `TemplateElement[value.raw=/${TAILWIND_HEX}/]`,
    message: "Tailwind'de keyfi hex sınıfı yazma; token sınıfı kullan.",
  },
];

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", "ios/*", "android/*", "targets/*", "tools/*"],
  },
  {
    files: ["src/**/*.{ts,tsx,js}", "app/**/*.{ts,tsx}"],
    ignores: [ENV_SOURCE, ...COLOR_SOURCES],
    rules: {
      "no-restricted-syntax": ["error", noEnvAccess, ...noHexLiterals],
    },
  },
  {
    files: COLOR_SOURCES,
    rules: {
      "no-restricted-syntax": ["error", noEnvAccess],
    },
  },
  {
    files: SHARED_LAYER,
    ignores: [COMPOSITION_ROOT],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features", "@/features/*", "**/features/*"],
              message:
                "Ortak katman feature import edemez. Paylaşılan şeyi ortak katmana taşı ya da bu kodu feature'a al.",
            },
          ],
        },
      ],
    },
  },
]);
