import { useEffect } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import {
  KeyboardAvoidingView,
  KeyboardAwareScrollView,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TAB_BAR_CLEARANCE } from "@/constants/tabs";
import {
  KEYBOARD_TOOLBAR_OFFSET,
  useKeyboardToolbarVisible,
} from "@/hooks/use-keyboard-toolbar-visible";
import type { AppScreenProps } from "@/types/components";
import { restoreTabBar, shrinkTabBar } from "@/utils/tab-bar-scroll";

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
  tone = "dark",
  onEndReached,
  onEndReachedThreshold = 240,
  scrollRef,
  onContentSizeChange,
}: AppScreenProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = withTabBar ? TAB_BAR_CLEARANCE + 16 : 32;
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
  const toolbarOffset = useKeyboardToolbarVisible()
    ? KEYBOARD_TOOLBAR_OFFSET
    : 0;
  const useKeyboardAwareScroll = keyboardAvoiding && keyboardAwareScroll;
  const ScrollContainer = useKeyboardAwareScroll
    ? KeyboardAwareScrollView
    : ScrollView;

  const body = scroll ? (
    <ScrollContainer
      ref={scrollRef}
      {...(useKeyboardAwareScroll ? { bottomOffset: toolbarOffset + 16 } : {})}
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
          {/* Alt aksiyonlar klavyenin üstüne binmez: klavye açıkken arkasında
              kalır, kullanıcı klavyeyi kapatınca görünür. Klavye üstünde
              yüzen butonlar yazılan alanı da kapatıyordu. */}
          {footer}
        </>
      ) : (
        <KeyboardAvoidingView
          className="flex-1"
          // keyboard-controller'ın sürümü Android'de de çalışıyor; behavior
          // verilmezse Android'de klavye alt çubuğu (ör. sohbet) kapatıyordu.
          behavior="padding"
          keyboardVerticalOffset={keyboardVerticalOffset}
        >
          <View className="flex-1">{mainContent}</View>
          {footer}
        </KeyboardAvoidingView>
      )}
    </View>
  );
}
