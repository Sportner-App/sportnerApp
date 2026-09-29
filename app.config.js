const appJson = require("./app.json");
const withAndroidPackageQueries = require("./plugins/withAndroidPackageQueries");

// Harita render'ı Mapbox'ta, adres arama ise sunucudaki /api/locations
// uçlarından geçiyor — uygulamanın artık hiç Google Maps anahtarı yok.

/**
 * Config değerleri koda gömülmüyor: eksik bir değişkenle build almaktansa
 * hata verip build'i durduruyoruz. Yerelde .env, EAS'te proje ortam
 * değişkenleri doldurur.
 *
 * Hata yalnızca gerçek build sırasında (EAS_BUILD) fırlatılır. `eas env:set`,
 * `eas build:list` gibi komutlar da bu dosyayı eval ettiği için, her bağlamda
 * throw etmek değişkeni eklemeyi imkânsız hale getiriyordu.
 */
const isEasBuild = process.env.EAS_BUILD === "true";

function requiredEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    const message =
      `${name} tanımlı değil. Yerelde .env dosyasına, EAS build'lerinde ` +
      `proje ortam değişkenlerine ekleyin.`;

    if (isEasBuild) {
      throw new Error(message);
    }

    console.warn(`[app.config] ${message}`);
  }

  return value;
}

const googleIosClientId = requiredEnv("EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID");
const googleWebClientId = requiredEnv("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID");
const googleIosUrlScheme = requiredEnv("GOOGLE_IOS_URL_SCHEME");

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
      // Plugin iosUrlScheme boş gelince config eval'i tamamen kırıyor; bu da
      // `eas env:set` gibi komutları bloklar. Değişken yoksa plugin'i hiç
      // eklemiyoruz — gerçek build'de requiredEnv zaten hata veriyor.
      ...(googleIosUrlScheme
        ? [
            [
              "@react-native-google-signin/google-signin",
              { iosUrlScheme: googleIosUrlScheme },
            ],
          ]
        : []),
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
        googleWebClientId,
      },
    },
  },
};
