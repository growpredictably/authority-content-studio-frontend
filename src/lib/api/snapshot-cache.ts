import { createClient } from "@/lib/supabase/client";

const TABLE = "command_center_snapshots";

interface SnapshotRow {
  id: string;
  snapshot_data: unknown;
  actions_pending: number;
  expires_at: string;
}

/**
 * Fetch a valid (not expired, actions remaining) snapshot from Supabase.
 * Returns the cached payload or null if no valid snapshot exists.
 * When beliefContext is provided, filters on the belief_context column.
 */
export async function getSnapshot<T>(
  authorId: string,
  snapshotType: string,
  beliefContext?: string | null
): Promise<T | null> {
  const supabase = createClient();
  let query = supabase
    .from(TABLE)
    .select("snapshot_data, actions_pending, expires_at")
    .eq("author_id", authorId)
    .eq("snapshot_type", snapshotType);

  if (beliefContext) {
    query = query.eq("belief_context", beliefContext);
  } else if (beliefContext === undefined) {
    // Caller didn't pass beliefContext — don't filter (backward-compat)
  } else {
    // Explicit null — match rows where belief_context IS NULL
    query = query.is("belief_context", null);
  }

  const { data, error } = await query.maybeSingle<SnapshotRow>();

  if (error || !data) return null;

  const isExpired = new Date(data.expires_at) <= new Date();
  const isExhausted = data.actions_pending <= 0;

  if (isExpired || isExhausted) return null;

  return data.snapshot_data as T;
}

/**
 * Cache a response in the snapshots table.
 * Uses delete + insert to handle the functional unique index
 * (user_id, author_id, snapshot_type, COALESCE(belief_context, '')).
 */
export async function upsertSnapshot(
  userId: string,
  authorId: string,
  snapshotType: string,
  data: unknown,
  actionsPending: number,
  ttlHours: number,
  beliefContext?: string | null
): Promise<void> {
  const supabase = createClient();
  const expiresAt = new Date(
    Date.now() + ttlHours * 60 * 60 * 1000
  ).toISOString();

  // Delete existing snapshot for this exact tuple (RLS scopes to current user)
  let deleteQuery = supabase
    .from(TABLE)
    .delete()
    .eq("author_id", authorId)
    .eq("snapshot_type", snapshotType);

  if (beliefContext) {
    deleteQuery = deleteQuery.eq("belief_context", beliefContext);
  } else {
    deleteQuery = deleteQuery.is("belief_context", null);
  }
  await deleteQuery;

  // Insert fresh snapshot
  await supabase.from(TABLE).insert({
    user_id: userId,
    author_id: authorId,
    snapshot_type: snapshotType,
    snapshot_data: data,
    actions_pending: actionsPending,
    belief_context: beliefContext || null,
    expires_at: expiresAt,
    created_at: new Date().toISOString(),
  });
}

/**
 * Delete a snapshot (forces fresh fetch on next visit).
 */
export async function deleteSnapshot(
  authorId: string,
  snapshotType: string
): Promise<void> {
  const supabase = createClient();
  await supabase
    .from(TABLE)
    .delete()
    .eq("author_id", authorId)
    .eq("snapshot_type", snapshotType);
}

/**
 * Decrement actions_pending by 1. When it reaches 0, the snapshot
 * is considered stale and the next visit triggers a fresh backend call.
 */
export async function decrementActionsPending(
  authorId: string,
  snapshotType: string
): Promise<void> {
  const supabase = createClient();

  // Read current value, decrement, write back
  const { data } = await supabase
    .from(TABLE)
    .select("id, actions_pending")
    .eq("author_id", authorId)
    .eq("snapshot_type", snapshotType)
    .maybeSingle<{ id: string; actions_pending: number }>();

  if (!data || data.actions_pending <= 0) return;

  await supabase
    .from(TABLE)
    .update({ actions_pending: data.actions_pending - 1 })
    .eq("id", data.id);
}
