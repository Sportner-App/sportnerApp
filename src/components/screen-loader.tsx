import { View } from "react-native";

import { SportLoader } from "./sport-loader";

type ScreenLoaderProps = {
  /** Boş string etiketi gizler; verilmezse genel "Yükleniyor". */
  label?: string;
  /**
   * - `page`: içerik yerine geçen tam yükleme (varsayılan)
   * - `more`: liste sonunda "daha fazla yükleniyor"
   */
  variant?: "page" | "more";
  size?: number;
  /** Varsayılan kapsayıcı sınıflarının yerine geçer. */
  className?: string;
};

const VARIANTS = {
  page: { className: "items-center py-16", size: 120 },
  more: { className: "items-center py-5", size: 64 },
} as const;

export function ScreenLoader({
  label,
  variant = "page",
  size,
  className,
}: ScreenLoaderProps) {
  const preset = VARIANTS[variant];
  return (
    <View className={className ?? preset.className}>
      <SportLoader size={size ?? preset.size} label={label} />
    </View>
  );
}
