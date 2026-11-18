import { Redirect, useLocalSearchParams } from "expo-router";

import { resolveRouteParam } from "@/utils/route-params";

/** Eski paylaşılmış davet bağlantıları (`sportner://organizations/join`) için. */
export default function LegacyOrganizationJoinRoute() {
  const { inviteCode } = useLocalSearchParams<{ inviteCode?: string }>();

  return (
    <Redirect
      href={{
        pathname: "/clubs/join",
        params: { inviteCode: resolveRouteParam(inviteCode) },
      }}
    />
  );
}
