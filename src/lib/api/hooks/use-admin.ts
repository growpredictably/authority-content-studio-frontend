"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { apiGet, apiPut, apiCall, apiDelete } from "@/lib/api/client";
import type {
  UserProfile,
  UserRole,
  AllowedEmail,
  AppSetting,
} from "@/lib/api/types";

async function getToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

// ─── User Management ────────────────────────────────────────

/** List all user profiles (admin only). */
export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<{ users: UserProfile[]; total: number }>(
        "/v1/admin/users",
        token
      );
    },
    staleTime: 60_000,
  });
}

// ─── Invite Management ──────────────────────────────────────

/** List all invited emails (admin only). */
export function useAdminInvites() {
  return useQuery({
    queryKey: ["admin-invites"],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<{ invites: AllowedEmail[]; total: number }>(
        "/v1/admin/invites",
        token
      );
    },
    staleTime: 60_000,
  });
}

/** Send an invite to a new user. */
export function useSendInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { email: string; notes?: string }) => {
      const token = await getToken();
      return apiCall<{ success: boolean; invite: AllowedEmail }>(
        "/v1/admin/invite",
        payload,
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-invites"] });
    },
  });
}

/** Delete an invite. */
export function useDeleteInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inviteId: string) => {
      const token = await getToken();
      return apiDelete<{ success: boolean }>(
        `/v1/admin/invites/${inviteId}`,
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-invites"] });
    },
  });
}

// ─── Role Management ────────────────────────────────────────

/** Get roles for a specific user. */
export function useAdminRoles(userId: string | undefined) {
  return useQuery({
    queryKey: ["admin-roles", userId],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<{ user_id: string; roles: UserRole[] }>(
        `/v1/admin/roles/${userId}`,
        token
      );
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
}

/** Assign a role to a user. */
export function useAssignRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: string;
    }) => {
      const token = await getToken();
      return apiCall<{ success: boolean; role: UserRole }>(
        `/v1/admin/roles/${userId}`,
        { role },
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

/** Revoke a role from a user. */
export function useRevokeRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: string;
    }) => {
      const token = await getToken();
      return apiDelete<{ success: boolean }>(
        `/v1/admin/roles/${userId}/${role}`,
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

// ─── App Settings ───────────────────────────────────────────

/** List all app settings (admin only). */
export function useAdminSettings() {
  return useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<{ settings: AppSetting[] }>("/v1/admin/settings", token);
    },
    staleTime: 60_000,
  });
}

/** Update an app setting by key. */
export function useUpdateAdminSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      key,
      value,
      description,
    }: {
      key: string;
      value: Record<string, unknown>;
      description?: string;
    }) => {
      const token = await getToken();
      return apiPut<{ success: boolean; setting: AppSetting }>(
        `/v1/admin/settings/${key}`,
        { value, description },
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
    },
  });
}

// ─── Draft Cleanup ──────────────────────────────────────────

/** Trigger manual draft cleanup. */
export function useDraftCleanup() {
  return useMutation({
    mutationFn: async (params?: {
      max_drafts_per_user?: number;
      max_age_days?: number;
    }) => {
      const token = await getToken();
      return apiCall<{
        success: boolean;
        result: { deleted_by_age: number };
      }>("/v1/admin/drafts/cleanup", params ?? {}, token);
    },
  });
}

// ─── Webhook Health ─────────────────────────────────────────

/** Check webhook endpoint health (admin only). */
export function useWebhookHealth() {
  return useQuery({
    queryKey: ["admin-webhook-health"],
    queryFn: async () => {
      const token = await getToken();
      return apiGet<{
        webhooks: Array<{
          name: string;
          url: string;
          status: number | null;
          healthy: boolean;
          error?: string;
        }>;
      }>("/v1/admin/webhook-health", token);
    },
    staleTime: 30_000,
    enabled: false, // Manual trigger only
  });
}
