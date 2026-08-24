import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TAB_BAR_CLEARANCE } from "@/constants/tabs";
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
}: AppScreenProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = withTabBar ? TAB_BAR_CLEARANCE + 16 : 32;

  const body = scroll ? (
    <ScrollView
      contentContainerClassName={contentClassName}
      contentContainerStyle={[{ paddingBottom: bottomPad }, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps={keyboardAvoiding ? "handled" : undefined}
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  ) : (
    <View
      className={`flex-1 ${contentClassName ?? ""}`}
      style={[{ paddingBottom: withTabBar ? TAB_BAR_CLEARANCE : 0 }, contentContainerStyle]}
    >
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
      className="flex-1 bg-brand-secondary"
      style={{ paddingTop: insets.top }}
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
