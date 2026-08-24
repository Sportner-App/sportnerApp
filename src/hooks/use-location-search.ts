import { useEffect, useRef, useState } from "react";

import {
  resolveLocationSuggestion,
  reverseGeocode,
  searchLocations,
} from "@/services/location-service";
import type {
  LocationSuggestion,
  SelectedLocation,
} from "@/types/location";

const DEBOUNCE_MS = 380;

export function useLocationSearch(selectedAddress: string) {
  const [query, setQuery] = useState(selectedAddress);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    setQuery(selectedAddress);
  }, [selectedAddress]);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2 || trimmed === selectedAddress.trim()) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const currentRequest = ++requestId.current;
    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const results = await searchLocations(trimmed);

        if (currentRequest === requestId.current) {
          setSuggestions(results);
        }
      } catch {
        if (currentRequest === requestId.current) {
          setSuggestions([]);
        }
      } finally {
        if (currentRequest === requestId.current) {
          setIsSearching(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, selectedAddress]);

  const resolveSuggestion = async (
    suggestion: LocationSuggestion,
  ): Promise<SelectedLocation | null> => {
    setIsResolving(true);
    setSuggestions([]);

    try {
      const location = await resolveLocationSuggestion(suggestion);
      setQuery(location.addressText);
      return location;
    } catch {
      return null;
    } finally {
      setIsResolving(false);
    }
  };

  const resolvePoint = async (
    latitude: number,
    longitude: number,
  ): Promise<SelectedLocation | null> => {
    setIsResolving(true);
    setSuggestions([]);

    try {
      const location = await reverseGeocode(latitude, longitude);
      setQuery(location.addressText);
      return location;
    } catch {
      return null;
    } finally {
      setIsResolving(false);
    }
  };

  const clearSuggestions = () => setSuggestions([]);

  return {
    query,
    setQuery,
    suggestions,
    isSearching,
    isResolving,
    resolveSuggestion,
    resolvePoint,
    clearSuggestions,
  };
}
