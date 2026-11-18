import { apiClient } from "@/lib/api/client";
import type { PagedResult, PageSummary } from "@/types/api";
import type { ApiEventListItem } from "@/features/events/types";
import {
  ORGANIZATION_EVENT_POLICY,
  type ApiOrganizationDetail,
  type ApiOrganizationListItem,
  type ApiOrganizationMember,
  type ApiOrganizationSummary,
} from "@/features/organizations/types";

/** Eski/eksik yanıtlarda yeni alanlar için güvenli varsayılanlar. */
function normalizeDetail(detail: ApiOrganizationDetail): ApiOrganizationDetail {
  if (!detail) return detail;
  return {
    ...detail,
    canDelete: detail.canDelete ?? false,
    canTransferFounder: detail.canTransferFounder ?? false,
    completedEventCount: detail.completedEventCount ?? 0,
    eventCreationPolicy:
      detail.eventCreationPolicy ?? ORGANIZATION_EVENT_POLICY.allMembers,
  };
}

export async function listMyOrganizations() {
  const response = await apiClient.get<ApiOrganizationListItem[]>(
    "/api/organizations/mine",
  );
  return (response.data ?? []).map((item) => ({
    ...item,
    // Alan gelmeyen eski API'de önceki davranış (onaylı üye açabilir); sunucu yine doğrular.
    canCreateEvents: item.canCreateEvents ?? true,
  }));
}

export async function getOrganization(organizationId: string) {
  const response = await apiClient.get<ApiOrganizationDetail>(
    `/api/organizations/${organizationId}`,
  );
  return normalizeDetail(response.data);
}

export async function listOrganizationEvents(organizationId: string) {
  const response = await apiClient.get<ApiEventListItem[]>(
    `/api/organizations/${organizationId}/events`,
  );
  return response.data ?? [];
}

/** Geçmiş etkinlikler (yeniden eskiye); sayfa dolmadıysa liste bitti demektir. */
export async function listPastOrganizationEvents(
  organizationId: string,
  page: number,
  pageSize: number,
) {
  const response = await apiClient.get<ApiEventListItem[]>(
    `/api/organizations/${organizationId}/events`,
    { params: { scope: "past", page, pageSize } },
  );
  return response.data ?? [];
}

export async function listOrganizationMembers(organizationId: string) {
  const response = await apiClient.get<ApiOrganizationMember[]>(
    `/api/organizations/${organizationId}/members`,
  );
  return response.data ?? [];
}

export async function createOrganization(payload: {
  name: string;
  description?: string | null;
  cityId?: string | null;
  isPublic: boolean;
}) {
  const response = await apiClient.post<ApiOrganizationDetail>(
    "/api/organizations",
    payload,
  );
  return normalizeDetail(response.data);
}

export async function joinOrganization(inviteCode: string) {
  const response = await apiClient.post<ApiOrganizationDetail>(
    "/api/organizations/join",
    { inviteCode },
  );
  return normalizeDetail(response.data);
}

export async function updateOrganization(
  organizationId: string,
  payload: {
    name: string;
    description?: string | null;
    cityId?: string | null;
    isPublic: boolean;
    eventCreationPolicy?: number;
  },
) {
  const response = await apiClient.patch<ApiOrganizationDetail>(
    `/api/organizations/${organizationId}`,
    payload,
  );
  return normalizeDetail(response.data);
}

export async function rotateInviteCode(organizationId: string) {
  const response = await apiClient.post<ApiOrganizationDetail>(
    `/api/organizations/${organizationId}/invite-code/rotate`,
  );
  return normalizeDetail(response.data);
}

export async function approveOrganizationMember(
  organizationId: string,
  userId: string,
) {
  const response = await apiClient.post<ApiOrganizationMember>(
    `/api/organizations/${organizationId}/members/${userId}/approve`,
  );
  return response.data;
}

export async function rejectOrganizationMember(
  organizationId: string,
  userId: string,
) {
  await apiClient.post(
    `/api/organizations/${organizationId}/members/${userId}/reject`,
  );
}

export async function updateOrganizationMemberRole(
  organizationId: string,
  userId: string,
  role: number,
) {
  const response = await apiClient.patch<ApiOrganizationMember>(
    `/api/organizations/${organizationId}/members/${userId}/role`,
    { role },
  );
  return response.data;
}

export async function leaveOrganization(organizationId: string) {
  await apiClient.post(`/api/organizations/${organizationId}/leave`);
}

export async function deleteOrganization(organizationId: string) {
  await apiClient.delete(`/api/organizations/${organizationId}`);
}

export async function transferOrganizationFounder(
  organizationId: string,
  userId: string,
) {
  const response = await apiClient.post<ApiOrganizationDetail>(
    `/api/organizations/${organizationId}/transfer-founder`,
    { userId },
  );
  return normalizeDetail(response.data);
}

export async function listBlockedOrganizationMembers(organizationId: string) {
  const response = await apiClient.get<ApiOrganizationMember[]>(
    `/api/organizations/${organizationId}/members/blocked`,
  );
  return response.data ?? [];
}

export async function removeOrganizationMember(
  organizationId: string,
  userId: string,
) {
  await apiClient.post(
    `/api/organizations/${organizationId}/members/${userId}/remove`,
  );
}

export async function blockOrganizationMember(
  organizationId: string,
  userId: string,
) {
  await apiClient.post(
    `/api/organizations/${organizationId}/members/${userId}/block`,
  );
}

export async function unblockOrganizationMember(
  organizationId: string,
  userId: string,
) {
  await apiClient.post(
    `/api/organizations/${organizationId}/members/${userId}/unblock`,
  );
}

export async function listPublicOrganizations(
  params: {
    search?: string;
    cityId?: string;
    page?: number;
    pageSize?: number;
  } = {},
): Promise<PageSummary<ApiOrganizationSummary>> {
  const response = await apiClient.get<PagedResult<ApiOrganizationSummary>>(
    "/api/organizations",
    {
      params: {
        search: params.search?.trim() || undefined,
        cityId: params.cityId || undefined,
        page: params.page,
        pageSize: params.pageSize,
      },
    },
  );
  const page = response.data;
  const items = page?.items ?? [];
  return {
    items,
    totalCount: page?.totalCount ?? items.length,
    page: page?.page ?? params.page ?? 1,
    hasNext: Boolean(page?.hasNext),
  };
}

export async function joinPublicOrganization(organizationId: string) {
  const response = await apiClient.post<ApiOrganizationDetail>(
    `/api/organizations/${organizationId}/join`,
  );
  return normalizeDetail(response.data);
}

/** `file` null ise fotoğraf silinir (dosyasız PUT). */
export async function uploadOrganizationImage(
  organizationId: string,
  file: { uri: string; name: string; type: string } | null,
) {
  const form = new FormData();
  if (file) {
    form.append("file", {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob);
  }
  const response = await apiClient.put<ApiOrganizationDetail>(
    `/api/organizations/${organizationId}/image`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return normalizeDetail(response.data);
}
