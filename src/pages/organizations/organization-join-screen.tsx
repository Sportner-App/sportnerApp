import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

import { AppScreen, Button, Input, ScreenHeader } from "@/components";
import { useToast } from "@/contexts";
import { getApiErrorMessage } from "@/lib/api/errors";
import { joinOrganization } from "@/services/organizations-service";

export function OrganizationJoinScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [inviteCode, setInviteCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    const code = inviteCode.trim().toUpperCase();
    if (code.length !== 8) {
      showToast({
        type: "error",
        title: "Kod geçersiz",
        description: "Davet kodu 8 karakter olmalı.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const joined = await joinOrganization(code);
      showToast({
        type: "success",
        title: "İstek gönderildi",
        description: "Kurucu veya yönetici onaylayınca üye olursun.",
      });
      if (joined?.id) {
        router.replace(`/organizations/${joined.id}`);
      } else {
        router.back();
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Katılınamadı",
        description: getApiErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppScreen
      header={<ScreenHeader title="KATIL" showBack />}
      contentClassName="gap-4 px-6 pt-3"
    >
      <Text className="font-display text-3xl text-text-primary">
        Davet kodu
      </Text>
      <Text className="font-body text-sm text-text-secondary">
        Organizasyon kurucusundan aldığın 8 karakterlik kodu yaz.
      </Text>
      <Input
        label="Kod"
        value={inviteCode}
        onChangeText={(value) => setInviteCode(value.toUpperCase())}
        placeholder="Örn. 4K7N2M9P"
        autoCapitalize="characters"
        maxLength={8}
      />
      <View className="pt-2">
        <Button
          label="Katıl"
          onPress={submit}
          isLoading={isSubmitting}
          disabled={isSubmitting}
        />
      </View>
    </AppScreen>
  );
}
