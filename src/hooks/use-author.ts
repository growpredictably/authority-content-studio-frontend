"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Author } from "@/lib/api/types";

export function useAuthor() {
  const {
    data: author,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["author"],
    queryFn: async (): Promise<Author | null> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return null;

      // Prefer the primary author; fall back to first if is_primary not set
      let { data, error: dbError } = await supabase
        .from("authors_dna")
        .select(
          "id, user_id, name, brand_id, archetype, archetype_description"
        )
        .eq("user_id", user.id)
        .eq("is_primary", true)
        .limit(1)
        .maybeSingle();

      // Fallback: if no primary found (pre-migration), get the first one
      if (!data && !dbError) {
        const fallback = await supabase
          .from("authors_dna")
          .select(
            "id, user_id, name, brand_id, archetype, archetype_description"
          )
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();
        data = fallback.data;
        dbError = fallback.error;
      }

      if (dbError) throw dbError;
      return data as Author;
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
    retry: 1,
  });

  return {
    author: author ?? null,
    isLoading,
    error: error?.message ?? null,
    hasNoAuthors: !isLoading && !author,
  };
}
