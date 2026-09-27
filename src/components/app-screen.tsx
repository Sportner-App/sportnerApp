import { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import {
  KeyboardAvoidingView,
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import { TAB_BAR_CLEARANCE } from "@/constants/tabs";
import { themeColors } from "@/constants/theme";
import type { AppScreenProps } from "@/types/components";
import { restoreTabBar, shrinkTabBar } from "@/utils/tab-bar-scroll";

/** app/_layout'taki KeyboardToolbar klavyenin üstünde bu kadar yer kaplar. */
const KEYBOARD_TOOLBAR_OFFSET = Platform.OS === "ios" ? 53 : 42;

export function AppScreen({
  children,
  header,
  background,
  belowHeader,
  footer,
  withTabBar = false,
  scroll = true,
  keyboardAvoiding = true,
  keyboardAwareScroll = true,
  keyboardVerticalOffset = 0,
  refreshControl,
  contentClassName,
  contentContainerStyle,
  bodyStyle,
  edgeToEdgeTop = false,
  headerOverlay = false,
  backdrop = "default",
  tone = "dark",
  onEndReached,
  onEndReachedThreshold = 240,
  scrollRef,
  onContentSizeChange,
}: AppScreenProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = withTabBar ? TAB_BAR_CLEARANCE + 16 : 32;
  const [footerHeight, setFooterHeight] = useState(0);

  const handleFooterLayout = (event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.height);
    setFooterHeight((current) => (current === next ? current : next));
  };

  // Scroll sırasında tab bar'ı küçült; yalnızca bar'ın görünür olduğu ekranlarda.
  const tabBarScrollProps = withTabBar
    ? {
        onScrollBeginDrag: shrinkTabBar,
        onMomentumScrollBegin: shrinkTabBar,
        // Parmak kalkınca momentum gelebilir; kısa gecikme onu beklemek için.
        onScrollEndDrag: () => restoreTabBar(150),
        onMomentumScrollEnd: () => restoreTabBar(),
      }
    : null;

  useEffect(() => {
    if (!withTabBar) {
      return;
    }
    // Scroll ederken ekrandan çıkılırsa bar küçük kalmasın.
    return () => restoreTabBar();
  }, [withTabBar]);

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
  const useKeyboardAwareScroll = keyboardAvoiding && keyboardAwareScroll;
  const ScrollContainer = useKeyboardAwareScroll
    ? KeyboardAwareScrollView
    : ScrollView;

  const body = scroll ? (
    <ScrollContainer
      ref={scrollRef}
      {...(useKeyboardAwareScroll
        ? { bottomOffset: footerHeight + KEYBOARD_TOOLBAR_OFFSET + 12 }
        : {})}
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
      {...tabBarScrollProps}
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

  // Overlay modunda header satır kaplamaz; body önce çizilir ki header üstte kalsın.
  const mainContent = headerOverlay ? (
    <>
      {body}
      <View pointerEvents="box-none" className="absolute inset-x-0 top-0">
        {header}
        {belowHeader}
      </View>
    </>
  ) : (
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
      {background ? (
        // Absolute konum padding box'a göre çözülür; üst inset'i geri alıp zemini
        // gerçekten ekranın tepesinden başlatıyoruz.
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            edgeToEdgeTop ? null : { top: -insets.top },
          ]}
        >
          {background}
        </View>
      ) : null}
      {!keyboardAvoiding ? (
        <>
          {mainContent}
          {footer}
        </>
      ) : useKeyboardAwareScroll ? (
        // KeyboardAwareScrollView klavyeyi kendi telafi ediyor; ayrıca KeyboardAvoidingView ile sarmak telafiyi ikiye katlar.
        <>
          <View className="flex-1">{mainContent}</View>
          {footer ? (
            <KeyboardStickyView offset={{ opened: -KEYBOARD_TOOLBAR_OFFSET }}>
              <View onLayout={handleFooterLayout}>{footer}</View>
            </KeyboardStickyView>
          ) : null}
        </>
      ) : (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={keyboardVerticalOffset}
        >
          <View className="flex-1">{mainContent}</View>
          {footer}
        </KeyboardAvoidingView>
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
