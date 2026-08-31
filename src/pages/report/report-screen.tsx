import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import {
  AppScreen,
  Button,
  Input,
  ScreenHeader,
  SportLoader,
} from "@/components";
import { useToast } from "@/contexts";
import { getApiErrorMessage } from "@/lib/api/errors";
import { createReport, listReportReasons } from "@/services/reports-service";
import type { ApiReportReason } from "@/types/social";

export function ReportScreen() {
  const { entityType, entityId } = useLocalSearchParams<{
    entityType: string;
    entityId: string;
  }>();
  const router = useRouter();
  const { showToast } = useToast();
  const [reasons, setReasons] = useState<ApiReportReason[]>([]);
  const [reasonId, setReasonId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void listReportReasons()
      .then(setReasons)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <AppScreen
      keyboardAvoiding
      header={<ScreenHeader title="ŞİKAYET" showBack />}
      contentClassName="gap-4 px-6 pt-3"
    >
      {isLoading ? (
        <View className="items-center py-16">
          <SportLoader size={120} label="Yükleniyor" />
        </View>
      ) : (
        <>
          <Text className="font-display text-2xl text-text-primary">
            Neden bildiriyorsun?
          </Text>
          {reasons.map((reason) => (
            <Pressable
              key={reason.id}
              onPress={() => setReasonId(reason.id)}
              className={`rounded-2xl border px-4 py-3 ${
                reasonId === reason.id
                  ? "border-brand-primary bg-brand-primary/10"
                  : "border-border-default"
              }`}
            >
              <Text className="font-body text-sm text-text-primary">
                {reason.name}
              </Text>
            </Pressable>
          ))}
          <Input
            label="Açıklama (opsiyonel)"
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <Button
            label="Gönder"
            disabled={!reasonId || !entityId}
            isLoading={saving}
            onPress={async () => {
              if (!reasonId || !entityId) return;
              setSaving(true);
              try {
                await createReport({
                  entityType: Number(entityType ?? 0),
                  entityId,
                  reportReasonId: reasonId,
                  description: description.trim() || undefined,
                });
                showToast({ type: "success", title: "Şikayet alındı" });
                router.back();
              } catch (error) {
                showToast({
                  type: "error",
                  title: "Gönderilemedi",
                  description: getApiErrorMessage(error),
                });
              } finally {
                setSaving(false);
              }
            }}
          />
        </>
      )}
    </AppScreen>
  );
}
