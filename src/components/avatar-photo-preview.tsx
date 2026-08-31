import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { radius, themeColors } from "@/constants/theme";

type AvatarPhotoPreviewProps = {
  visible: boolean;
  uri: string;
  name?: string | null;
  onClose: () => void;
};

const PREVIEW_SIZE = Math.min(Dimensions.get("window").width - 48, 360);

export function AvatarPhotoPreview({
  visible,
  uri,
  name,
  onClose,
}: AvatarPhotoPreviewProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View
        className="flex-1"
        style={{ backgroundColor: themeColors.overlay.dark }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fotoğraf önizlemesini kapat"
          className="absolute inset-0"
          onPress={onClose}
        />

        <View
          className="flex-1 items-center justify-center px-6"
          style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kapat"
            hitSlop={12}
            onPress={onClose}
            className="absolute right-4 z-10 h-10 w-10 items-center justify-center rounded-full"
            style={{
              top: insets.top + 8,
              backgroundColor: themeColors.surface.primary,
              opacity: 0.92,
            }}
          >
            <FontAwesome6
              name="xmark"
              size={16}
              color={themeColors.text.primary}
            />
          </Pressable>

          {name?.trim() ? (
            <Text
              className="mb-4 font-body-bold text-base"
              style={{ color: themeColors.text.inverse }}
              numberOfLines={1}
            >
              {name.trim()}
            </Text>
          ) : null}

          <View
            className="overflow-hidden"
            style={{
              width: PREVIEW_SIZE,
              height: PREVIEW_SIZE,
              borderRadius: radius.xl,
            }}
          >
            <Image
              source={{ uri }}
              resizeMode="cover"
              style={{ width: "100%", height: "100%" }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
