import { useEffect, useState } from "react";

import { listSports } from "@/services/sports-service";
import type { Sport } from "@/types/sports";

/** Tüm aktif spor branşları; katalog sabit referans veridir, bir kez yüklenir. */
export function useSportCatalog() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void listSports({ pageSize: 100 })
      .then((items) => {
        if (!cancelled) {
          setSports(items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSports([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { sports, isLoading };
}
