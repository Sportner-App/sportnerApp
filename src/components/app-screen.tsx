import { useState } from "react";
import {
  Platform,
  ScrollView,
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

/** app/_layout'taki KeyboardToolbar klavyenin üstünde bu kadar yer kaplar. */
const KEYBOARD_TOOLBAR_OFFSET = Platform.OS === "ios" ? 53 : 42;

export function AppScreen({
  children,
  header,
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
            <KeyboardStickyView
              offset={{ opened: -KEYBOARD_TOOLBAR_OFFSET }}
            >
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
