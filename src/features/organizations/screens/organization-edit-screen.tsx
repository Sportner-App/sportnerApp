import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import {
  AppScreen,
  AppText as Text,
  Button,
  Input,
  ScreenHeader,
  ScreenLoader,
  SelectField,
} from "@/components";
import { useToast } from "@/contexts";
import { useCities } from "@/features/location/hooks/use-cities";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  getOrganization,
  updateOrganization,
  uploadOrganizationImage,
} from "@/features/organizations/services/organizations-service";
import { useMediaSourceChoice } from "@/hooks/use-media-source-choice";
import { OrganizationPhotoPicker } from "@/features/organizations/components/organization-photo-picker";
import { OrganizationEventPolicyPicker } from "@/features/organizations/components/organization-event-policy-picker";
import { ORGANIZATION_EVENT_POLICY } from "@/features/organizations/types";
import { OrganizationVisibilityPicker } from "@/features/organizations/components/organization-visibility-picker";
import {
  mediaDeniedMessage,
  pickProfileImage,
  type PickedMedia,
} from "@/utils/media-picker";
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
  const [isPublic, setIsPublic] = useState(true);
  const [eventCreationPolicy, setEventCreationPolicy] = useState<number>(
    ORGANIZATION_EVENT_POLICY.allMembers,
  );
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [photo, setPhoto] = useState<PickedMedia | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const { chooseSource, sourceSheet } = useMediaSourceChoice();
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
        setIsPublic(detail.isPublic);
        setEventCreationPolicy(detail.eventCreationPolicy);
        setImageUrl(detail.imageUrl);
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
    setPhotoRemoved(false);
  };

  const previewUri = photo?.uri ?? (photoRemoved ? null : imageUrl);

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
        isPublic,
        eventCreationPolicy,
      });
      if (photo || photoRemoved) {
        try {
          await uploadOrganizationImage(organizationId, photo);
        } catch (error) {
          showToast({
            type: "error",
            title: t("organizations:edit.photoUploadFailed"),
            description: getApiErrorMessage(error),
          });
          return;
        }
      }
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
      footer={sourceSheet}
      contentClassName="gap-4 px-6 pt-3"
    >
      {isLoading ? (
        <ScreenLoader />
      ) : (
        <>
          <OrganizationPhotoPicker
            uri={previewUri}
            name={name}
            onPick={() => void choosePhoto()}
            onRemove={() => {
              setPhoto(null);
              setPhotoRemoved(true);
            }}
          />
          <Text className="font-display text-heading-lg text-text-primary">
            {t("organizations:edit.heading")}
          </Text>
          <OrganizationVisibilityPicker
            isPublic={isPublic}
            onChange={setIsPublic}
          />
          <OrganizationEventPolicyPicker
            value={eventCreationPolicy}
            onChange={setEventCreationPolicy}
          />
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
