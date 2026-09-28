const appJson = require("./app.json");
const withAndroidPackageQueries = require("./plugins/withAndroidPackageQueries");

// Harita render'ı Mapbox'ta, adres arama ise sunucudaki /api/locations
// uçlarından geçiyor — uygulamanın artık hiç Google Maps anahtarı yok.
const googleIosClientId =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() ||
  "1000243667995-c4edjccfgef9npv2jdfjruugvfqapoi8.apps.googleusercontent.com";
const googleIosUrlScheme =
  process.env.GOOGLE_IOS_URL_SCHEME?.trim() ||
  "com.googleusercontent.apps.1000243667995-c4edjccfgef9npv2jdfjruugvfqapoi8";

module.exports = {
  expo: {
    ...appJson.expo,
    ios: {
      ...appJson.expo?.ios,
      usesAppleSignIn: true,
      bundleIdentifier:
        appJson.expo?.ios?.bundleIdentifier || "com.yagizerdenler.sportner",
    },
    android: {
      ...appJson.expo?.android,
    },
    plugins: [
      ...(appJson.expo?.plugins || []),
      "expo-apple-authentication",
      [
        "@react-native-google-signin/google-signin",
        { iosUrlScheme: googleIosUrlScheme },
      ],
      // Android 11+ paket görünürlüğü: WhatsApp'ın yüklü olup olmadığını
      // Linking.canOpenURL ile doğru tespit edebilmek için (bkz.
      // organization-invite.ts). iOS'ta bunun karşılığı zaten
      // app.json > ios.infoPlist.LSApplicationQueriesSchemes.
      [withAndroidPackageQueries, ["com.whatsapp"]],
      // Harita render'ı Mapbox'ta; adres arama Google Places'te kalıyor.
      // Secret download token artık gerekmiyor, public pk.* token yeterli.
      ["@rnmapbox/maps", { RNMapboxMapsUseV11: true }],
    ],
    extra: {
      ...appJson.expo?.extra,
      auth: {
        googleIosClientId,
        googleWebClientId:
          process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ||
          "1000243667995-onii96ut9bacgu5ltcnnfcoegtemotlu.apps.googleusercontent.com",
      },
    },
  },
};
