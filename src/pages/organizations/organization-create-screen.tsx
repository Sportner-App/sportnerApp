import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";

import { AppScreen, Button, Input, ScreenHeader, SelectField } from "@/components";
import { useToast } from "@/contexts";
import { useCities } from "@/hooks/use-cities";
import { getApiErrorMessage } from "@/lib/api/errors";
import { createOrganization } from "@/services/organizations-service";
import type { SelectOption } from "@/types/components";

export function OrganizationCreateScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { cities, isLoading: citiesLoading } = useCities();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cityId, setCityId] = useState<string | undefined>();
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

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      showToast({
        type: "error",
        title: "İsim gerekli",
        description: "Organizasyon için bir ad yaz.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createOrganization({
        name: trimmed,
        description: description.trim() || null,
        cityId: cityId || null,
      });
      showToast({
        type: "success",
        title: "Organizasyon kuruldu",
        description: "Davet kodunu üyelerle paylaşabilirsin.",
      });
      if (created?.id) {
        router.replace(`/organizations/${created.id}`);
      } else {
        router.back();
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Oluşturulamadı",
        description: getApiErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppScreen
      header={<ScreenHeader title="ORGANİZASYON" showBack />}
      contentClassName="gap-4 px-6 pt-3"
    >
      <Text className="font-display text-3xl text-text-primary">
        Yeni organizasyon
      </Text>
      <Text className="font-body text-sm text-text-secondary">
        Üniversite takımı, salon veya kulüp. Katılım yalnızca davet koduyla.
      </Text>

      <Input
        label="Ad"
        value={name}
        onChangeText={setName}
        placeholder="Örn. İTÜ Tenis"
        maxLength={80}
      />
      <Input
        label="Açıklama"
        value={description}
        onChangeText={setDescription}
        placeholder="İsteğe bağlı"
        maxLength={1000}
        multiline
      />
      <SelectField
        label="Şehir"
        placeholder={citiesLoading ? "Yükleniyor" : "Seç (isteğe bağlı)"}
        options={cityOptions}
        value={cityId ?? ""}
        onChange={setCityId}
        sheetTitle="Şehir"
        searchable
        searchPlaceholder="Şehir ara"
      />

      <View className="pt-2">
        <Button
          label="Oluştur"
          onPress={submit}
          isLoading={isSubmitting}
          disabled={isSubmitting}
        />
      </View>
    </AppScreen>
  );
}
