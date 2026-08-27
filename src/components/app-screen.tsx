import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  keyboardAvoiding = false,
  refreshControl,
  contentClassName,
  contentContainerStyle,
  edgeToEdgeTop = false,
  backdrop = "default",
  tone = "dark",
}: AppScreenProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = withTabBar ? TAB_BAR_CLEARANCE + 16 : 32;

  const body = scroll ? (
    <ScrollView
      contentContainerClassName={contentClassName}
      contentContainerStyle={[
        { paddingBottom: bottomPad },
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps={keyboardAvoiding ? "handled" : undefined}
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
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

  const content = (
    <>
      {header}
      {belowHeader}
      {body}
      {footer}
    </>
  );

  return (
    <View
      className="flex-1 bg-background-primary"
      style={{ paddingTop: edgeToEdgeTop ? 0 : insets.top }}
    >
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
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
