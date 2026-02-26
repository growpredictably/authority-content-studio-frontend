"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Author } from "@/lib/api/types";

export function useAuthor() {
  const [author, setAuthor] = useState<Author | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAuthor() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error: dbError } = await supabase
        .from("authors_dna")
        .select("id, user_id, name, brand_id, archetype, archetype_description")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (dbError) {
        setError(dbError.message);
      } else if (data) {
        setAuthor(data as Author);
      }

      setIsLoading(false);
    }

    fetchAuthor();
  }, []);

  return { author, isLoading, error };
}
