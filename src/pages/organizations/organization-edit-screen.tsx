import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppScreen, Button, Input, ScreenHeader, SelectField, SportLoader } from "@/components";
import { useToast } from "@/contexts";
import { useCities } from "@/hooks/use-cities";
import { getApiErrorMessage } from "@/lib/api/errors";
import { getOrganization, updateOrganization } from "@/services/organizations-service";
import type { SelectOption } from "@/types/components";
import { resolveRouteParam } from "@/utils/route-params";

export function OrganizationEditScreen() {
  const { t } = useTranslation(["organizations", "profile", "common"]);
  const router = useRouter();
  const { showToast } = useToast();
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const organizationId = useMemo(() => resolveRouteParam(rawId), [rawId]);
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
        description: t("organizations:form.plateCodeDescription", {
          code: String(city.plateCode).padStart(2, "0"),
        }),
      })),
    [cities, t],
  );

  useEffect(() => {
    if (!organizationId) return;
    void getOrganization(organizationId)
      .then((detail) => {
        setName(detail.name);
        setDescription(detail.description ?? "");
        setCityId(detail.cityId ?? "");
      })
      .catch((error) => {
        showToast({
          type: "error",
          title: t("organizations:edit.loadFailed"),
          description: getApiErrorMessage(error),
        });
      })
      .finally(() => setIsLoading(false));
  }, [organizationId, showToast, t]);

  const submit = async () => {
    if (!organizationId) return;
    const trimmed = name.trim();
    if (!trimmed) {
      showToast({ type: "error", title: t("organizations:edit.nameRequired") });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateOrganization(organizationId, {
        name: trimmed,
        description: description.trim() || null,
        cityId: cityId || null,
      });
      showToast({ type: "success", title: t("organizations:edit.updated") });
      router.back();
    } catch (error) {
      showToast({
        type: "error",
        title: t("organizations:edit.saveFailed"),
        description: getApiErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppScreen
      header={<ScreenHeader title={t("organizations:edit.title")} showBack />}
      contentClassName="gap-4 px-6 pt-3"
    >
      {isLoading ? (
        <View className="items-center py-16">
          <SportLoader size={120} />
        </View>
      ) : (
        <>
          <Text className="font-display text-3xl text-text-primary">
            {t("organizations:edit.heading")}
          </Text>
          <Input
            label={t("organizations:form.nameLabel")}
            value={name}
            onChangeText={setName}
            maxLength={80}
          />
          <Input
            label={t("organizations:form.descriptionLabel")}
            value={description}
            onChangeText={setDescription}
            maxLength={1000}
            multiline
          />
          <SelectField
            label={t("profile:edit.cityLabel")}
            placeholder={
              citiesLoading
                ? t("common:loading")
                : t("organizations:form.cityOptionalPlaceholder")
            }
            options={cityOptions}
            value={cityId}
            onChange={setCityId}
            sheetTitle={t("profile:edit.citySheetTitle")}
            searchable
            searchPlaceholder={t("profile:edit.citySearchPlaceholder")}
          />
          <Button
            label={t("common:save")}
            onPress={submit}
            isLoading={isSubmitting}
            disabled={isSubmitting}
          />
        </>
      )}
    </AppScreen>
  );
}
