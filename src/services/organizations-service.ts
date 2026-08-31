import { apiClient } from "@/lib/api/client";
import type { ApiEventListItem } from "@/types/events";
import type {
  ApiOrganizationDetail,
  ApiOrganizationListItem,
  ApiOrganizationMember,
} from "@/types/organizations";

export async function listMyOrganizations() {
  const response = await apiClient.get<ApiOrganizationListItem[]>(
    "/api/organizations/mine",
  );
  return response.data ?? [];
}

export async function getOrganization(organizationId: string) {
  const response = await apiClient.get<ApiOrganizationDetail>(
    `/api/organizations/${organizationId}`,
  );
  return response.data;
}

export async function listOrganizationEvents(organizationId: string) {
  const response = await apiClient.get<ApiEventListItem[]>(
    `/api/organizations/${organizationId}/events`,
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
}) {
  const response = await apiClient.post<ApiOrganizationDetail>(
    "/api/organizations",
    payload,
  );
  return response.data;
}

export async function joinOrganization(inviteCode: string) {
  const response = await apiClient.post<ApiOrganizationDetail>(
    "/api/organizations/join",
    { inviteCode },
  );
  return response.data;
}

export async function updateOrganization(
  organizationId: string,
  payload: { name: string; description?: string | null; cityId?: string | null },
) {
  const response = await apiClient.patch<ApiOrganizationDetail>(
    `/api/organizations/${organizationId}`,
    payload,
  );
  return response.data;
}

export async function rotateInviteCode(organizationId: string) {
  const response = await apiClient.post<ApiOrganizationDetail>(
    `/api/organizations/${organizationId}/invite-code/rotate`,
  );
  return response.data;
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
