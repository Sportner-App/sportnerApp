import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enAuth from "./locales/en/auth.json";
import enCommon from "./locales/en/common.json";
import enEventCreate from "./locales/en/event-create.json";
import enEventDetail from "./locales/en/event-detail.json";
import enEvents from "./locales/en/events.json";
import enHome from "./locales/en/home.json";
import enSettings from "./locales/en/settings.json";
import enSkills from "./locales/en/skills.json";
import enTabs from "./locales/en/tabs.json";
import trAuth from "./locales/tr/auth.json";
import trCommon from "./locales/tr/common.json";
import trEventCreate from "./locales/tr/event-create.json";
import trEventDetail from "./locales/tr/event-detail.json";
import trEvents from "./locales/tr/events.json";
import trHome from "./locales/tr/home.json";
import trSettings from "./locales/tr/settings.json";
import trSkills from "./locales/tr/skills.json";
import trTabs from "./locales/tr/tabs.json";

/**
 * Desteklenen uygulama dilleri. Yeni bir dil eklerken burada, her namespace'in
 * en/tr JSON çiftinde ve `resources` altında karşılığını eklemek yeterli.
 */
export const SUPPORTED_LANGUAGES = ["tr", "en"] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: AppLanguage = "tr";

/**
 * Namespace'ler özellik klasörlerine göre bölünüyor (auth, settings, tabs,
 * ...) — tek dev bir dosya yerine her yeni sayfa migrasyonu kendi JSON
 * çiftini ekliyor. `common` her yerde kullanılan genel metinleri taşır.
 * `events`/`skills` etkinlik alanının paylaşılan kelime dağarcığı — home,
 * event-create, event-detail ve ileride profil/onboarding tarafından da
 * kullanılır.
 */
export const resources = {
  en: {
    common: enCommon,
    tabs: enTabs,
    auth: enAuth,
    settings: enSettings,
    events: enEvents,
    skills: enSkills,
    home: enHome,
    eventCreate: enEventCreate,
    eventDetail: enEventDetail,
  },
  tr: {
    common: trCommon,
    tabs: trTabs,
    auth: trAuth,
    settings: trSettings,
    events: trEvents,
    skills: trSkills,
    home: trHome,
    eventCreate: trEventCreate,
    eventDetail: trEventDetail,
  },
} as const;

/** Cihazın sistem dili — `expo-localization` senkron okur, izin gerekmez. */
export function detectDeviceLanguage(): AppLanguage {
  const deviceLanguageCode = Localization.getLocales()[0]?.languageCode;
  return deviceLanguageCode === "en" ? "en" : DEFAULT_LANGUAGE;
}

/**
 * i18next'in kendi `language` alanı (`tr-TR` gibi bölgeli bir kod değil,
 * bizim iki harfli `AppLanguage` kodumuz) React dışından da okunabilir
 * bir kaynak — API istemcisi Accept-Language header'ı için bunu kullanır.
 */
export function getCurrentAppLanguage(): AppLanguage {
  return i18n.language === "en" ? "en" : DEFAULT_LANGUAGE;
}

/** Backend'in desteklediği tam kültür kodları (bkz. LocalizationExtension.cs). */
export function toAcceptLanguageHeader(language: AppLanguage): string {
  return language === "en" ? "en-US" : "tr-TR";
}

/**
 * `toLocaleString`/`toLocaleUpperCase` gibi yerel duyarlı metin işlemleri
 * için o anki uygulama diline karşılık gelen tam kültür kodu.
 */
export function getCurrentLocale(): string {
  return toAcceptLanguageHeader(getCurrentAppLanguage());
}

void i18n.use(initReactI18next).init({
  resources,
  lng: detectDeviceLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  defaultNS: "common",
  ns: [
    "common",
    "tabs",
    "auth",
    "settings",
    "events",
    "skills",
    "home",
    "eventCreate",
    "eventDetail",
  ],
  interpolation: {
    // React zaten kaçış (escape) yapıyor; i18next'in ayrıca yapması çift
    // kaçışa (ör. "&amp;amp;") yol açar.
    escapeValue: false,
  },
  returnNull: false,
});

export default i18n;
