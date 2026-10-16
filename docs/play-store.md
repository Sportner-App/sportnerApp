# Play Store yayın hazırlığı

Sportner'ın Google Play sürecinde doldurulacak her alan. Sırayla gidilebilir.

---

## 1. Uygulamayı oluştur

Play Console > **Uygulama oluştur**

| Alan | Değer |
|---|---|
| Uygulama adı | `Sportner` |
| Varsayılan dil | `Türkçe (tr-TR)` |
| Uygulama mı oyun mu | Uygulama |
| Ücretsiz / ücretli | **Ücretsiz** (sonradan ücretliye çevrilemez) |

Paket adı build'den gelir, elle girilmez: `com.yagizerdenler.sportner`

---

## 2. Mağaza listesi metinleri

### Uygulama adı (30 karakter)

```
Sportner
```

### Kısa açıklama (80 karakter)

```
Yakınındaki spor etkinliklerini bul, katıl, yeni spor arkadaşları edin.
```

71 karakter. Arama sonuçlarında ve uygulama kartında görünen tek satır bu —
en çok okunan metin burası.

### Tam açıklama (4000 karakter)

```
Sportner, birlikte spor yapacak insan bulmanı sağlayan bir topluluk uygulaması.

Halı saha maçına bir kişi mi eksik? Sabah koşusuna eşlik edecek biri mi arıyorsun? Yeni taşındığın şehirde basketbol oynayacak kimse mi tanımıyorsun? Sportner tam bunun için.

YAKININDAKİ ETKİNLİKLERİ KEŞFET
Haritada ya da listede, konumuna en yakın etkinlikleri gör. Spor dalına, tarihe, seviyeye ve kalan kontenjana göre filtrele. İlgini çekeni bul, tek dokunuşla katıl.

KENDİ ETKİNLİĞİNİ OLUŞTUR
Sahayı ayarladın ama kadro eksik mi? Etkinliğini oluştur, kontenjanı ve süreyi belirle, katılımcıları onayla. Kimin geleceğini önceden bil.

SEVİYENE UYGUN İNSANLARLA OYNA
Her spor dalı için kendi seviyeni belirle: yeni başlayan, orta, ileri, uzman ya da profesyonel. Etkinlikler seviyeye göre filtrelenir — ne çok zorlanırsın ne de sıkılırsın.

TOPLULUĞUNU KUR
Birlikte oynadığın insanları arkadaş olarak ekle, profillerini gör, mesajlaş. Etkinlik sonrası değerlendirme bırak, kendi puanını yükselt. Güvenilir oyuncular öne çıkar.

KULÜP VE ORGANİZASYONLAR
Düzenli etkinlik yapan bir grubun mu var? Organizasyon oluştur, üyelerini topla, tüm etkinliklerini tek yerden yönet.

ANILARI SAKLA
Etkinlik albümlerine fotoğraf ekle, maçtan kareleri paylaş. Akışta topluluğun ne yaptığını takip et.

HER ŞEYDEN HABERDAR OL
Katıldığın etkinliğin saati mi değişti, biri seni arkadaş olarak mı ekledi, etkinliğine yeni katılımcı mı geldi — anında bildirim alırsın.

Sportner ücretsizdir.
```

Yaklaşık 1.350 karakter. Sınır 4000, yani yer var — ileride spor dalı
isimlerini ("halı saha, basketbol, tenis, koşu, yüzme, bisiklet…") eklemek
arama görünürlüğüne yardım eder.

---

## 3. Görsel varlıklar

| Varlık | Boyut | Zorunlu | Not |
|---|---|---|---|
| Uygulama simgesi | 512 × 512 PNG | Evet | 32-bit, alfa kanallı |
| Öne çıkan grafik | 1024 × 500 PNG/JPG | Evet | Mağaza başlığında görünür |
| Telefon ekran görüntüsü | en az 2, en fazla 8 | Evet | 16:9 veya 9:16, kısa kenar ≥ 320px |
| 7" tablet | — | Hayır | iPad desteğini kapattık, atla |
| 10" tablet | — | Hayır | Atla |

App Store için hazırladığın iPhone ekran görüntüleri burada da kullanılabilir,
Play boyut konusunda Apple'dan esnek. Öne çıkan grafik yeni hazırlanmalı —
Apple'da karşılığı yok.

---

## 4. Data safety formu

**Uygulama içeriği > Veri güvenliği**

Tüm veri türleri için ortak cevaplar:

- Veriler aktarım sırasında şifreleniyor mu? → **Evet** (tüm trafik HTTPS)
- Kullanıcılar verilerinin silinmesini isteyebilir mi? → **Evet** (uygulama
  içinde hesap silme var)
- Veri üçüncü taraflarla **paylaşılıyor mu**? → **Hayır**
  (Supabase ve Railway bizim adımıza işlem yapan hizmet sağlayıcılar;
  Google'ın tanımına göre bu "paylaşım" değil)

### Toplanan veriler

| Kategori | Tür | Zorunlu? | Amaç |
|---|---|---|---|
| Kişisel bilgiler | Ad | Zorunlu | Uygulama işlevi, hesap yönetimi |
| Kişisel bilgiler | E-posta adresi | Zorunlu | Hesap yönetimi, iletişim |
| Kişisel bilgiler | Kullanıcı kimlikleri | Zorunlu | Uygulama işlevi |
| Kişisel bilgiler | Diğer (biyografi, cinsiyet, doğum tarihi, şehir) | **İsteğe bağlı** | Uygulama işlevi |
| Konum | Yaklaşık konum | İsteğe bağlı | Uygulama işlevi (yakındaki etkinlikler) |
| Konum | Hassas konum | İsteğe bağlı | Uygulama işlevi (harita, mesafe sıralaması) |
| Fotoğraf ve video | Fotoğraflar | İsteğe bağlı | Uygulama işlevi (profil, albüm, gönderi) |
| Mesajlar | Diğer uygulama içi mesajlar | İsteğe bağlı | Uygulama işlevi |
| Uygulama etkinliği | Uygulama içi etkileşimler | Zorunlu | Uygulama işlevi |

Cinsiyet ve doğum tarihini **isteğe bağlı** işaretlemek önemli — Apple'ın
5.1.1(v) reddini kapatırken bu alanları opsiyonel yaptık, form da bunu
yansıtmalı.

### Hesap silme bağlantısı

Google, hesap oluşturulabilen uygulamalarda **uygulamayı indirmeden
erişilebilen bir web sayfası** istiyor. Uygulama içi hesap silme tek başına
yetmiyor.

```
https://sportner.app/hesap-silme/
```

Sayfa `sportner-site` içinde hazırlandı: uygulama içi kapatma adımları,
e-postayla tam silme talebi, silinen / anonimleştirilen / saklanan verilerin
listesi ve 30 günlük sonuçlandırma süresi yer alıyor. **Site yeniden
dağıtılmadan bu adres canlı olmaz.**

---

## 5. İçerik derecelendirmesi

Anketi doldururken verilecek cevaplar:

- Kullanıcılar birbiriyle **iletişim kurabiliyor** → Evet (mesajlaşma, yorum)
- Kullanıcılar **konumlarını paylaşabiliyor** → Evet
- **Kullanıcı tarafından oluşturulan içerik** var → Evet (gönderi, fotoğraf, biyografi)
- Şiddet, cinsellik, kumar, uyuşturucu, korkutucu içerik → Hayır
- Dijital satın alma → Hayır

Bu cevaplarla Türkiye'de muhtemelen **12+** veya **16+** çıkar. Kullanıcı
içeriği ve mesajlaşma olduğu için moderasyon araçlarının (şikayet, engelleme)
uygulamada bulunduğundan emin ol — Google bunu ayrıca sorabiliyor.

---

## 6. Hedef kitle

**Uygulama içeriği > Hedef kitle ve içerik**

Yaş grubu olarak yalnızca **18 ve üzeri** seçilmesini öneriyorum.

Sebep: 13-17 aralığını işaretlersen uygulama Google'ın **Families Policy**
kapsamına giriyor. Bu da ek gereklilikler demek — reklam ağı kısıtları,
çocuklara uygun tasarım beyanı, ek inceleme. Konum paylaşan ve yabancılarla
buluşmaya yönlendiren bir uygulamada bu kapsamın dışında kalmak hem daha
hızlı hem daha güvenli.

---

## 7. Uygulama erişimi

**Uygulama içeriği > Uygulama erişimi**

"Tüm işlevler kısıtlama olmadan kullanılabilir" **değil** — giriş gerekiyor.
Apple'a verdiğin reviewer hesabının aynısını gir:

- Kullanıcı adı / e-posta: _(Apple'a verdiğin demo hesap)_
- Şifre: _(aynısı)_
- Talimat: Giriş yaptıktan sonra ana akışta etkinlikler listelenir.

---

## 8. Gizlilik politikası

**Mağaza ayarları > Gizlilik politikası**

```
https://sportner.app/gizlilik/
```

Apple'a verilen adresin aynısı. Gizlilik politikasının 6. bölümü artık
hesap silme sayfasına bağlanıyor.

---

## 9. Kapalı test (üretim erişiminin ön koşulu)

Bireysel geliştirici hesabı olduğu için üretime çıkmadan önce zorunlu:

- **12 test kullanıcısı**, kesintisiz **14 gün** boyunca kayıtlı kalmalı
- Sayı 12'nin altına düşerse sayaç sıfırlanır
- 14 gün dolduktan sonra "üretim erişimi" başvurusu yapılır
- Google başvuruyu değerlendirirken test sürecindeki kullanımı ve geri
  bildirimleri de inceliyor — testerların uygulamayı gerçekten açması önemli

Testerları e-posta listesi ya da Google Grubu ile davet edebilirsin. Gmail
adresi şart.

---

## 10. AAB build

Play Store APK değil **AAB** istiyor. `preview` profili APK üretiyor,
`production` profili AAB:

```bash
npx eas build --platform android --profile production
```

İlk yüklemeden sonra yapılacak: Google, uygulamayı kendi imzasıyla yeniden
imzalıyor (Play App Signing). Bu imzanın **SHA-1**'ini
`Play Console > Test ve yayınla > Uygulama bütünlüğü` altından alıp
**Google Cloud projesi 1000243667995** içindeki Android OAuth istemcisine
eklemek gerekiyor. Aksi halde mağazadan inen sürümde Google ile giriş
çalışmaz — geliştirme imzasıyla çalışması yanıltmasın.
