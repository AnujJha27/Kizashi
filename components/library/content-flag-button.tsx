"use client";

import { useEffect, useState } from "react";

import { readContentFlags, toggleContentFlag } from "@/lib/content-flags.js";

export function ContentFlagButton({ itemId, compact = false }: Readonly<{ itemId: string; compact?: boolean }>) {
  const [flagged, setFlagged] = useState(false);

  useEffect(() => {
    const refresh = () => setFlagged(Boolean(readContentFlags()[itemId]));
    refresh();
    window.addEventListener("michi-content-flagged-updated", refresh);
    return () => window.removeEventListener("michi-content-flagged-updated", refresh);
  }, [itemId]);

  return <button type="button" aria-pressed={flagged} onClick={() => setFlagged(toggleContentFlag(itemId))} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${flagged ? "border-[#e34a3f] bg-[#3a2023] text-[#ef675d]" : "border-[#3f4652] text-[#9297a1] hover:border-[#e5b85c] hover:text-[#f1cf7c]"}`}>{flagged ? "Flagged" : compact ? "Flag content" : "Flag content for review"}</button>;
}
