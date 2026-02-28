"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { AppRoleName } from "@/lib/api/types";

/**
 * Get the current user's role(s).
 * Queries user_roles table directly via Supabase (same pattern as use-app-settings).
 */
export function useUserRole() {
  return useQuery({
    queryKey: ["user-role"],
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { roles: [] as AppRoleName[], isAdmin: false, isSuperAdmin: false };

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const roles = (data ?? []).map((r) => r.role as AppRoleName);
      return {
        roles,
        isAdmin: roles.includes("admin") || roles.includes("super_admin"),
        isSuperAdmin: roles.includes("super_admin"),
      };
    },
    staleTime: 5 * 60_000,
  });
}
