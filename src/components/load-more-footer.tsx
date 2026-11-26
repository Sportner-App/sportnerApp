import { useEffect, useRef, useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText as Text } from "./app-text";
import { themeColors } from "@/constants/theme";

/** Sayfa hatasında kendiliğinden deneme gecikmeleri (ms); en fazla bu kadar deneme. */
const AUTO_RETRY_DELAYS = [3000, 8000];

type LoadMoreFooterProps = {
  isLoading: boolean;
  failed: boolean;
  onRetry: () => void;
  /** Yükleme sırasında gösterilecek içerik (ör. iskelet); verilmezse küçük gösterge. */
  children?: ReactNode;
};

/**
 * Sayfalı listelerin alt bilgisi. Her zaman mount edilmeli: otomatik deneme
 * sayacı bileşenin içinde tutulur. Yükleme ya da kendiliğinden deneme
 * sürerken `children`; denemeler tükenince dokunarak tekrar deneme satırı;
 * boştayken hiçbir şey çizmez.
 */
export function LoadMoreFooter({
  isLoading,
  failed,
  onRetry,
  children,
}: LoadMoreFooterProps) {
  const { t } = useTranslation("common");
  const [attempts, setAttempts] = useState(0);
  const onRetryRef = useRef(onRetry);
  onRetryRef.current = onRetry;

  const canAutoRetry = attempts < AUTO_RETRY_DELAYS.length;

  // Başarı/boşta: sayaç sıfırlanır. Deneme sürerken (failed=false,
  // isLoading=true) sıfırlanmaz.
  useEffect(() => {
    if (!failed && !isLoading) {
      setAttempts(0);
    }
  }, [failed, isLoading]);

  useEffect(() => {
    if (!failed || isLoading || !canAutoRetry) {
      return;
    }
    const timeout = setTimeout(() => {
      setAttempts((value) => value + 1);
      onRetryRef.current();
    }, AUTO_RETRY_DELAYS[attempts]);
    return () => clearTimeout(timeout);
  }, [failed, isLoading, canAutoRetry, attempts]);

  if (isLoading || (failed && canAutoRetry)) {
    return (
      children ?? (
        <View className="items-center py-5">
          <ActivityIndicator color={themeColors.text.secondary} />
        </View>
      )
    );
  }

  if (failed) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => onRetry()}
        className="items-center py-5 active:opacity-70"
      >
        <Text className="text-center font-body text-caption text-text-secondary">
          {t("loadMoreRetry")}
        </Text>
      </Pressable>
    );
  }

  return null;
}
