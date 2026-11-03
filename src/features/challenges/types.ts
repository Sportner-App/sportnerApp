export const CHALLENGE_METRIC = {
  eventsPlayed: 0,
  distinctSports: 1,
  eventsOrganized: 2,
  sportEventsPlayed: 3,
} as const;

export type Challenge = {
  id: string;
  title: string;
  description: string;
  /** FontAwesome ikon adı. */
  icon: string;
  metric: number;
  sportSlug: string | null;
  targetValue: number;
  startsAt: string;
  endsAt: string;
  sponsorName: string | null;
  sponsorLogoUrl: string | null;
  rewardText: string | null;
  participantCount: number;
  completedCount: number;
  isJoined: boolean;
  progress: number;
  isCompleted: boolean;
  completedAt: string | null;
};
