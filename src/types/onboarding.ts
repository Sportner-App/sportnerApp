export type UserSportResponse = {
  sportId: string;
  sportName: string;
  sportSlug: string;
  skillLevel: number;
  isPrimary: boolean;
};

export type OnboardingSportDraft = {
  sportId: string;
  sportSlug: string;
  sportName: string;
  skillLevel: number;
};

export type OnboardingStep = "sports" | "details";
