/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#ccff00",
          secondary: "#0f172a",
          tertiary: "#1e293b",
          neutral: "#64748b",
          surface: "#152238",
          raised: "#1e2d46",
        },
      },
      fontFamily: {
        display: ["Anybody_700Bold"],
        body: ["HankenGrotesk_500Medium"],
        mono: ["JetBrainsMono_500Medium"],
      },
    },
  },
  plugins: [],
};
