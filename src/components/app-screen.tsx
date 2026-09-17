import {
  Platform,
  ScrollView,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import { TAB_BAR_CLEARANCE } from "@/constants/tabs";
import { themeColors } from "@/constants/theme";
import type { AppScreenProps } from "@/types/components";

/**
 * Uygulama ekranları için ortak kabuk:
 * safe-area top, sabit header, opsiyonel refresh bar / footer,
 * tab bar clearance ve scroll.
 */
export function AppScreen({
  children,
  header,
  belowHeader,
  footer,
  withTabBar = false,
  scroll = true,
  // Mesaj ekranındaki davranışı bütün ekranlara taşır: odaklanan alan
  // klavyenin altında kalmaz; ekranın geri kalanı kaydırılarak klavye kapanır.
  keyboardAvoiding = true,
  refreshControl,
  contentClassName,
  contentContainerStyle,
  bodyStyle,
  edgeToEdgeTop = false,
  backdrop = "default",
  tone = "dark",
  onEndReached,
  onEndReachedThreshold = 240,
  scrollRef,
  onContentSizeChange,
}: AppScreenProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = withTabBar ? TAB_BAR_CLEARANCE + 16 : 32;

  const handleScroll = onEndReached
    ? (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { layoutMeasurement, contentOffset, contentSize } =
          event.nativeEvent;
        if (
          layoutMeasurement.height + contentOffset.y >=
          contentSize.height - onEndReachedThreshold
        ) {
          onEndReached();
        }
      }
    : undefined;
  const ScrollContainer = keyboardAvoiding
    ? KeyboardAwareScrollView
    : ScrollView;

  const body = scroll ? (
    <ScrollContainer
      ref={scrollRef}
      style={bodyStyle}
      onContentSizeChange={onContentSizeChange}
      contentContainerClassName={contentClassName}
      contentContainerStyle={[
        { paddingBottom: bottomPad },
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps={keyboardAvoiding ? "handled" : undefined}
      keyboardDismissMode={
        keyboardAvoiding
          ? Platform.OS === "ios"
            ? "interactive"
            : "on-drag"
          : undefined
      }
      refreshControl={refreshControl}
      onScroll={handleScroll}
      scrollEventThrottle={handleScroll ? 100 : undefined}
    >
      {children}
    </ScrollContainer>
  ) : (
    <View
      className={`flex-1 ${contentClassName ?? ""}`}
      style={[
        { paddingBottom: withTabBar ? TAB_BAR_CLEARANCE : 0 },
        contentContainerStyle,
      ]}
    >
      {tone === "light" && backdrop === "olive" ? <OliveBackdrop /> : null}
      {children}
    </View>
  );

  const mainContent = (
    <>
      {header}
      {belowHeader}
      {body}
    </>
  );

  return (
    <View
      className="flex-1 bg-background-primary"
      style={{ paddingTop: edgeToEdgeTop ? 0 : insets.top }}
    >
      {keyboardAvoiding ? (
        <>
          <View className="flex-1">{mainContent}</View>
          {footer ? (
            <KeyboardStickyView>{footer}</KeyboardStickyView>
          ) : null}
        </>
      ) : (
        <>
          {mainContent}
          {footer}
        </>
      )}
    </View>
  );
}

function OliveBackdrop() {
  return (
    <View pointerEvents="none" className="absolute inset-0">
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="app-olive" x1="0" y1="0" x2="0.85" y2="1">
            <Stop offset="0" stopColor={themeColors.background.oliveTop} />
            <Stop
              offset="0.56"
              stopColor={themeColors.background.oliveMiddle}
            />
            <Stop offset="1" stopColor={themeColors.background.oliveBottom} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#app-olive)" />
      </Svg>
    </View>
  );
}
