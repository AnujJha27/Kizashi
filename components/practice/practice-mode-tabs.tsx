"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type MouseEvent } from "react";

import type { PracticeMode } from "@/lib/types";

type PracticeModeEntry = { value: PracticeMode; label: string; jp: string };

export function PracticeModeTabs({ modes, activeMode, activeTopic }: Readonly<{ modes: PracticeModeEntry[]; activeMode: PracticeMode; activeTopic?: string }>) {
  const activeTab = useRef<HTMLAnchorElement>(null);
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState(activeMode);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setSelectedMode(activeMode);
    activeTab.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [activeMode]);

  const switchMode = (event: MouseEvent<HTMLAnchorElement>, mode: PracticeMode, href: string) => {
    event.preventDefault();
    if (mode === activeMode) return;
    setSelectedMode(mode);
    startTransition(() => router.push(href));
  };

  return <><nav aria-label="Practice modes" className="mb-4 -mx-1 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]"><div className="flex min-w-max gap-2">{modes.map((entry) => { const href = `/practice?mode=${entry.value}${activeTopic ? `&topic=${encodeURIComponent(activeTopic)}` : ""}`; return <Link key={entry.value} ref={entry.value === selectedMode ? activeTab : undefined} href={href} prefetch={false} onClick={(event) => switchMode(event, entry.value, href)} aria-current={entry.value === selectedMode ? "page" : undefined} className={`shrink-0 snap-start rounded-xl border px-4 py-3 text-sm ${entry.value === selectedMode ? "border-[#e34a3f] bg-[#3a2023] text-[#f5f5f2]" : "border-[#292b31] bg-[#17181d]/65 text-[#9297a1] hover:border-[#5d3936]"}`}><span className="block">{entry.label}</span><span className="jp-serif text-xs text-[#e5b85c]">{entry.jp}</span></Link>; })}</div></nav>{pending ? <div className="fixed inset-0 z-50 grid place-items-center bg-[#08101c]/70 backdrop-blur-sm" role="status" aria-live="polite"><div className="surface-panel px-7 py-5 text-sm text-[#f5f5f2]">Switching practice…</div></div> : null}</>;
}
