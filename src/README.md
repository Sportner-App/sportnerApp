# Klasör yapısı

`app/` Expo Router giriş noktasıdır ve yalnızca ince route dosyaları içerir
(web projesindeki `routes/` karşılığı). Asıl kod `src/` altındadır:

- `components/` — Ortak UI kit (Button, Input, BottomSheet, SelectField,
  DateField, GlassTabBar, **AppScreen**, **ScreenHeader**…). Stil
  standardı **NativeWind** (`className` + `brand-*` token’ları). Yeni
  ekranlarda önce `AppScreen` + `ScreenHeader` ile kabuğu kur, sonra
  içeriği doldur.
- `constants/` — Renk paleti, domain sabitleri (`events`, `tabs`, `auth`…).
- `contexts/` — React context + provider'lar (session, auth, toast) ve
  `AppProviders` kompozisyonu.
- `hooks/` — Ortak hook'lar (`use-color-scheme`, `use-auth-form`,
  `use-events`…).
- `lib/` — Altyapı kodu. `lib/api/` HTTP client ve hata normalizasyonu.
- `pages/` — Ekran kompozisyonları. Route dosyaları buradaki ekranları
  re-export eder. Ekrana özel alt bileşenler ekranın klasöründe kalır;
  paylaşılan form alanları (`SelectField`, `DateField`) `components/`tan
  doğrudan kullanılır.
- `services/` — Backend çağrıları (`auth-service`, `events-service`,
  `location-service`…). Location provider’lar `services/location/` altında.
  Ekranlar `apiClient`'ı doğrudan değil, servisler üzerinden kullanır.
- `mocks/` — UI geliştirme mock datası (servislerden ayrı).
- `types/` — Paylaşılan tipler; domain başına dosya (`auth.ts`,
  `events.ts`, `components.ts`…).
- `utils/` — Saf yardımcı fonksiyonlar.

### Env bayrakları

- `EXPO_PUBLIC_AUTH_BYPASS=true` — login zorunlu değil; form submit doğrudan
  tab’lara geçer. Backend bağlanınca `false` yap.
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` — doluysa Google Places; boşsa Nominatim.

Gerektiğinde web projesindeki gibi `store/`, `locales/`, `layouts/` klasörleri
aynı mantıkla eklenebilir.
