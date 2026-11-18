import { useTranslation } from "react-i18next";

import { AppScreen, ScreenHeader, ScreenLoader } from "@/components";
import { SportReportCard } from "@/features/profile/components/sport-report-card";
import { useProfile } from "@/features/profile/hooks/use-profile";

/** Kendi spor karnen: profildeki "karnen hazır" kartından açılıyor. */
export function ReportCardScreen() {
  const { t } = useTranslation("profile");
  const { profile, isLoading } = useProfile();

  return (
    <AppScreen
      header={
        <ScreenHeader title={t("reportCard.screenTitle")} showBack />
      }
      contentClassName="gap-5 px-5 pt-3"
    >
      {isLoading || !profile ? (
        <ScreenLoader label={t("loading")} size={140} />
      ) : (
        <SportReportCard
          userId={profile.userId}
          name={profile.fullName}
          isOwnProfile
        />
      )}
    </AppScreen>
  );
}
