import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  ONBOARDING_COPY,
  ONBOARDING_SEARCH_DEBOUNCE_MS,
  ONBOARDING_SEARCH_MIN_CHARS,
  ONBOARDING_SPORT_GROUPS,
} from "@/constants/onboarding";
import { useSession, useToast } from "@/contexts";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  addMySportSafe,
  completeOnboarding,
  markLocalOnboardingComplete,
  upsertOnboardingProfileDetails,
} from "@/services/onboarding-service";
import { uploadAvatar, uploadIntroVideo } from "@/services/profile-service";
import { listSports } from "@/services/sports-service";
import type { OnboardingSportDraft, OnboardingStep } from "@/types/onboarding";
import type { Sport } from "@/types/sports";
import {
  pickIntroVideo,
  pickProfileImage,
  type PickedMedia,
} from "@/utils/media-picker";

export function useOnboarding() {
  const router = useRouter();
  const { refreshSession, user } = useSession();
  const { showToast } = useToast();

  const [step, setStep] = useState<OnboardingStep>("sports");
  const [sports, setSports] = useState<Sport[]>([]);
  const [isSportsLoading, setIsSportsLoading] = useState(true);
  const [selected, setSelected] = useState<OnboardingSportDraft[]>([]);
  const [primarySportId, setPrimarySportId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [groupKey, setGroupKey] = useState("all");
  const [editingSportId, setEditingSportId] = useState<string | null>(null);
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<PickedMedia | null>(null);
  const [video, setVideo] = useState<PickedMedia | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestIdRef = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();

    // 1 char: wait for 2nd (or clear) — do not hit the API.
    if (trimmed.length > 0 && trimmed.length < ONBOARDING_SEARCH_MIN_CHARS) {
      return;
    }

    const search =
      trimmed.length >= ONBOARDING_SEARCH_MIN_CHARS ? trimmed : undefined;
    const delayMs = search ? ONBOARDING_SEARCH_DEBOUNCE_MS : 0;

    const timer = setTimeout(() => {
      const requestId = ++requestIdRef.current;
      setIsSportsLoading(true);

      void (async () => {
        try {
          const catalog = await listSports({
            search,
            page: 1,
            pageSize: 50,
          });
          if (requestId !== requestIdRef.current) {
            return;
          }
          setSports(catalog);
        } catch (error) {
          if (requestId !== requestIdRef.current) {
            return;
          }
          showToast({
            type: "error",
            title: "Sporlar yüklenemedi",
            description: getApiErrorMessage(error),
          });
        } finally {
          if (requestId === requestIdRef.current) {
            setIsSportsLoading(false);
          }
        }
      })();
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [query, showToast]);

  const canContinueSports = selected.length > 0 && Boolean(primarySportId);

  const isSearchTooShort =
    query.trim().length > 0 &&
    query.trim().length < ONBOARDING_SEARCH_MIN_CHARS;

  const filteredSports = useMemo(() => {
    const sorted = [...sports].sort((a, b) => a.displayOrder - b.displayOrder);
    const group = ONBOARDING_SPORT_GROUPS.find((item) => item.key === groupKey);
    const slugSet = group?.slugs ? new Set(group.slugs) : null;

    if (!slugSet) {
      return sorted;
    }

    return sorted.filter((sport) => slugSet.has(sport.slug.toLowerCase()));
  }, [groupKey, sports]);

  const editingDraft = useMemo(
    () => selected.find((item) => item.sportId === editingSportId) ?? null,
    [editingSportId, selected],
  );

  const toggleSport = (sport: Sport) => {
    setSelected((prev) => {
      const exists = prev.find((item) => item.sportId === sport.id);
      if (exists) {
        const next = prev.filter((item) => item.sportId !== sport.id);
        setPrimarySportId((current) => {
          if (current !== sport.id) {
            return current;
          }
          return next[0]?.sportId ?? null;
        });
        setEditingSportId((current) =>
          current === sport.id ? (next[0]?.sportId ?? null) : current,
        );
        return next;
      }

      const draft: OnboardingSportDraft = {
        sportId: sport.id,
        sportSlug: sport.slug,
        sportName: sport.name,
        skillLevel: 1,
      };

      setPrimarySportId((current) => current ?? sport.id);
      setEditingSportId(sport.id);
      return [...prev, draft];
    });
  };

  const setSportSkill = (sportId: string, skillLevel: number) => {
    setSelected((prev) =>
      prev.map((item) =>
        item.sportId === sportId ? { ...item, skillLevel } : item,
      ),
    );
  };

  const goToDetails = () => {
    if (!canContinueSports) {
      showToast({
        type: "error",
        title: "Spor gerekli",
        description: "En az bir spor seç ve birincil sporunu belirle.",
      });
      return;
    }

    setEditingSportId(null);
    setStep("details");
  };

  const chooseAvatar = async () => {
    const picked = await pickProfileImage();
    if (picked === "denied") {
      showToast({
        type: "error",
        title: "İzin gerekli",
        description: "Fotoğraf seçmek için galeri izni vermelisin.",
      });
      return;
    }
    if (picked === "cancelled") {
      return;
    }
    setAvatar(picked);
  };

  const chooseVideo = async () => {
    const picked = await pickIntroVideo();
    if (picked === "denied") {
      showToast({
        type: "error",
        title: "İzin gerekli",
        description: "Video seçmek için galeri izni vermelisin.",
      });
      return;
    }
    if (picked === "cancelled") {
      return;
    }
    setVideo(picked);
  };

  const finish = async () => {
    if (!canContinueSports || isSubmitting) {
      return;
    }

    if (!avatar) {
      showToast({
        type: "error",
        title: "Profil fotoğrafı gerekli",
        description: "Devam etmek için bir profil fotoğrafı seçmelisin.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // One POST per selected sport (API has no batch endpoint).
      await Promise.all(
        selected.map((sport) =>
          addMySportSafe({
            sportId: sport.sportId,
            skillLevel: sport.skillLevel,
            isPrimary: sport.sportId === primarySportId,
          }),
        ),
      );

      await upsertOnboardingProfileDetails({
        city: city.trim() || undefined,
        bio: bio.trim() || undefined,
        username: user?.username,
        firstName: user?.firstName,
        lastName: user?.lastName,
      });

      await uploadAvatar(avatar);

      if (video) {
        await uploadIntroVideo(video);
      }

      const { error } = await completeOnboarding();

      if (error) {
        showToast({
          type: "error",
          title: "Tamamlanamadı",
          description: error.message,
        });
        return;
      }

      await markLocalOnboardingComplete();
      await refreshSession?.();

      showToast({
        type: "success",
        title: ONBOARDING_COPY.toasts.successTitle,
        description: ONBOARDING_COPY.toasts.successDescription,
      });

      router.replace("/(tabs)");
    } catch (error) {
      showToast({
        type: "error",
        title: "Tamamlanamadı",
        description: getApiErrorMessage(
          error,
          ONBOARDING_COPY.toasts.saveFailed,
        ),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    step,
    setStep,
    sports,
    filteredSports,
    isSportsLoading,
    isSearchTooShort,
    selected,
    primarySportId,
    setPrimarySportId,
    query,
    setQuery,
    groupKey,
    setGroupKey,
    editingSportId,
    setEditingSportId,
    editingDraft,
    city,
    setCity,
    bio,
    setBio,
    avatar,
    video,
    chooseAvatar,
    chooseVideo,
    clearAvatar: () => setAvatar(null),
    clearVideo: () => setVideo(null),
    isSubmitting,
    canContinueSports,
    canFinish: canContinueSports && Boolean(avatar),
    toggleSport,
    setSportSkill,
    goToDetails,
    finish,
  };
}
