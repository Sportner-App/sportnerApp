export const LEADERBOARD_PERIOD = { month: 0, allTime: 1 } as const;

export type LeaderboardPeriod =
  (typeof LEADERBOARD_PERIOD)[keyof typeof LEADERBOARD_PERIOD];

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  username: string;
  fullName: string;
  profileImageUrl: string | null;
  eventCount: number;
};

export type DistrictLeaderboard = {
  city: string;
  district: string;
  period: LeaderboardPeriod;
  totalPlayers: number;
  minPlayers: number;
  entries: LeaderboardEntry[];
  me: LeaderboardEntry | null;
};

export type DistrictSummary = {
  city: string;
  district: string;
  playersThisMonth: number;
  eventsAllTime: number;
};

export type MyDistrictStanding = {
  city: string;
  district: string;
  rank: number | null;
  eventCount: number;
  totalPlayers: number;
};

export type DistrictCrown = {
  city: string;
  district: string;
  /** YYYY-MM-01 */
  month: string;
  eventCount: number;
};
