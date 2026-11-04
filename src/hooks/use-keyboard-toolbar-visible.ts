import { usePathname } from "expo-router";

/** Sohbetlerde gönder alanı klavyeye yapışık durur; araç çubuğu araya girmez. */
const ROUTES_WITHOUT_TOOLBAR = [/^\/conversations\/[^/]+$/, /^\/events\/[^/]+\/chat$/];

/** app/_layout'taki KeyboardToolbar bu ekranda gösteriliyor mu. */
export function useKeyboardToolbarVisible() {
  const pathname = usePathname();
  return !ROUTES_WITHOUT_TOOLBAR.some((route) => route.test(pathname));
}
