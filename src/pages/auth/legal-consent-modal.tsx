import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import { Button } from "@/components";

type LegalConsentModalProps = {
  visible: boolean;
  onAccept: () => void;
  onClose: () => void;
};

export function LegalConsentModal({
  visible,
  onAccept,
  onClose,
}: LegalConsentModalProps) {
  const { t } = useTranslation("auth");
  const [hasReachedEnd, setHasReachedEnd] = useState(false);

  useEffect(() => {
    if (visible) {
      setHasReachedEnd(false);
    }
  }, [visible]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;

    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 24) {
      setHasReachedEnd(true);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background-primary">
        <View className="flex-row items-center justify-between border-b border-border-default px-6 py-4">
          <View className="flex-1 pr-4">
            <Text className="font-display text-xl text-text-primary">
              {t("legalDocument.title")}
            </Text>
            <Text className="mt-1 font-body text-xs text-brand-neutral">
              {t("legalDocument.updatedAt")}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("common:close")}
            className="h-10 w-10 items-center justify-center rounded-full bg-surface-secondary"
            onPress={onClose}
          >
            <Text className="font-body text-xl text-text-primary">×</Text>
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="min-h-[760px] px-6 py-7"
          scrollEventThrottle={16}
          onScroll={handleScroll}
        >
          <Text className="font-display text-3xl leading-9 text-text-primary">
            {t("legalDocument.heading")}
          </Text>
          <Text className="mt-4 font-body text-sm leading-6 text-brand-neutral">
            {t("legalDocument.introduction")}
          </Text>

          {(["data", "usage", "sharing", "rights"] as const).map((section) => (
            <View key={section} className="mt-7">
              <Text className="font-display text-lg text-text-primary">
                {t(`legalDocument.sections.${section}.title`)}
              </Text>
              <Text className="mt-2 font-body text-sm leading-6 text-brand-neutral">
                {t(`legalDocument.sections.${section}.body`)}
              </Text>
            </View>
          ))}

          <Text className="mt-8 font-body text-xs leading-5 text-brand-neutral">
            {t("legalDocument.placeholderNote")}
          </Text>
        </ScrollView>

        <View className="border-t border-border-default px-6 pb-8 pt-4">
          {!hasReachedEnd ? (
            <Text className="mb-3 text-center font-body text-xs text-brand-neutral">
              {t("legalDocument.scrollHint")}
            </Text>
          ) : null}
          <Button
            label={t("legalDocument.accept")}
            size="lg"
            disabled={!hasReachedEnd}
            onPress={onAccept}
          />
        </View>
      </View>
    </Modal>
  );
}
