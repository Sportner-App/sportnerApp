import { BlurView } from "expo-blur";
import { Image, View } from "react-native";
import Svg, { Circle, Line, Path, Rect } from "react-native-svg";

import { palette, sportAccents } from "@/constants/theme";

/**
 * Sohbet zeminleri.
 *
 * Mesaj ekranları düz tek renkti ve hepsi birbirinin aynısı görünüyordu.
 * Etkinlik sohbetlerinde zemin o etkinliğin kapak görseli; birebir
 * sohbetlerde kullanıcının seçtiği saha çizgisi.
 *
 * Desenler soyut degrade değil, gerçek saha çizgileri: futbol sahasının orta
 * yuvarlağı, basketbol potasının boyası, tenis kortu, koşu pistinin
 * kulvarları. Uygulamanın konusu bu; zemin de onu anlatıyor.
 *
 * Okunabilirlik pazarlık konusu değil: çizgiler düşük opaklıkta, renk yalnızca
 * köşelerden sızan bir ışık, üstte koyu perde var.
 */
export const CHAT_BACKGROUND_IDS = [
  "etkinlik",
  "duz",
  "saha",
  "parke",
  "kort",
  "pist",
] as const;

export type ChatBackgroundId = (typeof CHAT_BACKGROUND_IDS)[number];

/** Etkinlik sohbetinde kapak görseli, birebir sohbette futbol sahası. */
export const DEFAULT_CHAT_BACKGROUND: ChatBackgroundId = "saha";
export const DEFAULT_EVENT_CHAT_BACKGROUND: ChatBackgroundId = "etkinlik";

const CIZGI = palette.white;
const CIZGI_OPAKLIK = 0.16;

/** Sahalar dikey bir alana çiziliyor; kutu oranı ne olursa olsun taşarak kaplar. */
const GORUS = "0 0 400 800";

type Desen = {
  /** Köşelerden sızan renk; sahanın kimliğini verir. */
  isik: string;
  cizim: React.ReactNode;
};

const DESENLER: Record<ChatBackgroundId, Desen | null> = {
  etkinlik: null,
  duz: null,

  /** Futbol: orta yuvarlak, orta çizgi ve iki ceza sahası. */
  saha: {
    isik: sportAccents.football.accent,
    cizim: (
      <>
        <Line x1="0" y1="400" x2="400" y2="400" />
        <Circle cx="200" cy="400" r="86" />
        <Circle cx="200" cy="400" r="5" fill={CIZGI} />
        <Rect x="70" y="-2" width="260" height="130" />
        <Rect x="140" y="-2" width="120" height="58" />
        <Rect x="70" y="672" width="260" height="130" />
        <Rect x="140" y="744" width="120" height="58" />
      </>
    ),
  },

  /** Basketbol: yarı saha, boya alanı, serbest atış dairesi ve üç sayı yayı. */
  parke: {
    isik: sportAccents.basketball.accent,
    cizim: (
      <>
        <Line x1="0" y1="400" x2="400" y2="400" />
        <Circle cx="200" cy="400" r="62" />
        <Rect x="140" y="-2" width="120" height="190" />
        <Circle cx="200" cy="188" r="60" />
        <Path d="M40 -2 V70 A170 170 0 0 0 360 70 V-2" />
        <Rect x="140" y="612" width="120" height="190" />
        <Circle cx="200" cy="612" r="60" />
        <Path d="M40 802 V730 A170 170 0 0 1 360 730 V802" />
      </>
    ),
  },

  /** Tenis: servis kutuları ve orta servis çizgisi. */
  kort: {
    isik: sportAccents.volleyball.accent,
    cizim: (
      <>
        <Rect x="46" y="60" width="308" height="680" />
        <Line x1="92" y1="60" x2="92" y2="740" />
        <Line x1="308" y1="60" x2="308" y2="740" />
        <Line x1="92" y1="240" x2="308" y2="240" />
        <Line x1="92" y1="560" x2="308" y2="560" />
        <Line x1="200" y1="240" x2="200" y2="560" />
        <Line x1="20" y1="400" x2="380" y2="400" />
      </>
    ),
  },

  /** Koşu: virajı dönen kulvar çizgileri. */
  pist: {
    isik: sportAccents.running.accent,
    cizim: (
      <>
        <Path d="M-40 800 Q 120 420 440 300" />
        <Path d="M-40 880 Q 140 470 460 350" />
        <Path d="M-40 960 Q 160 520 480 400" />
        <Path d="M-40 1040 Q 180 570 500 450" />
        <Line x1="-10" y1="690" x2="150" y2="420" />
        <Line x1="60" y1="760" x2="220" y2="490" />
      </>
    ),
  },
};

export function ChatBackground({
  variant,
  imageUrl,
}: {
  variant: ChatBackgroundId;
  /** Yalnızca "etkinlik" zemininde kullanılır; yoksa düz zemine düşer. */
  imageUrl?: string | null;
}) {
  if (variant === "etkinlik" && imageUrl) {
    return (
      <View className="flex-1">
        <Image
          source={{ uri: imageUrl }}
          resizeMode="cover"
          className="absolute inset-0 h-full w-full"
        />
        {/* Bulanıklık fotoğrafın detayını siler, perde kontrastı verir.
            İkisi olmadan açık renkli kapaklarda beyaz metin okunmuyordu. */}
        <BlurView
          intensity={30}
          tint="dark"
          className="absolute inset-0 h-full w-full"
        />
        {/* Perde koyu: açık kapaklarda fotoğraf griye dönüp ikincil metinleri
            yutuyordu. Fotoğraf burada bir doku, duvar kağıdı değil.
            Opaklık beşin katı olmalı — /88 gibi bir değer Tailwind ölçeğinde
            yok ve sınıf hiç üretilmiyor (perde tamamen kayboluyor). */}
        <View className="absolute inset-0 bg-background-primary/35" />

      </View>
    );
  }

  const desen = DESENLER[variant];

  if (!desen) {
    return <View className="flex-1 bg-background-primary" />;
  }

  return (
    <View className="flex-1 overflow-hidden bg-background-primary">
      {/* Önce renk: köşelerden sızan iki ışık. Bulanıklık yalnızca bunların
          üstünde, saha çizgileri keskin kalsın diye altta çiziliyor. */}
      <View
        className="absolute rounded-full"
        style={{
          top: "-25%",
          left: "-30%",
          width: "105%",
          aspectRatio: 1,
          backgroundColor: desen.isik,
          opacity: 0.22,
        }}
      />
      <View
        className="absolute rounded-full"
        style={{
          bottom: "-30%",
          right: "-28%",
          width: "115%",
          aspectRatio: 1,
          backgroundColor: desen.isik,
          opacity: 0.14,
        }}
      />
      <BlurView
        intensity={60}
        tint="dark"
        className="absolute inset-0 h-full w-full"
      />

      <Svg
        width="100%"
        height="100%"
        viewBox={GORUS}
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        stroke={CIZGI}
        strokeOpacity={CIZGI_OPAKLIK}
        strokeWidth={2.5}
      >
        {desen.cizim}
      </Svg>

      <View className="absolute inset-0 bg-background-primary/35" />
    </View>
  );
}
