import { useState } from "react";
import { Text, View } from "react-native";

import { AppScreen, Button, Input, ScreenHeader } from "@/components";
import { useToast } from "@/contexts";
import { getApiErrorMessage, isApiError } from "@/lib/api/errors";
import { submitAppFeedback } from "@/services/feedback-service";
import { successNotification } from "@/utils/haptics";

const MIN_LENGTH = 10;
const MAX_LENGTH = 2000;

export function FeedbackScreen() {
  const { showToast } = useToast();
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);

  const trimmed = content.trim();
  const canSubmit = trimmed.length >= MIN_LENGTH && trimmed.length <= MAX_LENGTH;

  const handleSubmit = async () => {
    if (!canSubmit || saving) {
      return;
    }

    setSaving(true);
    try {
      await submitAppFeedback(trimmed);
      successNotification();
      setSent(true);
      setContent("");
      showToast({
        type: "success",
        title: "Öneriniz alındı",
        description: "Teşekkürler, mesajına bakacağız.",
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Gönderilemedi",
        description: isApiError(error) && error.status === 429
          ? "Çok sık gönderdin. Birkaç dakika sonra tekrar dene."
          : getApiErrorMessage(error, "Öneri gönderilemedi."),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen
      keyboardAvoiding
      header={<ScreenHeader title="ÖNERİ" showBack />}
      contentClassName="gap-4 px-6 pt-3"
    >
      <View className="gap-2">
        <Text className="font-display text-3xl text-white">
          Bir önerin mi var?
        </Text>
        <Text className="font-body text-sm leading-5 text-brand-neutral">
          Beğendiğin, takıldığın veya eklenmesini istediğin bir şey varsa yaz.
          Mail atmana gerek yok, buradan bize ulaşır.
        </Text>
      </View>

      {sent ? (
        <View className="items-center gap-3 rounded-[28px] border border-brand-primary/30 bg-brand-primary/10 px-6 py-10">
          <Text className="font-body-bold text-base text-text-primary">
            Öneriniz alındı
          </Text>
          <Text className="text-center font-body text-sm leading-5 text-text-tertiary">
            Mesajın kaydedildi. Yeni bir şey daha aklına gelirse tekrar
            yazabilirsin.
          </Text>
          <Button
            label="Yeni öneri yaz"
            variant="outline"
            size="sm"
            onPress={() => setSent(false)}
          />
        </View>
      ) : (
        <>
          <Input
            label="Önerin"
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={MAX_LENGTH}
            style={{ minHeight: 140, paddingTop: 12, paddingBottom: 12 }}
            placeholder="Uygulamada şunu ekleseniz / şurada takıldım…"
            helperText={`${trimmed.length}/${MAX_LENGTH} · en az ${MIN_LENGTH} karakter`}
            error={
              trimmed.length > 0 && trimmed.length < MIN_LENGTH
                ? `En az ${MIN_LENGTH} karakter yaz.`
                : undefined
            }
          />
          <Button
            label="Gönder"
            disabled={!canSubmit}
            isLoading={saving}
            onPress={() => void handleSubmit()}
          />
        </>
      )}
    </AppScreen>
  );
}
