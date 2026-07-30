# Sportner Engineering Rules

Bu dokuman, projede kod ureten herkesin (insan veya AI) ayni mimariyi, UI dilini ve entegrasyon kurallarini takip etmesi icin kaynak dosyadir.

## 1) Mimari Prensipler

- Proje FSD (Feature-Sliced Design) mantigina yakin bir duzende ilerler.
- Rota girisi `app/` klasorunde kalir ve dosyalar ince route dosyasi olmalidir.
- Is mantigi ve UI katmanlari `src/` altinda gelistirilir.
- Katmanlar arasi bagimlilik asagi yone dogru olmalidir:
  - `app` -> `pages` -> `widgets` -> `features` -> `entities` -> `shared`

## 2) Klasorleme Kurallari

- `app/`: Sadece Expo Router dosyalari (`_layout`, route dosyalari, `+not-found` vb.)
- `src/app-core/`: Uygulama composition katmani (provider chain, global composition)
- `src/pages/`: Route-level ekran kompozisyonlari
- `src/widgets/`: Birden fazla feature/entity birlestiren ekran parcasi
- `src/features/`: Kullanici aksiyonlari ve is akislari
- `src/entities/`: Domain model/state ve entity-level logic
- `src/shared/`: Ortak UI, config, helper, API client ve altyapi

## 3) Import ve Public API Kurali

- Derin importlardan kacinin, slice public API kullanin.
- Ornek:
  - Tercih edilen: `@/entities/session`
  - Kacinilacak: `@/entities/session/model/...`
- Her yeni feature/entity slice icin `index.ts` public API dosyasi ekleyin.
- `@/*` alias'i sadece `src/*` hedefler. `app/*` dosyalarina alias ile baglanmayin.

## 4) Router ve Composition Kurallari

- Expo Router route agaci yalnizca `app/` altindadir.
- `src/app` adinda klasor olusturmayin. Router bunu route koku sanabilir.
- Global provider chain `src/app-core/providers` altinda tutulur.
- Root router composition tek noktadan yapilir:
  - `app/_layout.tsx` -> `AppProviders` -> `ThemeProvider` -> `Stack/Tabs`

## 5) Auth ve Session Kurallari

- Session state provider implementasyonu `src/app-core/providers/session-provider.tsx` icindedir.
- Auth context/provider composition'i `src/app-core/providers/auth-provider.tsx` icindedir.
- Uygulama icinde auth state'e erisim tek hook ile yapilir:
  - `useAuth()` from `@/features/auth`
- .NET Web API auth use-case fonksiyonlari feature katmaninda kalir:
  - `src/features/auth/api/*`

## 6) API Katman Kurali

- API client ve altyapi kodu sadece `src/shared/api/client.ts` altinda olur.
- Tum API istekleri `apiClient` uzerinden yapilir.
- Token otomatik olarak AsyncStorage'dan okunur ve Authorization header'ina eklenir.
- API Base URL: `http://localhost:5139` (development)

## 7) Tema ve Tasarim Kurallari

- Renk tokenlari tek kaynakta yonetilir:
  - `src/shared/config/colors.ts`
- Typography, spacing, radius, shadow tokenlari tek kaynakta yonetilir:
  - `src/shared/config/theme.ts`
- Yeni ekran veya bilesen yazarken sabit hex yazmaktan kacinin.
- Oncelikle token kullanin (`colors`, `appTheme`).
- Ortak UI primitive'leri tercih edin:
  - `Screen`, `SectionCard`, `Typography` primitive'leri

## 8) Yazi Tipi Kurallari

- Display: `Anybody`
- Body: `Hanken Grotesk`
- Label/Mono: `JetBrains Mono`
- Font ailelerini dogrudan string yazmak yerine `appTheme.fonts` uzerinden kullanin.

## 9) Kod Yazim Standartlari

- TypeScript strict mod korunur.
- Fonksiyonlar tek sorumluluk ilkesine uygun olmalidir.
- Gereksiz yorum yazmayin; sadece karmaasik kisimlari aciklayin.
- Refactor sonrasi mutlaka asagidaki komutla kontrol edin:
  - `npx tsc --noEmit`

## 10) Ekleme Yaparken Kontrol Listesi

- Dosya dogru katmanda mi?
- Import yonu FSD kurallarina uygun mu?
- Public API (`index.ts`) guncellendi mi?
- Tema tokenlari kullanildi mi?
- API client uzerinden istek yapildi mi?
- `npx tsc --noEmit` temiz mi?

## 11) Yasaklar

- `src/app/` altina yeni klasor/dosya acmak yok.
- Route dosyalarina is mantigi yigmak yok.
- UI'da rastgele inline renk/fon turelmesi yok.
- Feature kodunun `app/` veya route lifecycle detaylarina baglanmasi yok.

Bu kurallar yeni kodlarda varsayilan standarttir. Istisna gerekiyorsa PR aciklamasinda teknik gerekce belirtilmelidir.
