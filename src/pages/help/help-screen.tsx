import { Text, View } from "react-native";

import { AppScreen, ScreenHeader } from "@/components";

const FAQ = [
  {
    q: "Etkinliğe nasıl katılırım?",
    a: "Etkinlik detayında Katıl’a bas. Organizatör onaylarsa sohbete girebilirsin.",
  },
  {
    q: "Neden ayrılabiliyorum?",
    a: "Katıldığın veya bekleme listesindeki etkinlikten Ayrıl ile çıkabilirsin.",
  },
  {
    q: "Bildirimler gerçek telefona düşer mi?",
    a: "Uygulama içi bildirimler çalışır. Cihaz bildirimi henüz sunucu tarafında kapalı.",
  },
];

export function HelpScreen() {
  return (
    <AppScreen
      header={<ScreenHeader title="YARDIM" showBack />}
      contentClassName="gap-4 px-6 pt-3"
    >
      <Text className="font-display text-3xl text-white">Sık sorulanlar</Text>
      {FAQ.map((item) => (
        <View
          key={item.q}
          className="rounded-3xl border border-white/10 bg-brand-surface/90 p-4"
        >
          <Text className="font-body text-sm font-semibold text-white">
            {item.q}
          </Text>
          <Text className="mt-2 font-body text-sm text-brand-neutral">
            {item.a}
          </Text>
        </View>
      ))}
    </AppScreen>
  );
}
