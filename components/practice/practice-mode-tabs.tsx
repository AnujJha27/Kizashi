"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import type { PracticeMode, TargetLevel } from "@/lib/types";

type PracticeModeEntry = { value: PracticeMode; label: string; jp: string };
type PracticeIntent = "quick" | "focus" | "weak" | "test";

const intents: Array<{ value: PracticeIntent; label: string; jp: string; detail: string; href: string }> = [
  { value: "quick", label: "Quick", jp: "すぐに", detail: "Kizashi chooses a short useful set.", href: "/practice?mode=quick&duration=5" },
  { value: "focus", label: "Focus", jp: "集中", detail: "Choose one skill to strengthen.", href: "/practice?mode=vocabulary" },
  { value: "weak", label: "Weaknesses", jp: "弱点", detail: "Repair recurring misses.", href: "/practice?mode=weak" },
  { value: "test", label: "Test", jp: "テスト", detail: "Mini, section, or full exam practice.", href: "/practice?mode=mini" },
];

const focusValues = new Set<PracticeMode>(["vocabulary", "kanji", "grammar", "conjugation", "mixed"]);
const testValues = new Set<PracticeMode>(["pass", "mini", "section", "full", "integrated", "mock"]);

function activeIntent(mode: PracticeMode): PracticeIntent {
  if (mode === "quick") return "quick";
  if (mode === "weak") return "weak";
  if (testValues.has(mode)) return "test";
  return "focus";
}

function contextQuery(targetLevel: TargetLevel, activeTopic?: string) {
  return `${targetLevel === "N4" ? "&level=N4" : ""}${activeTopic ? `&topic=${encodeURIComponent(activeTopic)}` : ""}`;
}

export function PracticeModeTabs({ modes, activeMode, activeTopic, targetLevel }: Readonly<{ modes: PracticeModeEntry[]; activeMode: PracticeMode; activeTopic?: string; targetLevel: TargetLevel }>) {
  const activeTab = useRef<HTMLAnchorElement>(null);
  const intent = activeIntent(activeMode);
  const focusModes = modes.filter((entry) => focusValues.has(entry.value));
  const testModes = modes.filter((entry) => testValues.has(entry.value));

  useEffect(() => { activeTab.current?.scrollIntoView({ block: "nearest", inline: "center" }); }, [activeMode]);

  return <div className="mb-6 space-y-4">
    <nav aria-label="Practice modes" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {intents.map((entry) => {
        const href = `${entry.href}${contextQuery(targetLevel, activeTopic)}`;
        const selected = entry.value === intent;
        return <Link key={entry.value} ref={selected ? activeTab : undefined} prefetch={false} href={href} aria-current={selected ? "page" : undefined} className={`rounded-xl border px-4 py-3 text-left ${selected ? "border-[#e34a3f] bg-[#3a2023] text-[#f5f5f2]" : "border-[#292b31] bg-[#17181d]/65 text-[#9297a1] hover:border-[#5d3936]"}`}><span className="block text-sm font-semibold">{entry.label}</span><span className="jp-serif text-xs text-[#e5b85c]">{entry.jp}</span><span className="mt-1 hidden text-[11px] leading-4 text-[#9297a1] sm:block">{entry.detail}</span></Link>;
      })}
    </nav>
    {intent === "focus" ? <nav aria-label="Focus skills" className="flex flex-wrap items-center gap-2 border-l border-[#e5b85c] pl-3"><span className="eyebrow mr-1 text-[10px]">Choose a skill</span>{focusModes.map((entry) => { const selected = entry.value === activeMode; return <Link key={entry.value} prefetch={false} href={`/practice?mode=${entry.value}${contextQuery(targetLevel, activeTopic)}`} aria-current={selected ? "page" : undefined} className={`rounded-lg border px-3 py-2 text-xs ${selected ? "border-[#e5b85c] bg-[#302818] text-[#f1cf7c]" : "border-[#3f4652] text-[#9297a1] hover:border-[#e5b85c]"}`}>{entry.label} <span className="jp-serif ml-1 text-[#e5b85c]">{entry.jp}</span></Link>; })}</nav> : null}
    {intent === "test" ? <nav aria-label="Test modes" className="flex flex-wrap items-center gap-2 border-l border-[#e5b85c] pl-3"><span className="eyebrow mr-1 text-[10px]">Choose a test</span>{testModes.map((entry) => { const selected = entry.value === activeMode; return <Link key={entry.value} prefetch={false} href={`/practice?mode=${entry.value}${contextQuery(targetLevel, activeTopic)}`} aria-current={selected ? "page" : undefined} className={`rounded-lg border px-3 py-2 text-xs ${selected ? "border-[#e5b85c] bg-[#302818] text-[#f1cf7c]" : "border-[#3f4652] text-[#9297a1] hover:border-[#e5b85c]"}`}>{entry.label} <span className="jp-serif ml-1 text-[#e5b85c]">{entry.jp}</span></Link>; })}</nav> : null}
  </div>;
}
