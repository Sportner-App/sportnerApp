import { StatusBar } from "expo-status-bar";
import type { PropsWithChildren } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppScreen } from "./app-screen";
import { LinearRefreshBar } from "./linear-refresh-bar";
import { brandRefreshControl } from "./refresh-control";
import { TabScreenHeader, type TabHeaderAction } from "./tab-screen-header";

type TabPageProps = PropsWithChildren<{
  refreshing: boolean;
  onRefresh: () => void;
  keyboardAvoiding?: boolean;
  onEndReached?: () => void;
  /** Full-bleed map/camera views render their own contextual header. */
  showHeader?: boolean;
  /** false renders a plain flex-1 View instead of a ScrollView (e.g. a full-screen map). */
  scroll?: boolean;
  /** Medya ağırlıklı sekmeler için: sayfa yatay padding'ini kaldırır (çocuklar
   * kendi padding'ini verir) ve içeriği status bar'ın altından akıtır. */
  edgeToEdge?: boolean;
  /** Sekmeye özel header aksiyonu; arama ikonunun yerini alır. */
  headerAction?: TabHeaderAction;
}>;

/** Ana tab sayfalarının ortak safe-area, header, spacing ve refresh kabuğu. */
export function TabPage({
  children,
  refreshing,
  onRefresh,
  keyboardAvoiding = true,
  onEndReached,
  showHeader = true,
  scroll = true,
  edgeToEdge = false,
  headerAction,
}: TabPageProps) {
  const insets = useSafeAreaInsets();
  const gap = scroll ? "gap-6" : "gap-3";

  return (
    <AppScreen
      withTabBar
      scroll={scroll}
      keyboardAvoiding={keyboardAvoiding}
      belowHeader={<LinearRefreshBar visible={refreshing} />}
      edgeToEdgeTop={edgeToEdge}
      contentClassName={edgeToEdge ? gap : `${gap} px-5 pt-2`}
      contentContainerStyle={
        // Konteyner padding'i yerine içerik inset'i: ekran en üstteyken hiçbir
        // şey gizlenmez, kaydırınca içerik status bar'ın altından akar.
        edgeToEdge ? { paddingTop: insets.top + 8 } : undefined
      }
      refreshControl={
        scroll ? brandRefreshControl({ refreshing, onRefresh }) : undefined
      }
      onEndReached={scroll ? onEndReached : undefined}
    >
      <StatusBar style="auto" />
      {showHeader ? (
        <View className={edgeToEdge ? "px-5" : undefined}>
          <TabScreenHeader action={headerAction} />
        </View>
      ) : null}
      {children}
    </AppScreen>
  );
}
