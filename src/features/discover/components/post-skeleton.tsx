import { useWindowDimensions, View } from "react-native";

import { SkeletonCard } from "@/components";

/** Akışın dibinde yüklenen gönderinin yerini tutar: yazar satırı + kare medya. */
export function PostSkeleton() {
  const { width } = useWindowDimensions();

  return (
    <View style={{ paddingTop: 24 }}>
      <View className="mb-2.5 flex-row items-center gap-3 px-4">
        <SkeletonCard
          height={38}
          style={{ width: 38, borderRadius: 19 }}
        />
        <SkeletonCard
          height={14}
          style={{ width: 140, borderRadius: 7 }}
        />
      </View>
      <SkeletonCard height={width} style={{ width, borderRadius: 0 }} />
    </View>
  );
}
