/**
 * İstemci tarafı filtreleme için arama metnini ASCII'ye katlar.
 *
 * Türkçe iki ayrı tuzak çıkarıyor:
 *
 * 1. Noktalı/noktasız i. Dile duyarlı küçük harf çevirimi "Istanbul"ı
 *    "ıstanbul"a, "İstanbul"u "istanbul"a çeviriyor; ikisi eşleşmiyor.
 *    Klavye cümle başında ilk harfi büyüttüğü için kullanıcı bu farkı
 *    farkında olmadan üretiyor ve arama boş dönüyor.
 * 2. Aksanlar. "Muğla" ya da "Şanlıurfa" yazabilmek Türkçe klavye
 *    gerektiriyor; "mugla" yazan kullanıcı hiçbir sonuç göremiyordu.
 *
 * Çözüm iki tarafı da aynı sadeleştirmeden geçirmek. NFD ayrıştırması
 * birleşen işaretleri harften ayırıyor (ç, ğ, ö, ş, ü ve İ'nin noktası),
 * onları atıyoruz. Noktasız ı NFD'de ayrışmadığı için elle çevriliyor.
 *
 * Sonuç: "Istanbul", "İSTANBUL", "ıstanbul" ve "istanbul" aynı metne iner.
 */
export function normalizeSearch(value: string): string {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .toLowerCase();
}

/** Boş sorgu her şeyle eşleşir; aksi halde alanlardan biri sorguyu içermeli. */
export function matchesSearch(
  query: string,
  fields: (string | null | undefined)[],
): boolean {
  const needle = normalizeSearch(query);
  if (!needle) return true;
  return fields.some(
    (field) => field && normalizeSearch(field).includes(needle),
  );
}
