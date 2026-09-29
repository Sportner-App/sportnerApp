import { useTranslation } from "react-i18next";
import { Modal, Text as NativeText, ScrollView, View } from "react-native";

import { Button } from "@/components";
import { AppText as Text } from "@/components/app-text";
import {
  LEGAL_DOCUMENTS,
  type LegalBlock,
  type LegalDocument,
} from "@/constants/legal-documents";

type LegalConsentModalProps = {
  visible: boolean;
  onAccept: () => void;
  onClose: () => void;
};

/** **Çift yıldız** arasındaki parçaları kalın gösterir, gerisini olduğu gibi bırakır. */
function RichText({ text, className }: { text: string; className: string }) {
  const parts = text.split("**");

  return (
    <Text className={className}>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <NativeText key={index} className="font-body-bold text-text-primary">
            {part}
          </NativeText>
        ) : (
          part
        ),
      )}
    </Text>
  );
}

function Block({ block }: { block: LegalBlock }) {
  switch (block.kind) {
    case "paragraph":
      return (
        <RichText
          text={block.text}
          className="mt-3 font-body text-body-sm leading-6 text-brand-neutral"
        />
      );

    case "subheading":
      return (
        <Text className="mt-5 font-body-bold text-label text-text-primary">
          {block.text}
        </Text>
      );

    case "bullets":
      return (
        <View className="mt-3 gap-2">
          {block.items.map((item, index) => (
            <View key={index} className="flex-row gap-2 pr-2">
              <Text className="font-body text-body-sm leading-6 text-brand-primary">
                •
              </Text>
              <RichText
                text={item}
                className="flex-1 font-body text-body-sm leading-6 text-brand-neutral"
              />
            </View>
          ))}
        </View>
      );

    case "definitions":
      return (
        <View className="mt-3 gap-3">
          {block.items.map((item, index) => (
            <View
              key={index}
              className="rounded-2xl border border-border-default bg-surface-secondary px-4 py-3"
            >
              <RichText
                text={item.term}
                className="font-body-bold text-body-sm leading-5 text-text-primary"
              />
              <RichText
                text={item.description}
                className="mt-1 font-body text-body-sm leading-5 text-brand-neutral"
              />
            </View>
          ))}
        </View>
      );

    case "table":
      return (
        <View className="mt-3 gap-3">
          {block.rows.map((row, rowIndex) => (
            <View
              key={rowIndex}
              className="rounded-2xl border border-border-default bg-surface-secondary px-4 py-3"
            >
              <Text className="font-body-bold text-body-sm leading-5 text-text-primary">
                {row[0]}
              </Text>
              {row.slice(1).map((cell, cellIndex) => (
                <View key={cellIndex} className="mt-1.5">
                  <Text className="font-body text-caption uppercase tracking-wide text-brand-neutral/70">
                    {block.columns[cellIndex + 1]}
                  </Text>
                  <Text className="font-body text-body-sm leading-5 text-brand-neutral">
                    {cell}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      );
  }
}

function Document({ document }: { document: LegalDocument }) {
  return (
    <View>
      <Text className="font-display text-heading-lg leading-9 text-text-primary">
        {document.title}
      </Text>
      <Text className="mt-1 font-body text-caption text-brand-neutral">
        {document.updatedLabel}
      </Text>

      {document.sections.map((section) => (
        <View key={section.title} className="mt-7">
          <Text className="font-display text-heading-sm text-text-primary">
            {section.title}
          </Text>
          {section.blocks.map((block, index) => (
            <Block key={index} block={block} />
          ))}
        </View>
      ))}
    </View>
  );
}

export function LegalConsentModal({
  visible,
  onAccept,
  onClose,
}: LegalConsentModalProps) {
  const { t } = useTranslation("auth");

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background-primary">
        <View className="flex-row items-center justify-between border-b border-border-default px-6 py-4">
          <View className="flex-1 pr-4 items-center">
            <Text className="font-display text-heading-sm text-text-primary">
              {t("legalDocument.title")}
            </Text>
            <Text className="mt-1 font-body text-caption text-brand-neutral">
              {t("legalDocument.subtitle")}
            </Text>
          </View>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="px-6 py-7">
          {LEGAL_DOCUMENTS.map((document, index) => (
            <View
              key={document.title}
              className={
                index === 0 ? "" : "mt-10 border-t border-border-default pt-10"
              }
            >
              <Document document={document} />
            </View>
          ))}
        </ScrollView>

        <View className="border-t border-border-default px-6 pb-8 pt-4">
          <Button
            label={t("legalDocument.accept")}
            size="lg"
            onPress={onAccept}
          />
        </View>
      </View>
    </Modal>
  );
}
