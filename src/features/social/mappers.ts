import type { ApiExplorePerson, ExplorePerson } from "@/features/social/types";
import { formatPersonName } from "@/utils/person";

export function mapExplorePerson(item: ApiExplorePerson): ExplorePerson {
  return {
    userId: item.userId,
    username: item.username,
    firstName: item.firstName,
    name: formatPersonName(item),
    avatarUrl: item.profileImageUrl,
    city: item.city,
    mutualFriendsCount: item.mutualFriendsCount,
    sharedSportsCount: item.sharedSportsCount,
    sameCity: item.sameCity,
    sharedSportNames: item.sharedSportNames ?? [],
  };
}
