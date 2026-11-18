import { Platform } from "react-native";
import { usePathname } from "expo-router";

/** app/_layout'taki KeyboardToolbar klavyenin üstünde bu kadar yer kaplar. */
export const KEYBOARD_TOOLBAR_OFFSET = Platform.OS === "ios" ? 53 : 42;

/** Sohbetlerde gönder alanı klavyeye yapışık durur; araç çubuğu araya girmez. */
const ROUTES_WITHOUT_TOOLBAR = [
  /^\/conversations\/[^/]+$/,
  /^\/events\/[^/]+\/chat$/,
];

/** app/_layout'taki KeyboardToolbar bu ekranda gösteriliyor mu. */
export function useKeyboardToolbarVisible() {
  const pathname = usePathname();
  return !ROUTES_WITHOUT_TOOLBAR.some((route) => route.test(pathname));
}
