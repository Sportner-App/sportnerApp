import { makeMutable, withTiming } from "react-native-reanimated";

/**
 * Tab bar ile ekranların scroll'u ayrı ağaçlarda yaşıyor (bar'ı Tabs navigator
 * render ediyor). Aynı anda tek bir tab bar olduğu için köprüyü modül seviyesinde
 * tek bir paylaşımlı değerle kuruyoruz: 0 = tam boy, 1 = scroll sırasında küçük.
 */
export const tabBarShrink = makeMutable(0);

let restoreTimer: ReturnType<typeof setTimeout> | null = null;

function cancelScheduledRestore() {
  if (restoreTimer) {
    clearTimeout(restoreTimer);
    restoreTimer = null;
  }
}

export function shrinkTabBar() {
  cancelScheduledRestore();
  tabBarShrink.value = withTiming(1, { duration: 160 });
}

/**
 * Parmak kalktığında momentum başlayabilir; gecikmeyle planlayıp
 * `shrinkTabBar` çağrısının iptal etmesine izin veriyoruz.
 */
export function restoreTabBar(delayMs = 0) {
  cancelScheduledRestore();

  const restore = () => {
    restoreTimer = null;
    tabBarShrink.value = withTiming(0, { duration: 220 });
  };

  if (delayMs <= 0) {
    restore();
    return;
  }

  restoreTimer = setTimeout(restore, delayMs);
}
