import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enMessaging from "./locales/en/messaging.json";
import enDiscover from "./locales/en/discover.json";
import enFeed from "./locales/en/feed.json";
import enAuth from "./locales/en/auth.json";
import enComponents from "./locales/en/components.json";
import enCommon from "./locales/en/common.json";
import enOnboarding from "./locales/en/onboarding.json";
import enOrganizations from "./locales/en/organizations.json";
import enProfile from "./locales/en/profile.json";
import enEventCreate from "./locales/en/event-create.json";
import enEventDetail from "./locales/en/event-detail.json";
import enEvents from "./locales/en/events.json";
import enHome from "./locales/en/home.json";
import enSettings from "./locales/en/settings.json";
import enSocial from "./locales/en/social.json";
import enSkills from "./locales/en/skills.json";
import enTabs from "./locales/en/tabs.json";
import enNotifications from "./locales/en/notifications.json";
import enFirstLaunch from "./locales/en/firstLaunch.json";
import enApi from "./locales/en/api.json";
import enLocation from "./locales/en/location.json";
import enUsers from "./locales/en/users.json";
import enEventReviews from "./locales/en/event-reviews.json";
import enEventParticipants from "./locales/en/event-participants.json";
import enReport from "./locales/en/report.json";
import enPeople from "./locales/en/people.json";
import enHelp from "./locales/en/help.json";
import enFriends from "./locales/en/friends.json";
import enFeedback from "./locales/en/feedback.json";
import enBadges from "./locales/en/badges.json";
import enActivity from "./locales/en/activity.json";
import enAlbums from "./locales/en/albums.json";
import trMessaging from "./locales/tr/messaging.json";
import trDiscover from "./locales/tr/discover.json";
import trFeed from "./locales/tr/feed.json";
import trAuth from "./locales/tr/auth.json";
import trComponents from "./locales/tr/components.json";
import trCommon from "./locales/tr/common.json";
import trOnboarding from "./locales/tr/onboarding.json";
import trOrganizations from "./locales/tr/organizations.json";
import trProfile from "./locales/tr/profile.json";
import trEventCreate from "./locales/tr/event-create.json";
import trEventDetail from "./locales/tr/event-detail.json";
import trEvents from "./locales/tr/events.json";
import trHome from "./locales/tr/home.json";
import trSettings from "./locales/tr/settings.json";
import trSocial from "./locales/tr/social.json";
import trSkills from "./locales/tr/skills.json";
import trTabs from "./locales/tr/tabs.json";
import trNotifications from "./locales/tr/notifications.json";
import trFirstLaunch from "./locales/tr/firstLaunch.json";
import trApi from "./locales/tr/api.json";
import trLocation from "./locales/tr/location.json";
import trUsers from "./locales/tr/users.json";
import trEventReviews from "./locales/tr/event-reviews.json";
import trEventParticipants from "./locales/tr/event-participants.json";
import trReport from "./locales/tr/report.json";
import trPeople from "./locales/tr/people.json";
import trHelp from "./locales/tr/help.json";
import trFriends from "./locales/tr/friends.json";
import trFeedback from "./locales/tr/feedback.json";
import trBadges from "./locales/tr/badges.json";
import trActivity from "./locales/tr/activity.json";
import trAlbums from "./locales/tr/albums.json";

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
    components: enComponents,
    profile: enProfile,
    onboarding: enOnboarding,
    organizations: enOrganizations,
    tabs: enTabs,
    auth: enAuth,
    settings: enSettings,
    events: enEvents,
    skills: enSkills,
    home: enHome,
    feed: enFeed,
    discover: enDiscover,
    social: enSocial,
    messaging: enMessaging,
    eventCreate: enEventCreate,
    eventDetail: enEventDetail,
    notifications: enNotifications,
    firstLaunch: enFirstLaunch,
    api: enApi,
    location: enLocation,
    users: enUsers,
    eventReviews: enEventReviews,
    eventParticipants: enEventParticipants,
    report: enReport,
    people: enPeople,
    help: enHelp,
    friends: enFriends,
    feedback: enFeedback,
    badges: enBadges,
    activity: enActivity,
    albums: enAlbums,
  },
  tr: {
    common: trCommon,
    components: trComponents,
    profile: trProfile,
    onboarding: trOnboarding,
    organizations: trOrganizations,
    tabs: trTabs,
    auth: trAuth,
    settings: trSettings,
    events: trEvents,
    skills: trSkills,
    home: trHome,
    feed: trFeed,
    discover: trDiscover,
    social: trSocial,
    messaging: trMessaging,
    eventCreate: trEventCreate,
    eventDetail: trEventDetail,
    notifications: trNotifications,
    firstLaunch: trFirstLaunch,
    api: trApi,
    location: trLocation,
    users: trUsers,
    eventReviews: trEventReviews,
    eventParticipants: trEventParticipants,
    report: trReport,
    people: trPeople,
    help: trHelp,
    friends: trFriends,
    feedback: trFeedback,
    badges: trBadges,
    activity: trActivity,
    albums: trAlbums,
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
    "components",
    "profile",
    "onboarding",
    "organizations",
    "tabs",
    "auth",
    "settings",
    "events",
    "skills",
    "home",
    "feed",
    "discover",
    "social",
    "messaging",
    "eventCreate",
    "eventDetail",
    "notifications",
    "firstLaunch",
    "api",
    "location",
    "users",
    "eventReviews",
    "eventParticipants",
    "report",
    "people",
    "help",
    "friends",
    "feedback",
    "badges",
    "activity",
    "albums",
  ],
  interpolation: {
    // React zaten kaçış (escape) yapıyor; i18next'in ayrıca yapması çift
    // kaçışa (ör. "&amp;amp;") yol açar.
    escapeValue: false,
  },
  returnNull: false,
});

export default i18n;
