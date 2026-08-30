import { mergeSyncSnapshots } from "./sync-core";

export type SyncSnapshot = { version: 1; data: Record<string, unknown> };
type SyncClient = { from: (table: string) => any };

export async function readSyncSnapshot(supabase: SyncClient, userId: string): Promise<SyncSnapshot | null> {
  const { data, error } = await supabase.from("sync_snapshots").select("version, payload").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (!data || data.version !== 1 || typeof data.payload !== "object" || data.payload === null || Array.isArray(data.payload)) return null;
  return { version: 1, data: data.payload as Record<string, unknown> };
}

export async function writeSyncSnapshot(supabase: SyncClient, userId: string, snapshot: SyncSnapshot) {
  const current = await readSyncSnapshot(supabase, userId);
  const merged = mergeSyncSnapshots(current ?? { version: 1, data: {} }, snapshot);
  const { error } = await supabase.from("sync_snapshots").upsert({ user_id: userId, version: merged.version, payload: merged.data, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) throw error;
}
