"use client";

import { useEffect, useState } from "react";

type ProviderHealth = { id: string; name: string; status: "healthy" | "unavailable"; httpStatus: number | null };

export function ImmersionProviderHealth() {
  const [health, setHealth] = useState<ProviderHealth[] | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/immersion/provider-health").then((response) => response.ok ? response.json() as Promise<ProviderHealth[]> : []).then((next) => { if (active) setHealth(Array.isArray(next) ? next : []); }).catch(() => { if (active) setHealth([]); });
    return () => { active = false; };
  }, []);

  return <section className="mb-7 rounded-xl border border-white/10 bg-[#101b2b]/60 p-5" aria-live="polite"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">Provider health · immersion</p><p className="mt-1 text-xs text-[#9297a1]">Cached feed checks for provider catalogs; a failure keeps the official channel fallback available.</p></div><span className="text-xs text-[#676c75]">{health ? `${health.filter((provider) => provider.status === "healthy").length} healthy` : "Checking…"}</span></div>{health?.length ? <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{health.map((provider) => <div key={provider.id} className="rounded-lg border border-white/10 bg-[#17181d]/55 p-3"><div className="flex items-center justify-between gap-2"><p className="truncate text-sm text-[#f5f5f2]">{provider.name}</p><span className={provider.status === "healthy" ? "text-[#8bcca6]" : "text-[#e5b85c]"}>{provider.status === "healthy" ? "Healthy" : "Fallback"}</span></div><p className="mt-1 text-[10px] text-[#676c75]">{provider.httpStatus ? `HTTP ${provider.httpStatus}` : "Feed unavailable"}</p></div>)}</div> : null}</section>;
}
