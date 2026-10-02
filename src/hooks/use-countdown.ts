import { useCallback, useEffect, useState } from "react";

/** Saniye bazlı geri sayım; "kodu tekrar gönder" bekleme süreleri için. */
export function useCountdown() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (seconds <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setSeconds((value) => Math.max(value - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const start = useCallback((duration: number) => setSeconds(duration), []);
  const reset = useCallback(() => setSeconds(0), []);

  return { seconds, isRunning: seconds > 0, start, reset };
}
