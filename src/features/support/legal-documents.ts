/**
 * Kayıt akışındaki onay ekranında gösterilen hukuki metinler.
 *
 * Metinler bilerek i18n dosyalarında değil: bunlar çevrilebilir arayüz kopyası
 * değil, Türkçe olarak bağlayıcı olan hukuki içerik. Uygulama dili İngilizce
 * olsa da doküman Türkçe gösterilir; sadece çevresindeki arayüz çevrilir.
 *
 * Kaynak: sportner.app/kvkk ve sportner.app/gizlilik — güncellerken ikisini
 * birlikte güncelle ve updatedLabel alanındaki tarihi değiştir.
 */

/** Paragraf ve madde metinlerinde **çift yıldız** arası kısımlar kalın gösterilir. */
export type LegalBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "subheading"; text: string }
  | { kind: "bullets"; items: string[] }
  | { kind: "definitions"; items: { term: string; description: string }[] }
  | { kind: "table"; columns: string[]; rows: string[][] };

export type LegalSection = {
  title: string;
  blocks: LegalBlock[];
};

export type LegalDocument = {
  title: string;
  updatedLabel: string;
  sections: LegalSection[];
};

const KVKK_DOCUMENT: LegalDocument = {
  title: "KVKK Aydınlatma Metni",
  updatedLabel: "Son güncelleme: 28.09.2026",
  sections: [
    {
      title: "1. Veri Sorumlusu",
      blocks: [
        {
          kind: "paragraph",
          text: "6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca kişisel verileriniz, veri sorumlusu sıfatıyla **Yağız Erdenler** (“Sportner”, “biz”) tarafından aşağıda açıklanan kapsamda işlenmektedir.",
        },
        {
          kind: "paragraph",
          text: "Sportner bir şirket tarafından değil, bağımsız bir geliştirici tarafından sunulmaktadır. Veri sorumlusu gerçek kişidir.",
        },
        {
          kind: "definitions",
          items: [
            { term: "Veri sorumlusu", description: "Yağız Erdenler" },
            { term: "Uygulama", description: "Sportner (iOS ve Android)" },
            { term: "İletişim ve başvuru", description: "destek@sportner.app" },
          ],
        },
        {
          kind: "paragraph",
          text: "Taleplerinizi yukarıdaki e-posta adresine iletebilirsiniz. Başvuru yöntemleri 9. bölümde ayrıntılı olarak açıklanmıştır.",
        },
      ],
    },
    {
      title: "2. İşlenen Kişisel Veriler",
      blocks: [
        { kind: "subheading", text: "2.1 Hesap ve kimlik verileri" },
        {
          kind: "bullets",
          items: [
            "Ad, soyad",
            "Kullanıcı adı",
            "E-posta adresi",
            "Doğum tarihi",
            "Cinsiyet (isteğe bağlı)",
            "Şehir (isteğe bağlı)",
            "Profil fotoğrafı (isteğe bağlı)",
            "Hakkımda metni (isteğe bağlı)",
          ],
        },
        {
          kind: "paragraph",
          text: "Şifreniz düz metin olarak saklanmaz; yalnızca geri döndürülemez özet (hash) değeri tutulur.",
        },
        { kind: "subheading", text: "2.2 Sosyal hesapla giriş" },
        {
          kind: "paragraph",
          text: "Google veya Apple ile giriş yapmayı seçerseniz, ilgili sağlayıcıdan yalnızca sizi tanımlayan kimlik bilgisi ve (sağlayıcı paylaşıyorsa) e-posta adresiniz alınır. Sportner’ın bu hesaplardaki başka hiçbir veriye erişimi yoktur.",
        },
        { kind: "subheading", text: "2.3 Spor ve etkinlik verileri" },
        {
          kind: "bullets",
          items: [
            "İlgilendiğiniz spor dalları ve seviyeniz",
            "Oluşturduğunuz ve katıldığınız etkinlikler",
            "Etkinlik katılım durumunuz ve katılım geçmişiniz",
            "Diğer kullanıcılardan aldığınız değerlendirmeler ve oyuncu puanınız",
            "Kazandığınız rozetler ve tamamladığınız görevler",
          ],
        },
        { kind: "subheading", text: "2.4 İçerik verileri" },
        {
          kind: "bullets",
          items: [
            "Paylaştığınız gönderiler, fotoğraflar ve yorumlar",
            "Etkinlik albümlerine yüklediğiniz görseller",
            "Birebir ve etkinlik grup sohbetlerindeki mesajlarınız ve gönderdiğiniz medya dosyaları",
          ],
        },
        { kind: "subheading", text: "2.5 Konum verileri" },
        {
          kind: "bullets",
          items: [
            "**Anlık konumunuz:** Etkinlikleri size yakınlıklarına göre sıralamak için kullanılır. Bu veri sunucuya yalnızca sorgu anında iletilir ve **hesabınıza kaydedilmez.**",
            "**Etkinlik konumları:** Bir etkinlik oluşturduğunuzda seçtiğiniz adres ve koordinatlar, etkinliğin bir parçası olarak saklanır ve katılımcılara gösterilir.",
            "**Kayıtlı konumlar:** Kendi kaydettiğiniz mekânlar hesabınızda saklanır.",
            "Konum izni vermeyi reddedebilirsiniz; bu durumda yalnızca yakınlığa göre sıralama devre dışı kalır, uygulamanın geri kalanı çalışmaya devam eder.",
          ],
        },
        { kind: "subheading", text: "2.6 Cihaz ve oturum verileri" },
        {
          kind: "bullets",
          items: [
            "Cihaz adı, platformu (iOS/Android), işletim sistemi ve uygulama sürümü",
            "Bildirim gönderebilmek için cihaz bildirim jetonu",
            "Oturum açtığınız IP adresi ve uygulama tanımlayıcısı (güvenlik ve oturum yönetimi amacıyla)",
          ],
        },
      ],
    },
    {
      title: "3. İşleme Amaçları",
      blocks: [
        {
          kind: "definitions",
          items: [
            {
              term: "Hesap oluşturma ve kimlik doğrulama",
              description: "Üyeliğinizi kurmak, giriş yapmanızı sağlamak",
            },
            {
              term: "Hizmetin sunulması",
              description:
                "Etkinlik oluşturma, keşfetme, katılma ve mesajlaşma",
            },
            {
              term: "Kişiselleştirme",
              description:
                "Etkinlikleri konumunuza ve ilgilendiğiniz sporlara göre sıralamak",
            },
            {
              term: "İletişim",
              description:
                "E-posta doğrulama, şifre sıfırlama ve bildirim gönderimi",
            },
            {
              term: "Güvenlik",
              description:
                "Yetkisiz erişimi engellemek, kötüye kullanımı tespit etmek",
            },
            {
              term: "Topluluk güvenliği",
              description: "Şikâyet ve engelleme mekanizmalarını işletmek",
            },
            {
              term: "Yasal yükümlülükler",
              description:
                "Mevzuattan doğan saklama ve bilgi verme yükümlülükleri",
            },
          ],
        },
        {
          kind: "paragraph",
          text: "Kişisel verileriniz **satılmaz** ve pazarlama amacıyla üçüncü taraflara aktarılmaz.",
        },
      ],
    },
    {
      title: "4. Hukuki Sebepler",
      blocks: [
        {
          kind: "paragraph",
          text: "Kişisel verileriniz KVKK m.5 kapsamında şu hukuki sebeplere dayanılarak işlenmektedir:",
        },
        {
          kind: "bullets",
          items: [
            "**Sözleşmenin kurulması veya ifası** (m.5/2-c): Hesabınızın oluşturulması, etkinliklere katılım, mesajlaşma",
            "**Hukuki yükümlülüğün yerine getirilmesi** (m.5/2-ç): Mevzuatın öngördüğü saklama ve bildirim yükümlülükleri",
            "**Meşru menfaat** (m.5/2-f): Hizmet güvenliği, kötüye kullanımın önlenmesi",
            "**Açık rıza** (m.5/1): Konum verisinin kullanılması",
          ],
        },
        {
          kind: "paragraph",
          text: "Konum izni cihazınızın işletim sistemi üzerinden istenir ve dilediğiniz an cihaz ayarlarından geri alınabilir.",
        },
      ],
    },
    {
      title: "5. Kişisel Verilerin Aktarılması",
      blocks: [
        {
          kind: "paragraph",
          text: "Hizmetin çalışabilmesi için aşağıdaki hizmet sağlayıcılardan yararlanılmaktadır. Sağlayıcıların tamamının sunucuları yurt dışındadır:",
        },
        {
          kind: "table",
          columns: ["Sağlayıcı", "Aktarılan veri", "Amaç", "Sunucu konumu"],
          rows: [
            [
              "Supabase",
              "Hesap, içerik, mesaj ve medya verileri",
              "Veritabanı ve dosya depolama",
              "Yurt dışı",
            ],
            ["Railway", "Uygulama trafiği", "Sunucu barındırma", "Yurt dışı (AB)"],
            [
              "Google (Places)",
              "Yazdığınız adres araması ve seçtiğiniz koordinat",
              "Adres arama ve doğrulama",
              "Yurt dışı",
            ],
            [
              "Google / Apple",
              "Kimlik bilgisi",
              "Sosyal hesapla giriş",
              "Yurt dışı",
            ],
            [
              "Mapbox",
              "Harita görüntüleme talebi",
              "Harita altyapısı",
              "Yurt dışı",
            ],
            [
              "Resend",
              "E-posta adresiniz",
              "Doğrulama ve şifre sıfırlama e-postaları",
              "Yurt dışı",
            ],
            [
              "Expo",
              "Cihaz bildirim jetonu",
              "Anlık bildirim gönderimi",
              "Yurt dışı",
            ],
          ],
        },
        {
          kind: "paragraph",
          text: "Ayrıca yetkili kamu kurum ve kuruluşlarına, yalnızca mevzuatın gerektirdiği hâllerde ve gerektirdiği ölçüde aktarım yapılabilir.",
        },
      ],
    },
    {
      title: "6. Toplama Yöntemi",
      blocks: [
        { kind: "paragraph", text: "Kişisel verileriniz;" },
        {
          kind: "bullets",
          items: [
            "Uygulamaya kayıt olurken ve profilinizi doldururken doğrudan sizden,",
            "Uygulamayı kullandığınız sırada otomatik olarak (cihaz ve oturum bilgileri),",
            "Sosyal hesapla giriş yapmayı seçmeniz hâlinde ilgili sağlayıcıdan",
          ],
        },
        { kind: "paragraph", text: "elektronik ortamda toplanmaktadır." },
      ],
    },
    {
      title: "7. Saklama Süreleri",
      blocks: [
        {
          kind: "definitions",
          items: [
            {
              term: "Hesap ve profil verileri",
              description: "Hesabınız açık kaldığı sürece",
            },
            { term: "Oturum kayıtları", description: "En fazla 90 gün" },
            {
              term: "Mesajlar ve paylaşımlar",
              description: "Siz silene kadar",
            },
            {
              term: "E-posta doğrulama ve şifre sıfırlama kodları",
              description: "15 dakika",
            },
          ],
        },
        {
          kind: "paragraph",
          text: "Hesabınızı kapattığınızda verilerinizin ne olduğu için Gizlilik Politikası’nın “Hesabınızı kapatma” bölümüne bakınız. Verilerinizin tamamen silinmesini istiyorsanız destek@sportner.app adresine başvurabilirsiniz; talebiniz en geç 30 gün içinde sonuçlandırılır.",
        },
      ],
    },
    {
      title: "8. Haklarınız (KVKK m.11)",
      blocks: [
        { kind: "paragraph", text: "Veri sorumlusuna başvurarak;" },
        {
          kind: "bullets",
          items: [
            "Kişisel verinizin işlenip işlenmediğini öğrenme,",
            "İşlenmişse buna ilişkin bilgi talep etme,",
            "İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,",
            "Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,",
            "Eksik veya yanlış işlenmişse düzeltilmesini isteme,",
            "Silinmesini veya yok edilmesini isteme,",
            "Düzeltme, silme ve yok etme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme,",
            "Münhasıran otomatik sistemlerle analiz edilmesi suretiyle aleyhinize bir sonuç ortaya çıkmasına itiraz etme,",
            "Kanuna aykırı işleme sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme",
          ],
        },
        { kind: "paragraph", text: "haklarına sahipsiniz." },
      ],
    },
    {
      title: "9. Başvuru",
      blocks: [
        {
          kind: "paragraph",
          text: "Haklarınızı kullanmak için taleplerinizi **destek@sportner.app** adresine iletebilirsiniz.",
        },
        {
          kind: "paragraph",
          text: "Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ uyarınca başvurunuzun değerlendirilebilmesi için, başvurunuzu **Sportner hesabınızda kayıtlı e-posta adresinden** göndermeniz gerekmektedir. Başvurunuzda adınızı, soyadınızı ve talebinizin konusunu açıkça belirtiniz.",
        },
        {
          kind: "paragraph",
          text: "Başvurunuz en geç **30 gün** içinde sonuçlandırılır. Başvurunun ayrıca bir maliyet gerektirmesi hâlinde Kişisel Verileri Koruma Kurulu’nca belirlenen tarifedeki ücret alınabilir.",
        },
        {
          kind: "paragraph",
          text: "Uygulama içinden **Ayarlar → Gizlilik** bölümünden profilinizi gizleyebilir, hesabınızı kapatabilir ve veri tercihlerinizi yönetebilirsiniz.",
        },
      ],
    },
    {
      title: "10. Değişiklikler",
      blocks: [
        {
          kind: "paragraph",
          text: "Bu metin güncellenebilir. Önemli bir değişiklik olduğunda uygulama içinden bildirilir. Son güncelleme tarihi en üstte yer alır.",
        },
      ],
    },
  ],
};

const PRIVACY_DOCUMENT: LegalDocument = {
  title: "Gizlilik Politikası",
  updatedLabel: "Yürürlük tarihi: 28.09.2026",
  sections: [
    {
      title: "1. Bu politika ne anlatıyor",
      blocks: [
        {
          kind: "paragraph",
          text: "Sportner (“uygulama”, “biz”), şehrindeki spor etkinliklerini bulup katılabileceğin bir topluluk uygulamasıdır. Bu politika, uygulamayı kullandığında hangi bilgileri topladığımızı, neden topladığımızı, kimlerle paylaştığımızı ve bunlar üzerinde nasıl kontrol sahibi olduğunu açıklar.",
        },
        {
          kind: "paragraph",
          text: "Sportner bir şirket tarafından değil, bağımsız bir geliştirici tarafından sunulmaktadır. Veri sorumlusu **Yağız Erdenler**’dir.",
        },
        {
          kind: "paragraph",
          text: "Türkiye’de yerleşik kullanıcılar için ayrıca **KVKK Aydınlatma Metni** geçerlidir; bu iki belgeyi birlikte okuyun.",
        },
        {
          kind: "paragraph",
          text: "Uygulamayı kullanarak bu politikayı kabul etmiş olursun.",
        },
      ],
    },
    {
      title: "2. Topladığımız bilgiler",
      blocks: [
        { kind: "subheading", text: "Sen verdiğin için topladıklarımız" },
        {
          kind: "bullets",
          items: [
            "**Hesap:** ad, soyad, kullanıcı adı, e-posta, doğum tarihi",
            "**Profil (isteğe bağlı):** cinsiyet, şehir, profil fotoğrafı, hakkımda metni, ilgilendiğin spor dalları ve seviyen",
            "**İçerik:** oluşturduğun etkinlikler, gönderiler, fotoğraflar, yorumlar, albüm görselleri ve mesajların",
            "**Kaydettiğin mekânlar**",
          ],
        },
        {
          kind: "subheading",
          text: "Uygulamayı kullanırken otomatik topladıklarımız",
        },
        {
          kind: "bullets",
          items: [
            "**Cihaz:** platform (iOS/Android), cihaz adı, işletim sistemi ve uygulama sürümü",
            "**Oturum:** IP adresi ve uygulama tanımlayıcısı — yalnızca güvenlik ve oturum yönetimi için",
            "**Bildirim jetonu:** sana bildirim gönderebilmek için",
          ],
        },
        { kind: "subheading", text: "Konum" },
        {
          kind: "paragraph",
          text: "Etkinlikleri sana yakınlığına göre sıralamak için anlık konumunu kullanırız. **Bu konum hesabına kaydedilmez** — yalnızca o sorgu için sunucuya iletilir ve sonuç döndükten sonra saklanmaz.",
        },
        {
          kind: "paragraph",
          text: "Bir etkinlik oluşturduğunda seçtiğin adres, etkinliğin bir parçası olarak saklanır ve katılımcılara gösterilir. Bu, konum izninden bağımsızdır.",
        },
        {
          kind: "paragraph",
          text: "Konum iznini reddedebilirsin; yalnızca yakınlığa göre sıralama devre dışı kalır, uygulamanın geri kalanı normal çalışır. İzni istediğin an cihaz ayarlarından geri alabilirsin.",
        },
        { kind: "subheading", text: "Toplamadıklarımız" },
        {
          kind: "bullets",
          items: [
            "Rehberini, takvimini veya cihazındaki diğer uygulamaları okumuyoruz",
            "Arka planda konum takibi yapmıyoruz",
            "Reklam kimliği toplamıyor, üçüncü taraf reklam ağı kullanmıyoruz",
            "Şifreni düz metin olarak saklamıyoruz",
          ],
        },
      ],
    },
    {
      title: "3. Bilgileri ne için kullanıyoruz",
      blocks: [
        {
          kind: "bullets",
          items: [
            "Hesabını oluşturmak ve girişini doğrulamak",
            "Etkinlikleri göstermek, oluşturmanı ve katılmanı sağlamak",
            "Katılımcılarla mesajlaşmanı sağlamak",
            "Etkinlikleri konumuna ve ilgi alanlarına göre sıralamak",
            "E-posta doğrulama ve şifre sıfırlama göndermek",
            "Etkinlik ve mesaj bildirimleri göndermek",
            "Kötüye kullanımı tespit etmek, şikâyetleri değerlendirmek",
            "Hizmetin teknik sorunlarını gidermek",
          ],
        },
        {
          kind: "paragraph",
          text: "**Verilerini satmıyoruz** ve pazarlama amacıyla üçüncü taraflara aktarmıyoruz.",
        },
      ],
    },
    {
      title: "4. Diğer kullanıcılar ne görüyor",
      blocks: [
        {
          kind: "paragraph",
          text: "Sportner bir topluluk uygulaması; bazı bilgilerin tasarımı gereği başkalarına görünür:",
        },
        {
          kind: "definitions",
          items: [
            {
              term: "Kullanıcı adın, adın, profil fotoğrafın",
              description: "Herkes görür",
            },
            {
              term: "Hakkımda metnin, sporların, oyuncu puanın",
              description: "Profilin herkese açıksa herkes görür",
            },
            {
              term: "Oluşturduğun etkinlikler ve adresleri",
              description: "Herkes görür",
            },
            {
              term: "Katıldığın etkinlikler",
              description: "Etkinliğin diğer katılımcıları görür",
            },
            {
              term: "Gönderilerin ve yorumların",
              description: "Keşfet akışını gören herkes görür",
            },
            {
              term: "Mesajların",
              description:
                "Yalnızca yazıştığın kişiler / etkinlik grubu görür",
            },
          ],
        },
        {
          kind: "paragraph",
          text: "Profilini **Ayarlar → Gizlilik**’ten gizli yapabilirsin.",
        },
        {
          kind: "paragraph",
          text: "Bir kullanıcıyı rahatsız edici buluyorsan **engelleyebilir** veya **şikâyet edebilirsin**. Şikâyetler tarafımızca incelenir; kuralları ihlal eden içerik kaldırılır ve hesap askıya alınabilir.",
        },
      ],
    },
    {
      title: "5. Hizmet sağlayıcılar",
      blocks: [
        {
          kind: "paragraph",
          text: "Uygulamanın çalışabilmesi için aşağıdaki sağlayıcılardan yararlanıyoruz. Hepsinin sunucuları **yurt dışındadır**:",
        },
        {
          kind: "table",
          columns: ["Sağlayıcı", "Ne için", "Ne görüyor"],
          rows: [
            [
              "Supabase",
              "Veritabanı ve dosya depolama",
              "Hesap, içerik, mesaj ve medya verilerin",
            ],
            ["Railway", "Sunucu barındırma", "Uygulama trafiği"],
            [
              "Google",
              "Adres arama, sosyal giriş",
              "Yazdığın adres sorgusu; giriş yaparsan kimlik bilgin",
            ],
            ["Apple", "Sosyal giriş", "Giriş yaparsan kimlik bilgin"],
            ["Mapbox", "Harita", "Harita görüntüleme talebi"],
            ["Resend", "E-posta gönderimi", "E-posta adresin"],
            ["Expo", "Anlık bildirim", "Cihaz bildirim jetonun"],
          ],
        },
        {
          kind: "paragraph",
          text: "Ayrıca yalnızca mevzuatın gerektirdiği hâllerde ve gerektirdiği ölçüde yetkili kamu kurumlarıyla paylaşım yapılabilir.",
        },
      ],
    },
    {
      title: "6. Verilerin üzerindeki kontrolün",
      blocks: [
        { kind: "subheading", text: "Düzenleme" },
        {
          kind: "paragraph",
          text: "Profil bilgilerini, fotoğrafını ve spor tercihlerini uygulama içinden istediğin zaman değiştirebilirsin. Gönderilerini ve mesajlarını silebilirsin.",
        },
        { kind: "subheading", text: "Hesabını kapatma" },
        {
          kind: "paragraph",
          text: "Uygulama içindeki hesap silme işlemi hesabını **kapatır**: oturumların sonlandırılır, hesabın devre dışı bırakılır ve profilin diğer kullanıcılara görünmez olur. Bu işlemin ardından hesabına giriş yapamazsın.",
        },
        {
          kind: "paragraph",
          text: "Bu işlem, profil bilgilerini, geçmiş paylaşımlarını ve mesajlarını veritabanımızdan **otomatik olarak silmez.** Bunun iki nedeni var: etkinlik geçmişinin ve grup sohbetlerinin diğer katılımcılar açısından tutarlı kalması ve kötüye kullanım şikâyetlerinin değerlendirilebilmesi.",
        },
        {
          kind: "paragraph",
          text: "**Verilerinin tamamen silinmesini istiyorsan**, hesabında kayıtlı e-posta adresinden **destek@sportner.app** adresine yazman yeterli. Talebini en geç **30 gün** içinde sonuçlandırır ve kişisel verilerini siler veya anonim hâle getiririz. Mevzuatın saklamayı zorunlu kıldığı veriler, ilgili süre boyunca yalnızca bu amaçla saklanır.",
        },
        { kind: "subheading", text: "Talepte bulunma" },
        {
          kind: "paragraph",
          text: "Verilerine erişmek, düzeltilmesini veya silinmesini istemek için **destek@sportner.app** adresine yazabilirsin. Taleplere en geç **30 gün** içinde yanıt veriyoruz. KVKK kapsamındaki haklarının tamamı için Aydınlatma Metni’ne bakabilirsin.",
        },
        { kind: "subheading", text: "Bildirimler" },
        {
          kind: "paragraph",
          text: "Bildirim tercihlerini cihazının sistem ayarlarından yönetebilir, tamamen kapatabilirsin.",
        },
      ],
    },
    {
      title: "7. Saklama süreleri",
      blocks: [
        {
          kind: "definitions",
          items: [
            {
              term: "Hesap ve profil",
              description: "Hesabın açık kaldığı sürece",
            },
            { term: "Oturum kayıtları", description: "En fazla 90 gün" },
            { term: "İçerik ve mesajlar", description: "Sen silene kadar" },
            {
              term: "E-posta doğrulama / şifre sıfırlama kodları",
              description: "15 dakika",
            },
            {
              term: "Kapatılmış hesaplara ait veriler",
              description: "Silme talebinde bulunana kadar",
            },
          ],
        },
      ],
    },
    {
      title: "8. Güvenlik",
      blocks: [
        {
          kind: "paragraph",
          text: "Şifreler geri döndürülemez özet (hash) olarak saklanır. Uygulama ile sunucu arasındaki tüm trafik şifrelenir (HTTPS). Oturumlar süreli jetonlarla yönetilir ve şüpheli durumda iptal edilebilir.",
        },
        {
          kind: "paragraph",
          text: "Hiçbir sistem %100 güvenli değildir. Hesabında olağandışı bir durum fark edersen **destek@sportner.app** adresine bildir.",
        },
      ],
    },
    {
      title: "9. Çocukların gizliliği",
      blocks: [
        {
          kind: "paragraph",
          text: "Sportner **13 yaşından küçükler için tasarlanmamıştır** ve kayıt sırasında 13 yaş sınırı uygulanır. 13 yaşından küçük bir kullanıcıya ait veri topladığımızı öğrenirsek hesabı kapatır ve veriyi sileriz.",
        },
      ],
    },
    {
      title: "10. Bu politikadaki değişiklikler",
      blocks: [
        {
          kind: "paragraph",
          text: "Politikayı güncelleyebiliriz. Önemli bir değişiklik olduğunda uygulama içinden bildiririz. Yürürlük tarihi en üstte yer alır.",
        },
      ],
    },
    {
      title: "11. İletişim",
      blocks: [
        {
          kind: "paragraph",
          text: "**Yağız Erdenler**\ndestek@sportner.app",
        },
      ],
    },
  ],
};

/** Onay ekranında gösterilme sırası: önce aydınlatma metni, sonra politika. */
export const LEGAL_DOCUMENTS: LegalDocument[] = [
  KVKK_DOCUMENT,
  PRIVACY_DOCUMENT,
];
