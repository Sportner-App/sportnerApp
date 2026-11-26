import { FlashList, type ListRenderItem } from "@shopify/flash-list";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, type ReactElement, type ReactNode } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppScreen } from "@/components/app-screen";
import { LinearRefreshBar } from "@/components/linear-refresh-bar";
import { brandRefreshControl } from "@/components/refresh-control";
import { TAB_BAR_CLEARANCE } from "@/constants/tabs";
import { restoreTabBar, shrinkTabBar } from "@/utils/tab-bar-scroll";
import { TabScreenHeader, type TabHeaderAction } from "./tab-screen-header";

type TabListPageProps<T> = {
  data: readonly T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  refreshing?: boolean;
  /** Verilmezse aşağı çekip yenileme kapalı. */
  onRefresh?: () => void;
  onEndReached?: () => void;
  /** Listenin üstündeki içerik (başlık, filtreler, sekmeler). Liste ile birlikte kayar. */
  header?: ReactNode;
  /** Liste boşken ya da yüklenirken gösterilen içerik. */
  empty?: ReactElement | null;
  footer?: ReactElement | null;
  /** Kartlar arası dikey boşluk. */
  itemGap?: number;
  /** Üst içerik ile ilk öğe arası boşluk; varsayılan `itemGap`. */
  listTopGap?: number;
  numColumns?: number;
  /** Farklı görünümdeki öğeler için FlashList'in geri dönüşüm türü. */
  getItemType?: (item: T, index: number) => string | undefined;
  /**
   * Medya ağırlıklı sekmeler (`TabPage`'deki anlamıyla): yatay padding yok
   * (öğeler kendi padding'ini verir), içerik status bar'ın altından akar.
   */
  edgeToEdge?: boolean;
  headerAction?: TabHeaderAction;
  /**
   * Sekme dışı ekranlar için sabit üst başlık (ör. geri düğmeli ScreenHeader).
   * Verilirse sekme başlığı ve tab bar boşluğu kullanılmaz.
   */
  screenHeader?: ReactNode;
  /** Liste dışında kalan katmanlar (ör. bottom sheet'ler). */
  children?: ReactNode;
};

const SIDE_PADDING = 20;
// FlashList'te eşik, görünür yüksekliğin katıdır: listenin 2 ekran boyu
// önceden istenir, böylece kullanıcı dibe varmadan sonraki sayfa gelmiş olur.
const END_REACHED_THRESHOLD = 2;

/**
 * Uzun listeler için `TabPage`'in sanallaştırılmış karşılığı.
 *
 * `TabPage` içeriği bir ScrollView'da `.map()` ile çiziyordu: yüklenen her
 * kart, ekranda olmasa da hafızada canlı kalıyordu; yüzlerce kartta
 * kaydırma ve sekme geçişleri ağırlaşıyordu. Burada yalnızca ekrandaki
 * kartlar ve biraz ötesi çiziliyor; ekrandan çıkan kartın görünümü yeni
 * gelen için yeniden kullanılıyor. Kart sayısı ne olursa olsun maliyet aynı.
 *
 * Sekme başlığı ve sayfa üstü içerik listenin başlığına taşınıyor ki
 * `TabPage`'deki gibi listeyle birlikte kaysın.
 */
export function TabListPage<T>({
  data,
  renderItem,
  keyExtractor,
  refreshing = false,
  onRefresh,
  onEndReached,
  header,
  empty = null,
  footer = null,
  itemGap = 16,
  listTopGap,
  numColumns,
  getItemType,
  edgeToEdge = false,
  headerAction,
  screenHeader,
  children,
}: TabListPageProps<T>) {
  const withTabBar = !screenHeader;
  const insets = useSafeAreaInsets();
  const sidePadding = edgeToEdge ? 0 : SIDE_PADDING;
  // Kaydırırken ekrandan çıkılırsa tab bar küçük kalmasın.
  useEffect(() => () => restoreTabBar(), []);

  // FlashList `onEndReached`'i liste sonunda yalnızca veri değişince yeniden
  // tetikler. Çağrı o an yok sayıldıysa (başka istek sürüyordu) ya da istek
  // düştüyse kısa liste takılı kalırdı. İşleyici değişince (yükleme bitince)
  // dizinin kimliği de değişir, liste sonu yeniden denetlenir.
  const listData = useMemo(
    () => [...data],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, onEndReached],
  );

  return (
    <AppScreen
      withTabBar={withTabBar}
      header={screenHeader}
      scroll={false}
      edgeToEdgeTop={edgeToEdge}
      keyboardAvoiding={false}
      belowHeader={<LinearRefreshBar visible={refreshing} />}
      contentContainerStyle={{ paddingBottom: 0 }}
    >
      <StatusBar style="auto" />
      <FlashList
        data={listData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        getItemType={getItemType}
        ListHeaderComponent={
          <View
            style={{
              paddingHorizontal: sidePadding,
              paddingTop: edgeToEdge ? 0 : withTabBar ? 8 : 12,
              paddingBottom: data.length > 0 ? (listTopGap ?? itemGap) : 0,
              gap: 24,
            }}
          >
            {withTabBar ? (
              edgeToEdge ? (
                <View style={{ paddingHorizontal: SIDE_PADDING }}>
                  <TabScreenHeader action={headerAction} />
                </View>
              ) : (
                <TabScreenHeader action={headerAction} />
              )
            ) : null}
            {header}
          </View>
        }
        ListEmptyComponent={
          empty ? (
            <View style={{ paddingHorizontal: sidePadding, paddingTop: 24 }}>
              {empty}
            </View>
          ) : null
        }
        ListFooterComponent={
          footer ? (
            <View style={{ paddingHorizontal: sidePadding }}>{footer}</View>
          ) : null
        }
        ItemSeparatorComponent={
          numColumns && numColumns > 1
            ? undefined
            : () => <View style={{ height: itemGap }} />
        }
        contentContainerStyle={{
          // Konteyner padding'i yerine içerik inset'i: ekran en üstteyken hiçbir
          // şey gizlenmez, kaydırınca içerik status bar'ın altından akar.
          ...(edgeToEdge ? { paddingTop: insets.top + 8 } : null),
          paddingBottom: withTabBar ? TAB_BAR_CLEARANCE + 16 : 32,
        }}
        refreshControl={
          onRefresh ? brandRefreshControl({ refreshing, onRefresh }) : undefined
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={END_REACHED_THRESHOLD}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        {...(withTabBar
          ? {
              onScrollBeginDrag: shrinkTabBar,
              onMomentumScrollBegin: shrinkTabBar,
              onScrollEndDrag: () => restoreTabBar(150),
              onMomentumScrollEnd: () => restoreTabBar(),
            }
          : null)}
      />
      {children}
    </AppScreen>
  );
}

/** Liste öğesini sayfanın yatay boşluğuyla sarar. */
export function TabListItem({ children }: { children: ReactNode }) {
  return <View style={{ paddingHorizontal: SIDE_PADDING }}>{children}</View>;
}
