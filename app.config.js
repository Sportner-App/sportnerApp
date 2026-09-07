const appJson = require("./app.json");
const withAndroidPackageQueries = require("./plugins/withAndroidPackageQueries");

const googleMapsApiKey =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || "";
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
      config: {
        ...(appJson.expo?.ios?.config || {}),
        ...(googleMapsApiKey ? { googleMapsApiKey } : {}),
      },
    },
    android: {
      ...appJson.expo?.android,
      config: {
        ...(appJson.expo?.android?.config || {}),
        ...(googleMapsApiKey
          ? {
              googleMaps: {
                apiKey: googleMapsApiKey,
              },
            }
          : {}),
      },
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
