import { useEffect, useState } from "react";

import { listSportCategories } from "@/services/sports-service";
import type { SportCategory } from "@/types/sports";

/** Katalog kategorileri sabit referans veridir; bir kez yüklenir. */
export function useSportCategories() {
  const [categories, setCategories] = useState<SportCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void listSportCategories()
      .then((items) => {
        if (!cancelled) {
          setCategories(items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCategories([]);
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

  return { categories, isLoading };
}
