"use client";

import { useCallback, useSyncExternalStore } from "react";

const AUTHOR_KEY = "workflow_last_author_id";
const ICP_KEY = "workflow_last_icp";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getAuthorSnapshot() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTHOR_KEY);
}

function getICPSnapshot() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ICP_KEY);
}

/**
 * Persist the user's selected author and ICP across page navigations.
 *
 * localStorage keys:
 *   "workflow_last_author_id" → author_id slug (e.g., "brian_shelton_001")
 *   "workflow_last_icp"       → ICP name string
 *
 * When setLastAuthorId is called, lastICP is automatically cleared
 * because ICPs are author-specific.
 */
export function useWorkflowPreferences() {
  const lastAuthorId = useSyncExternalStore(subscribe, getAuthorSnapshot, () => null);
  const lastICP = useSyncExternalStore(subscribe, getICPSnapshot, () => null);

  const setLastAuthorId = useCallback((authorId: string | null) => {
    if (authorId) {
      localStorage.setItem(AUTHOR_KEY, authorId);
    } else {
      localStorage.removeItem(AUTHOR_KEY);
    }
    // Clear ICP when author changes (ICPs are author-specific)
    localStorage.removeItem(ICP_KEY);
    // Notify other hooks / tabs
    window.dispatchEvent(new Event("storage"));
  }, []);

  const setLastICP = useCallback((icpName: string | null) => {
    if (icpName) {
      localStorage.setItem(ICP_KEY, icpName);
    } else {
      localStorage.removeItem(ICP_KEY);
    }
    window.dispatchEvent(new Event("storage"));
  }, []);

  const clearPreferences = useCallback(() => {
    localStorage.removeItem(AUTHOR_KEY);
    localStorage.removeItem(ICP_KEY);
    window.dispatchEvent(new Event("storage"));
  }, []);

  return { lastAuthorId, lastICP, setLastAuthorId, setLastICP, clearPreferences };
}
