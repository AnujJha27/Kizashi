"use client";

import { useEffect, useRef } from "react";

import type { PracticeMode } from "@/lib/types";

type PracticeModeEntry = { value: PracticeMode; label: string; jp: string };

export function PracticeModeTabs({ modes, activeMode, activeTopic }: Readonly<{ modes: PracticeModeEntry[]; activeMode: PracticeMode; activeTopic?: string }>) {
  const activeTab = useRef<HTMLAnchorElement>(null);
  useEffect(() => { activeTab.current?.scrollIntoView({ block: "nearest", inline: "center" }); }, [activeMode]);

  return <nav aria-label="Practice modes" className="mb-4 -mx-1 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]"><div className="flex min-w-max gap-2">{modes.map((entry) => { const href = `/practice?mode=${entry.value}${activeTopic ? `&topic=${encodeURIComponent(activeTopic)}` : ""}`; return <a key={entry.value} ref={entry.value === activeMode ? activeTab : undefined} href={href} onClick={(event) => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || entry.value === activeMode) return; event.preventDefault(); window.location.assign(href); }} aria-current={entry.value === activeMode ? "page" : undefined} className={`shrink-0 snap-start rounded-xl border px-4 py-3 text-sm ${entry.value === activeMode ? "border-[#e34a3f] bg-[#3a2023] text-[#f5f5f2]" : "border-[#292b31] bg-[#17181d]/65 text-[#9297a1] hover:border-[#5d3936]"}`}><span className="block">{entry.label}</span><span className="jp-serif text-xs text-[#e5b85c]">{entry.jp}</span></a>; })}</div></nav>;
}
