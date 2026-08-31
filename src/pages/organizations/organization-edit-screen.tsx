import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";

import { AppScreen, Button, Input, ScreenHeader, SelectField, SportLoader } from "@/components";
import { useToast } from "@/contexts";
import { useCities } from "@/hooks/use-cities";
import { getApiErrorMessage } from "@/lib/api/errors";
import { getOrganization, updateOrganization } from "@/services/organizations-service";
import type { SelectOption } from "@/types/components";

export function OrganizationEditScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cities, isLoading: citiesLoading } = useCities();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cityId, setCityId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cityOptions = useMemo<SelectOption<string>[]>(
    () =>
      cities.map((city) => ({
        key: city.id,
        label: city.name,
        description: `${String(city.plateCode).padStart(2, "0")} plaka kodu`,
      })),
    [cities],
  );

  useEffect(() => {
    if (!id) return;
    void getOrganization(id)
      .then((detail) => {
        setName(detail.name);
        setDescription(detail.description ?? "");
        setCityId(detail.cityId ?? "");
      })
      .catch((error) => {
        showToast({
          type: "error",
          title: "Yüklenemedi",
          description: getApiErrorMessage(error),
        });
      })
      .finally(() => setIsLoading(false));
  }, [id, showToast]);

  const submit = async () => {
    if (!id) return;
    const trimmed = name.trim();
    if (!trimmed) {
      showToast({ type: "error", title: "İsim gerekli" });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateOrganization(id, {
        name: trimmed,
        description: description.trim() || null,
        cityId: cityId || null,
      });
      showToast({ type: "success", title: "Organizasyon güncellendi" });
      router.back();
    } catch (error) {
      showToast({
        type: "error",
        title: "Kaydedilemedi",
        description: getApiErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppScreen
      header={<ScreenHeader title="DÜZENLE" showBack />}
      contentClassName="gap-4 px-6 pt-3"
    >
      {isLoading ? (
        <View className="items-center py-16">
          <SportLoader size={120} label="Yükleniyor" />
        </View>
      ) : (
        <>
          <Text className="font-display text-3xl text-text-primary">
            Organizasyonu düzenle
          </Text>
          <Input label="Ad" value={name} onChangeText={setName} maxLength={80} />
          <Input
            label="Açıklama"
            value={description}
            onChangeText={setDescription}
            maxLength={1000}
            multiline
          />
          <SelectField
            label="Şehir"
            placeholder={citiesLoading ? "Yükleniyor" : "Seç (isteğe bağlı)"}
            options={cityOptions}
            value={cityId}
            onChange={setCityId}
            sheetTitle="Şehir"
            searchable
            searchPlaceholder="Şehir ara"
          />
          <Button
            label="Kaydet"
            onPress={submit}
            isLoading={isSubmitting}
            disabled={isSubmitting}
          />
        </>
      )}
    </AppScreen>
  );
}
