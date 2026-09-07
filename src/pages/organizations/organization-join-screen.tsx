import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppScreen, Button, Input, ScreenHeader } from "@/components";
import { useToast } from "@/contexts";
import { getApiErrorMessage } from "@/lib/api/errors";
import { joinOrganization } from "@/services/organizations-service";
import { resolveRouteParam } from "@/utils/route-params";

export function OrganizationJoinScreen() {
  const { t } = useTranslation("organizations");
  const router = useRouter();
  const { showToast } = useToast();
  const { inviteCode: inviteCodeParam } = useLocalSearchParams<{
    inviteCode?: string;
  }>();
  const prefilledCode = useMemo(
    () => resolveRouteParam(inviteCodeParam)?.toUpperCase() ?? "",
    [inviteCodeParam],
  );
  const [inviteCode, setInviteCode] = useState(prefilledCode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (prefilledCode) {
      setInviteCode(prefilledCode);
    }
  }, [prefilledCode]);

  const submit = async () => {
    const code = inviteCode.trim().toUpperCase();
    if (code.length !== 8) {
      showToast({
        type: "error",
        title: t("join.invalidCodeTitle"),
        description: t("join.invalidCodeDescription"),
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const joined = await joinOrganization(code);
      showToast({
        type: "success",
        title: t("join.requestSentTitle"),
        description: t("join.requestSentDescription"),
      });
      if (joined?.id) {
        router.replace(`/organizations/${joined.id}`);
      } else {
        router.back();
      }
    } catch (error) {
      showToast({
        type: "error",
        title: t("join.joinFailed"),
        description: getApiErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppScreen
      header={<ScreenHeader title={t("join.title")} showBack />}
      contentClassName="gap-4 px-6 pt-3"
    >
      <Text className="font-display text-3xl text-text-primary">
        {t("join.heading")}
      </Text>
      <Text className="font-body text-sm text-text-secondary">
        {t("join.subtitle")}
      </Text>
      <Input
        label={t("join.codeLabel")}
        value={inviteCode}
        onChangeText={(value) => setInviteCode(value.toUpperCase())}
        placeholder={t("join.codePlaceholder")}
        autoCapitalize="characters"
        maxLength={8}
      />
      <View className="pt-2">
        <Button
          label={t("join.submit")}
          onPress={submit}
          isLoading={isSubmitting}
          disabled={isSubmitting}
        />
      </View>
    </AppScreen>
  );
}
