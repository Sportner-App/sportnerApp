# Klasör yapısı

`app/` Expo Router giriş noktasıdır ve yalnızca ince route dosyaları içerir:
ekranı bir feature'dan re-export eder (`export { XScreen as default } from
"@/features/x/screens/x-screen"`) ya da route grubunun layout'unu kurar.
Asıl kod `src/` altındadır.

## Feature'lar — `src/features/<ad>/`

Her ürün alanı kendi klasöründe; içinde yalnızca ihtiyaç duyulanlar bulunur:

| Klasör / dosya  | İçerik                                                        |
| --------------- | ------------------------------------------------------------- |
| `screens/`      | Route'ların re-export ettiği ekranlar (`*-screen.tsx`)        |
| `components/`   | Feature'a özel bileşenler (büyük feature'larda alt klasörlü)  |
| `hooks/`        | Feature'a özel hook'lar (veri yükleme, form state)            |
| `services/`     | Backend çağrıları — `apiClient` yalnızca burada kullanılır    |
| `types.ts`      | API ve domain tipleri                                         |
| `mappers.ts`    | API yanıtı → domain modeli dönüşümleri                        |
| `copy.ts`       | i18n metinlerini derleyen `use*Copy` hook'ları                |

Feature'lar: `activity`, `albums`, `app-shell` (tab bar, tab başlığı, uygulama
turu, 404), `auth` (giriş, e-posta doğrulama, oturum context'leri, başlangıç
yönlendirmesi), `discover`, `events` (ana sayfa, detay, oluştur/düzenle,
katılımcılar, yorumlar, soru-cevap), `feed` (gönderi ve yorumlar), `first-launch`,
`gamification`, `location` (şehirler, adres arama, kullanıcı konumu),
`messaging`, `notifications`, `onboarding`, `organizations`, `profile`,
`social` (arkadaşlar, kişiler, herkese açık profil, engellenenler), `sports`
(spor kataloğu, seviyeler, görseller), `support` (geri bildirim, şikayet,
yardım, yasal metinler).

Kurallar:

- Bir feature başka bir feature'ın servisini, tipini veya hook'unu doğrudan
  import edebilir (ör. `events` → `social/services/social-service`).
- İki veya daha fazla feature'ın kullandığı **UI** `src/components`'e,
  **saf yardımcı** `src/utils`'e çıkar.
- Ortak katman (`components`, `hooks`, `lib`, `utils`, `constants`, `types`)
  hiçbir feature'ı import etmez. İstisna: `contexts/index.tsx` uygulamanın
  provider kompozisyonudur ve feature provider'larını toplar.

## Ortak katman

- `components/` — UI kit (`Button`, `Input`, `BottomSheet`, `AppScreen`,
  `ScreenHeader`, `ScreenLoader`, `EmptyState`/`ErrorState`, `UserIdentity`…).
  Stil standardı **NativeWind** (`className` + token'lar). Sayfalarda
  `@/components` barrel'ından import edilir; bileşenler birbirini göreli
  import eder (döngüsel import olmasın).
- `hooks/` — Feature'dan bağımsız hook'lar: `useRefreshableLoad` (yükleme/
  yenileme döngüsü), `usePaginatedList` (sonsuz liste), `useCountdown`,
  `useKeyboardHeight`…
- `lib/` — Altyapı: `api/` (HTTP client, hata normalizasyonu, sayfalama
  yardımcıları), `toast-bus.ts`, `mapbox.ts`.
- `contexts/` — Uygulama geneli provider'lar (tema, dil, toast, uygulama turu)
  ve `AppProviders` kompozisyonu. `useAuth`/`useSession`/`useFirstLaunch` da
  buradan re-export edilir.
- `constants/` — Global sabitler: `design-tokens`, `theme`, `env`,
  `storage-keys`, `validation`, `navigation`, `tabs`, `map`, `feature-flags`.
- `utils/` — Saf yardımcılar: `date-format`, `relative-time`, `person`,
  `birth-date`, `search`, `confirm`, `media-url`…
- `types/` — Ortak tipler: `api.ts` (`PagedResult`, `CursorPagedResult`),
  `components.ts` (UI kit prop tipleri), `toast.ts`.
- `i18n/` — Dil dosyaları ve i18next kurulumu.

### Env bayrakları

- Tüm değişkenler `src/constants/env.ts` üzerinden okunur; kodda varsayılan
  değer tutulmaz, eksik değişken açık hata verir. Liste için `.env.example`.
- Adres arama `/api/locations/*` üzerinden sunucudan geçer; sağlayıcı anahtarı API tarafındadır.
