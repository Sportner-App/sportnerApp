import { useEffect, useMemo, useState } from "react";

import { listCities } from "@/services/cities-service";
import type { City } from "@/types/cities";
import type { SelectOption } from "@/types/components";

export function useCities() {
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    void listCities()
      .then((result) => {
        if (active) {
          setCities(result);
          setError(null);
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason);
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const options = useMemo<SelectOption<string>[]>(() => {
    const result: SelectOption<string>[] = cities.map((city) => ({
      key: city.name,
      label: city.name,
      description: `${String(city.plateCode).padStart(2, "0")} plaka kodu`,
    }));

    return result;
  }, [cities]);

  return { cities, options, isLoading, error };
}
