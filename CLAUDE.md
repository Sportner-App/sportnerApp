## iOS: native proje elle yönetiliyor (bare workflow)

`ios/` klasörü repoda duruyor ve `expo prebuild` rutin olarak çalıştırılmıyor.
Sonuç: **`app.json` > `expo.ios` altındaki ayarların çoğu build'e yansımaz** —
native projeyi de elle güncellemek gerekir.

İstisna: `version` ve `buildNumber`. `eas.json`'da `appVersionSource: "local"`
olduğu için EAS bunları build sırasında `app.json`'dan native'e senkronlar.

### iPad desteğini açma/kapatma

`supportsTablet` tek başına YETMEZ. Her ikisini birden değiştir:

1. `app.json` > `expo.ios.supportsTablet`
2. `ios/Sportner.xcodeproj/project.pbxproj` > `TARGETED_DEVICE_FAMILY`
   (4 yerde: Sportner Debug/Release + notification-service Debug/Release)
   - iPhone-only → `1`
   - iPhone + iPad → `"1,2"`
3. `ios/Sportner/Info.plist` > `UISupportedInterfaceOrientations~ipad`
   iPad kapalıysa bu anahtar olmamalı

Yalnızca `app.json` değiştirilirse build iPad destekli çıkmaya devam eder ve
App Store Connect 13" iPad ekran görüntüsü istemeye devam eder.
(29 Eyl 2026'da bu yüzden 42 numaralı build boşa gitti; 43 ile düzeldi.)

## Ortam değişkenleri

Kodda varsayılan/hardcoded değer tutulmuyor. Tek okuma noktaları:

- Runtime: `src/constants/env.ts` — başka hiçbir dosyada `process.env` yok
- Build-time (config): `app.config.js` > `requiredEnv()` — hata yalnızca
  `EAS_BUILD=true` iken fırlatılır, diğer bağlamlarda uyarı basar (aksi halde
  `eas env:set` gibi komutlar da kilitleniyor, çünkü onlar da config'i eval eder)

Eksik bir değişken sessizce yanlış ortama bağlanmak yerine hata verir:
`EXPO_PUBLIC_API_URL` ve Google istemci kimlikleri zorunlu, Mapbox token/stil
opsiyonel (yoksa harita boş render edilir).

Metro `process.env.EXPO_PUBLIC_*` erişimlerini derleme sırasında sabitler,
bu yüzden değişken adları birebir yazılmalı — dinamik anahtar çalışmaz.

`@react-native-google-signin` plugin'i `iosUrlScheme` boş gelince config
eval'i kırıyor ve bu `eas env:set`/`env:list` dahil tüm EAS komutlarını
blokluyordu (tavuk-yumurta: değişkeni eklemek için değişken gerekiyordu).
Bu yüzden plugin `app.config.js`'te koşullu ekleniyor.

Değişken eklerken üç yeri birden güncelle: `.env` (yerel), `.env.example`
(dokümantasyon) ve EAS proje ortam değişkenleri (`eas env:create`). EAS'te
eksik olan bir zorunlu değişken build'i durdurur.

## Oturum anahtarlarının saklanması

Access ve refresh token `src/lib/api/secure-storage.ts` üzerinden cihazın
güvenli deposunda tutulur (iOS Keychain / Android Keystore). AsyncStorage'a
yazılmaz — orada düz metin duruyorlardı.

Güvenli depoda değer bulunamazsa `getSecureItem` eski AsyncStorage kalıntısını
siler (geri yüklemez): kullanıcı yeniden giriş yapar, düz metin token cihazda
kalmaz. Kalıcı bir temizlik, ileride kaldırılması gerekmiyor.

Kullanıcı profili (`api_user`) AsyncStorage'da kalır: hassas değil ve
SecureStore'un 2 KB değer sınırını aşabilir.

`expo-secure-store` native bir modül — `ios/Podfile.lock` güncellenmesi için
`npx pod-install` (EAS build bunu kendisi yapar).
