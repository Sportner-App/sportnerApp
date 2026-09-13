import { StatusBar } from "expo-status-bar";
import type { PropsWithChildren } from "react";

import { AppScreen } from "./app-screen";
import { LinearRefreshBar } from "./linear-refresh-bar";
import { brandRefreshControl } from "./refresh-control";
import { TabScreenHeader } from "./tab-screen-header";

type TabPageProps = PropsWithChildren<{
  refreshing: boolean;
  onRefresh: () => void;
  keyboardAvoiding?: boolean;
  onEndReached?: () => void;
  /** false renders a plain flex-1 View instead of a ScrollView (e.g. a full-screen map). */
  scroll?: boolean;
}>;

/** Ana tab sayfalarının ortak safe-area, header, spacing ve refresh kabuğu. */
export function TabPage({
  children,
  refreshing,
  onRefresh,
  keyboardAvoiding = false,
  onEndReached,
  scroll = true,
}: TabPageProps) {
  return (
    <AppScreen
      withTabBar
      scroll={scroll}
      keyboardAvoiding={keyboardAvoiding}
      belowHeader={<LinearRefreshBar visible={refreshing} />}
      contentClassName={scroll ? "gap-6 px-5 pt-2" : "gap-3 px-5 pt-2"}
      refreshControl={scroll ? brandRefreshControl({ refreshing, onRefresh }) : undefined}
      onEndReached={scroll ? onEndReached : undefined}
    >
      <StatusBar style="auto" />
      <TabScreenHeader />
      {children}
    </AppScreen>
  );
}
