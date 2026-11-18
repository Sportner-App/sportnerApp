import { FlashList, type ListRenderItem } from "@shopify/flash-list";
import { StatusBar } from "expo-status-bar";
import { useEffect, type ReactElement, type ReactNode } from "react";
import { View } from "react-native";

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
  headerAction,
  screenHeader,
  children,
}: TabListPageProps<T>) {
  const withTabBar = !screenHeader;
  // Kaydırırken ekrandan çıkılırsa tab bar küçük kalmasın.
  useEffect(() => () => restoreTabBar(), []);

  return (
    <AppScreen
      withTabBar={withTabBar}
      header={screenHeader}
      scroll={false}
      keyboardAvoiding={false}
      belowHeader={<LinearRefreshBar visible={refreshing} />}
      contentContainerStyle={{ paddingBottom: 0 }}
    >
      <StatusBar style="auto" />
      <FlashList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        ListHeaderComponent={
          <View
            style={{
              paddingHorizontal: SIDE_PADDING,
              paddingTop: withTabBar ? 8 : 12,
              paddingBottom: data.length > 0 ? (listTopGap ?? itemGap) : 0,
              gap: 24,
            }}
          >
            {withTabBar ? <TabScreenHeader action={headerAction} /> : null}
            {header}
          </View>
        }
        ListEmptyComponent={
          empty ? (
            <View style={{ paddingHorizontal: SIDE_PADDING, paddingTop: 24 }}>
              {empty}
            </View>
          ) : null
        }
        ListFooterComponent={
          footer ? (
            <View style={{ paddingHorizontal: SIDE_PADDING }}>{footer}</View>
          ) : null
        }
        ItemSeparatorComponent={
          numColumns && numColumns > 1
            ? undefined
            : () => <View style={{ height: itemGap }} />
        }
        contentContainerStyle={{
          paddingBottom: withTabBar ? TAB_BAR_CLEARANCE + 16 : 32,
        }}
        refreshControl={
          onRefresh ? brandRefreshControl({ refreshing, onRefresh }) : undefined
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.6}
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
