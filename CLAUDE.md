## Native klasörler (`ios/`, `android/`)

`/ios` ve `/android` `.gitignore`'da, "generated native folders" başlığı
altında. EAS'e yüklenmezler; **her build'de `expo prebuild` ile yeniden
üretilirler.**

Sonuç: native ayarlar için **`app.json` tek doğru kaynak**. `expo.ios` /
`expo.android` altındaki her şey (`supportsTablet`, `infoPlist` izin metinleri,
`permissions`, plugin ayarları) build'e doğrudan yansır. `version` ve
`buildNumber` de oradan okunur (`eas.json` > `appVersionSource: "local"`).

Yereldeki `ios/` klasörü yalnızca `npx expo run:ios` içindir. Prebuild onu
istediği zaman üzerine yazabilir, yani **oraya elle yapılan değişiklikler
kalıcı değildir ve EAS build'ine hiç gitmez.** Değişikliği yerel dev build'de
hemen görmek istiyorsan `ios/Sportner/Info.plist` gibi dosyaları elle
eşitleyebilirsin, ama kaynak her zaman `app.json` olmalı.

### iPad desteğini açma/kapatma

`app.json` > `expo.ios.supportsTablet` yeterli. `false` iken prebuild
`TARGETED_DEVICE_FAMILY = 1` üretir ve iPad'e özel yönelim anahtarlarını
yazmaz; App Store Connect da 13" iPad ekran görüntüsü istemez.

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

## Klasör yapısı

Ayrıntılı tablo `src/README.md`'de. Özet:

- `app/` yalnızca ince route dosyaları: ekranı `src/features/<ad>/screens/`
  altından re-export eder ya da route grubunun layout'unu kurar.
- `src/features/<ad>/` — her ürün alanı kendi klasöründe: `screens/`,
  `components/`, `hooks/`, `services/`, `types.ts`, `mappers.ts`, `copy.ts`.
  `apiClient` yalnızca `services/` içinde kullanılır.
- Ortak katman: `src/components`, `hooks`, `lib`, `utils`, `constants`,
  `types`, `i18n`, `contexts`. İki veya daha fazla feature'ın kullandığı UI
  `components/`'e, saf yardımcı `utils/`'e çıkar.
- Bir feature başka bir feature'ın servisini/tipini/hook'unu doğrudan
  import edebilir; ortak katman ise hiçbir feature'ı import edemez.

## Lint kuralları (`npm run lint`)

`eslint.config.js` Expo ayarlarının üstüne üç proje kuralı ekler. Üçü de
`error` seviyesinde; ihlal varsa kuralı gevşetme, kodu düzelt.

1. **Ortak katman feature import edemez.** Aksi halde `components/` ya da
   `utils/` bir feature'a bağlanır, feature'lar arasında döngüsel import
   oluşur ve "paylaşılan" kod fiilen o feature'a kilitlenir. Tek istisna
   `src/contexts/index.tsx`: uygulamanın provider kompozisyonu olduğu için
   feature provider'larını (auth, bildirim, ilk açılış) bilerek toplar.
   Feature'a bağımlı bir context/bileşen gerekiyorsa o feature'ın içine
   konur (ör. `features/auth/session/language-sync-bridge.tsx`).
2. **Ortam değişkeni yalnızca `src/constants/env.ts` içinde okunur.**
   Yukarıdaki "Ortam değişkenleri" bölümünün koruması: tek okuma noktası
   olmazsa hardcoded fallback'ler ve dinamik anahtarlar (Metro'nun
   sabitleyemediği) geri sızar. `app.config.js` lint kapsamında değil
   (build-time, `requiredEnv()` ile okunur).
3. **Hex renk yazılmaz.** Renkler yalnızca `design-tokens.js` (koyu tema ve
   sabit tonlar) ve `theme-palettes.ts` (açık tema) içinde tanımlanır.
   Ekranlar `themeColors` (temayla değişen) ya da `palette` /
   `brandColors` / `illustrationColors` (temadan bağımsız sabit) kullanır;
   Tailwind'de `bg-[#…]` yerine token sınıfı. Sebep: light tema
   açıldığında elle yazılmış her hex koyu kalır ve tek tek bulunması gerekir.
