import { useCallback, useRef, useState } from "react";

import { MediaSourceSheet } from "@/components/media-source-sheet";
import type { MediaSource } from "@/utils/media-picker";

const SHEET_CLOSE_MS = 320;

export function useMediaSourceChoice() {
  const [visible, setVisible] = useState(false);
  const pending = useRef<((value: MediaSource | null) => void) | null>(null);

  const settle = useCallback((value: MediaSource | null) => {
    const resolve = pending.current;
    pending.current = null;
    setVisible(false);

    if (!resolve) {
      return;
    }

    if (value == null) {
      resolve(null);
      return;
    }

    setTimeout(() => resolve(value), SHEET_CLOSE_MS);
  }, []);

  const chooseSource = useCallback(() => {
    return new Promise<MediaSource | null>((resolve) => {
      pending.current?.(null);
      pending.current = resolve;
      setVisible(true);
    });
  }, []);

  const sourceSheet = (
    <MediaSourceSheet
      visible={visible}
      onClose={() => settle(null)}
      onSelect={(source) => settle(source)}
    />
  );

  return { chooseSource, sourceSheet };
}
