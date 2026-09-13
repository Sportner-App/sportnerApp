import { useEffect, useState } from "react";
import { InteractionManager } from "react-native";

/**
 * True once it's safe to mount Reanimated `entering` animations (FadeInDown etc.).
 *
 * On a cold start, a view can mount with an `entering` animation before Reanimated's
 * UI-runtime has fully attached — the animation then silently never runs, leaving the
 * view stuck at its initial (invisible) style. `entering` only fires on a component's
 * first mount, so this must resolve before the animated views mount, not after.
 * Waiting for the first InteractionManager tick plus one extra frame keeps entrance
 * animations out of that window without meaningfully delaying them in the common case
 * (data almost always arrives well after this resolves).
 */
export function useEntranceAnimationsReady(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) {
      return;
    }

    let frameId: number | null = null;
    const task = InteractionManager.runAfterInteractions(() => {
      frameId = requestAnimationFrame(() => setReady(true));
    });

    return () => {
      task.cancel();
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [ready]);

  return ready;
}
