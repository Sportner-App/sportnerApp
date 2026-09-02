import { StatusBar } from "expo-status-bar";
import type { PropsWithChildren } from "react";

import { AppScreen } from "./app-screen";
import { LinearRefreshBar } from "./linear-refresh-bar";
import { BrandRefreshControl } from "./refresh-control";
import { TabScreenHeader } from "./tab-screen-header";

type TabPageProps = PropsWithChildren<{
  refreshing: boolean;
  onRefresh: () => void;
  keyboardAvoiding?: boolean;
  onEndReached?: () => void;
}>;

/** Ana tab sayfalarının ortak safe-area, header, spacing ve refresh kabuğu. */
export function TabPage({
  children,
  refreshing,
  onRefresh,
  keyboardAvoiding = false,
  onEndReached,
}: TabPageProps) {
  return (
    <AppScreen
      withTabBar
      keyboardAvoiding={keyboardAvoiding}
      belowHeader={<LinearRefreshBar visible={refreshing} />}
      contentClassName="gap-6 px-5 pt-2"
      refreshControl={
        <BrandRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      onEndReached={onEndReached}
    >
      <StatusBar style="auto" />
      <TabScreenHeader />
      {children}
    </AppScreen>
  );
}
