import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import i18n, {
  detectDeviceLanguage,
  type AppLanguage,
} from "@/i18n";

const STORAGE_KEY = "sportner:language-preference";

export type LanguagePreference = "system" | AppLanguage;

const LanguagePreferenceContext = createContext<{
  preference: LanguagePreference;
  resolvedLanguage: AppLanguage;
  setPreference: (value: LanguagePreference) => void;
} | null>(null);

export function LanguagePreferenceProvider({ children }: PropsWithChildren) {
  const [preference, setPreferenceState] =
    useState<LanguagePreference>("system");
  const resolvedLanguage =
    preference === "system" ? detectDeviceLanguage() : preference;

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === "system" || stored === "tr" || stored === "en") {
        setPreferenceState(stored);
      }
    });
  }, []);

  useEffect(() => {
    if (i18n.language !== resolvedLanguage) {
      void i18n.changeLanguage(resolvedLanguage);
    }
  }, [resolvedLanguage]);

  const setPreference = (value: LanguagePreference) => {
    setPreferenceState(value);
    void AsyncStorage.setItem(STORAGE_KEY, value);
  };

  const value = useMemo(
    () => ({ preference, resolvedLanguage, setPreference }),
    [preference, resolvedLanguage],
  );

  return (
    <LanguagePreferenceContext.Provider value={value}>
      {children}
    </LanguagePreferenceContext.Provider>
  );
}

export function useLanguagePreference() {
  const value = useContext(LanguagePreferenceContext);
  if (!value) {
    throw new Error(
      "useLanguagePreference LanguagePreferenceProvider içinde kullanılmalı.",
    );
  }
  return value;
}
