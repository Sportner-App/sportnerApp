/**
 * Location search hook with debouncing
 */

import {
  searchLocationSuggestions,
  type NominatimResult,
} from "@/features/events-create";
import { useEffect, useState } from "react";

export function useLocationSearch(query: string, debounceMs: number = 350) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const debouncer = setTimeout(async () => {
      const trimmedQuery = query.trim();

      if (trimmedQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        setIsSearching(true);
        const results = await searchLocationSuggestions(trimmedQuery);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, debounceMs);

    return () => clearTimeout(debouncer);
  }, [query, debounceMs]);

  return { suggestions, isSearching };
}
