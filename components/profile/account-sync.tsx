"use client";

import { useEffect, useState } from "react";

import { applyLocalSyncSnapshot, createLocalSyncSnapshot, readSyncEnabled, writeSyncEnabled } from "@/lib/session";

export function AccountSync() {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");

  const sync = async (pull = false) => {
    setMessage(pull ? "Pulling account state…" : "Syncing local state…");
    try {
      if (pull) {
        const response = await fetch("/api/sync");
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error ?? "Could not pull account state.");
        const count = applyLocalSyncSnapshot(payload);
        setMessage(count ? `${count} local records refreshed.` : "Account state is already current.");
      } else {
        const response = await fetch("/api/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(createLocalSyncSnapshot()) });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error ?? "Could not sync local state.");
        setMessage("Local state synced.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sync failed; local state is safe.");
    }
  };

  useEffect(() => {
    const active = readSyncEnabled();
    setEnabled(active);
    if (!active) return;
    const retry = () => { if (navigator.onLine) void sync(); };
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, []);

  const toggle = (value: boolean) => {
    writeSyncEnabled(value);
    setEnabled(value);
    if (value) void sync();
  };

  return <section className="surface-panel-raised p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="eyebrow mb-2">Account sync · 同期</p><h2 className="text-lg font-medium text-[#f5f5f2]">Keep your path across devices.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#9297a1]">Sync is opt-in. Kizashi sends bounded study state only after you enable it; failed sync leaves this browser unchanged.</p><p className="mt-2 text-xs text-[#e5b85c]" role="status">{message}</p></div><label className="flex shrink-0 items-center gap-3 text-xs text-[#c3c7ce]"><input type="checkbox" checked={enabled} onChange={(event) => toggle(event.target.checked)} className="size-4 accent-[#e34a3f]" /> Allow automatic sync</label></div><div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={() => void sync()} className="rounded-xl bg-[#e34a3f] px-4 py-3 text-xs font-semibold text-[#0b0b0d] hover:bg-[#ef675d]">Sync now</button><button type="button" onClick={() => void sync(true)} className="rounded-xl border border-white/10 px-4 py-3 text-xs font-semibold text-[#c3c7ce] hover:border-[#e5b85c] hover:text-[#f5f5f2]">Pull account state</button></div></section>;
}
