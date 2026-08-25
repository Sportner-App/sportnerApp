import { Keyframe } from "react-native-reanimated";

const AFTER_SCREEN_MS = 40;

export function heroFadeUp(duration: number, delay: number, fromY: number) {
  return new Keyframe({
    0: { opacity: 0, transform: [{ translateY: fromY }] },
    100: { opacity: 1, transform: [{ translateY: 0 }] },
  })
    .duration(duration)
    .delay(AFTER_SCREEN_MS + delay);
}

export function heroFadeScale(
  duration: number,
  delay: number,
  fromScale: number,
) {
  return new Keyframe({
    0: { opacity: 0, transform: [{ scale: fromScale }] },
    100: { opacity: 1, transform: [{ scale: 1 }] },
  })
    .duration(duration)
    .delay(AFTER_SCREEN_MS + delay);
}
