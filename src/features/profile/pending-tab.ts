/**
 * Bildirimden gelen sekme isteği.
 *
 * Profil bir sekme rotası; oraya sorgu parametresiyle gitmek güvenilir
 * değil — derin bağlantıda parametre ekrana hiç ulaşmıyordu. Bunun yerine
 * yönlendirmeyi hesaplayan taraf isteği buraya bırakıyor, ekran odaklandığında
 * okuyup siliyor. Tek seferlik: kullanıcı sonra kendi sekmesini seçtiğinde
 * geri zıplamıyor.
 */
export type ProfileTab = "activity" | "reviews" | "settings";

let pending: ProfileTab | null = null;

export function setPendingProfileTab(tab: ProfileTab) {
  pending = tab;
}

export function consumePendingProfileTab(): ProfileTab | null {
  const value = pending;
  pending = null;
  return value;
}
