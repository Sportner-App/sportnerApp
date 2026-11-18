import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import {
  AppScreen,
  AppText as Text,
  Button,
  Input,
  ScreenHeader,
  SelectField,
} from "@/components";
import { useToast } from "@/contexts";
import { useCities } from "@/features/location/hooks/use-cities";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  createOrganization,
  uploadOrganizationImage,
} from "@/features/organizations/services/organizations-service";
import { useMediaSourceChoice } from "@/hooks/use-media-source-choice";
import { OrganizationPhotoPicker } from "@/features/organizations/components/organization-photo-picker";
import { OrganizationVisibilityPicker } from "@/features/organizations/components/organization-visibility-picker";
import {
  mediaDeniedMessage,
  pickProfileImage,
  type PickedMedia,
} from "@/utils/media-picker";
import type { SelectOption } from "@/types/components";

export function OrganizationCreateScreen() {
  const { t } = useTranslation(["organizations", "profile", "common"]);
  const router = useRouter();
  const { showToast } = useToast();
  const { cities, isLoading: citiesLoading } = useCities();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cityId, setCityId] = useState<string | undefined>();
  const [isPublic, setIsPublic] = useState(true);
  const [photo, setPhoto] = useState<PickedMedia | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { chooseSource, sourceSheet } = useMediaSourceChoice();

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

  const choosePhoto = async () => {
    const source = await chooseSource();
    if (!source) return;

    const picked = await pickProfileImage(source);
    if (picked === "denied") {
      showToast({
        type: "error",
        title: t("organizations:photo.permissionRequired"),
        description: mediaDeniedMessage(source),
      });
      return;
    }
    if (picked === "cancelled") return;
    setPhoto(picked);
  };

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      showToast({
        type: "error",
        title: t("organizations:create.nameRequiredTitle"),
        description: t("organizations:create.nameRequiredDescription"),
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createOrganization({
        name: trimmed,
        description: description.trim() || null,
        cityId: cityId || null,
        isPublic,
      });
      showToast({
        type: "success",
        title: t("organizations:create.createdTitle"),
        description: t("organizations:create.createdDescription"),
      });
      if (created?.id && photo) {
        try {
          await uploadOrganizationImage(created.id, photo);
        } catch {
          showToast({
            type: "error",
            title: t("organizations:create.photoUploadFailed"),
            description: t("organizations:create.photoUploadFailedDescription"),
          });
        }
      }
      if (created?.id) {
        router.replace(`/clubs/${created.id}`);
      } else {
        router.back();
      }
    } catch (error) {
      showToast({
        type: "error",
        title: t("organizations:create.createFailed"),
        description: getApiErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppScreen
      header={<ScreenHeader title={t("organizations:create.title")} showBack />}
      footer={sourceSheet}
      contentClassName="gap-4 px-6 pt-3"
    >
      <OrganizationPhotoPicker
        uri={photo?.uri}
        name={name}
        onPick={() => void choosePhoto()}
        onRemove={photo ? () => setPhoto(null) : undefined}
      />

      <Text className="font-display text-heading-lg text-text-primary">
        {t("organizations:create.heading")}
      </Text>
      <Text className="font-body text-body-sm text-text-secondary">
        {t("organizations:create.subtitle")}
      </Text>

      <OrganizationVisibilityPicker
        isPublic={isPublic}
        onChange={setIsPublic}
      />

      <Input
        label={t("organizations:form.nameLabel")}
        value={name}
        onChangeText={setName}
        placeholder={t("organizations:create.namePlaceholder")}
        maxLength={80}
      />
      <Input
        label={t("organizations:form.descriptionLabel")}
        value={description}
        onChangeText={setDescription}
        placeholder={t("organizations:form.optionalPlaceholder")}
        maxLength={1000}
        multiline
      />
      <SelectField
        label={t("profile:edit.cityLabel")}
        placeholder={
          citiesLoading
            ? t("profile:edit.cityLoadingPlaceholder")
            : t("organizations:form.cityOptionalPlaceholder")
        }
        options={cityOptions}
        value={cityId ?? ""}
        onChange={setCityId}
        sheetTitle={t("profile:edit.citySheetTitle")}
        searchable
        searchPlaceholder={t("profile:edit.citySearchPlaceholder")}
      />

      <View className="pt-2">
        <Button
          label={t("organizations:create.submit")}
          onPress={submit}
          isLoading={isSubmitting}
          disabled={isSubmitting}
        />
      </View>
    </AppScreen>
  );
}
