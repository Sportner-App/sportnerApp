export type EventFeedItem = {
  id: string;
  title: string;
  description: string | null;
  sportType?: string;
  sport_type?: string;
  eventDate?: string;
  event_date?: string;
  maxPlayers?: number;
  max_players?: number;
  addressText?: string;
  address_text?: string;
  latitude?: number | null;
  longitude?: number | null;
  createdAt?: string;
  created_at?: string;
  createdBy?: string;
  created_by?: string;
  organizerName?: string | null;
  organizerAvatarUrl?: string | null;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
  sports?: { name: string | null; icon_name: string | null } | null;
  participantsCount?: number | null;
  participants_count?: number | null;
  approvedParticipantsCount?: number | null;
  approved_participants_count?: number | null;
  distance_km?: number | null;
  approved_participants_preview?: Array<{
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
  }>;
};

export type EventFilter = {
  key: string;
  label: string;
};
