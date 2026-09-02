"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const commands = [
  { label: "Study now", detail: "Continue the current lesson", href: "/learn" },
  { label: "Start review", detail: "Open due memory reviews", href: "/review" },
  { label: "Quick practice", detail: "Five-minute mixed drill", href: "/practice?mode=quick&duration=5" },
  { label: "Kanji drills", detail: "Readings, meanings, and useful-word recall", href: "/practice?mode=kanji" },
  { label: "Kana foundations", detail: "Build Hiragana and Katakana recall", href: "/practice/kana" },
  { label: "Pass N5", detail: "Adaptive mixed JLPT preparation", href: "/practice?mode=pass" },
  { label: "Mini test", detail: "Ten timed questions across the N5 skills", href: "/practice?mode=mini" },
  { label: "Full mock", detail: "Timed N5 coverage run", href: "/practice?mode=full" },
  { label: "Search library", detail: "Find Japanese, meanings, or grammar", href: "/library" },
  { label: "Open reference", detail: "Kana and kanji charts", href: "/reference" },
  { label: "Add Japanese", detail: "Save a word to your personal shelf", href: "/library?add=1" },
  { label: "Open mistakes", detail: "Repair recurring misses", href: "/mistakes" },
  { label: "Content studio", detail: "Validate and export curriculum drafts", href: "/studio" },
  { label: "Open profile", detail: "Set pace and exam date", href: "/profile" },
];

type SearchResult = { id: string; group: string; label: string; detail: string; href: string };

export function CommandPalette({ isAdmin }: Readonly<{ isAdmin: boolean }>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const visibleCommands = isAdmin ? commands : commands.filter((command) => command.href !== "/studio");
  const filtered = visibleCommands.filter((command) => `${command.label} ${command.detail}`.toLowerCase().includes(query.toLowerCase().trim()));

  useEffect(() => {
    if (!open || !query.trim()) { setResults([]); return; }
    const controller = new AbortController();
    fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<SearchResult[]> : [])
      .then((value) => setResults(Array.isArray(value) ? value : []))
      .catch((error: unknown) => { if ((error as { name?: string }).name !== "AbortError") setResults([]); });
    return () => controller.abort();
  }, [open, query]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setOpen(true); }
      if (event.key.toLowerCase() === "a" && !["INPUT", "TEXTAREA", "SELECT"].includes((event.target as HTMLElement).tagName)) { event.preventDefault(); setOpen(true); setQuery("add"); }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const groups = [...new Set(results.map((result) => result.group))];
  return <>{<button type="button" onClick={() => { setOpen(true); setQuery(""); }} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#9297a1] hover:border-[#e5b85c]" aria-label="Open command palette"><span className="hidden lg:inline">⌘ K</span><span className="lg:hidden" aria-hidden="true">＋</span><span className="sr-only lg:hidden">Actions</span></button>}{open ? <div className="fixed inset-0 z-50 grid place-items-start bg-[#07080c]/75 px-5 pt-[12vh] backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}><section className="w-full max-w-xl overflow-hidden rounded-2xl border border-[#4b3a29] bg-[#111216] shadow-2xl" role="dialog" aria-modal="true" aria-label="Command palette"><div className="border-b border-[#292b31] p-4"><label><span className="sr-only">Search Japanese or commands</span><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Japanese or choose an action" className="w-full bg-transparent text-base text-[#f5f5f2] outline-none placeholder:text-[#676c75]" /></label></div><div className="max-h-[60vh] overflow-y-auto p-2">{query.trim() ? <>{groups.map((group) => <div key={group} className="mb-3"><p className="px-4 py-2 text-[10px] uppercase tracking-[.14em] text-[#e5b85c]">{group}</p>{results.filter((result) => result.group === group).map((result) => <Link key={`${result.group}-${result.id}`} href={result.href} onClick={() => setOpen(false)} className="flex items-center justify-between rounded-xl px-4 py-3 hover:bg-[#211d18]"><span><span className="block text-sm font-semibold text-[#f5f5f2]">{result.label}</span><span className="mt-0.5 block text-xs text-[#9297a1]">{result.detail}</span></span><span className="text-[#e5b85c]" aria-hidden="true">→</span></Link>)}</div>)}{filtered.length ? <div className="border-t border-white/10 pt-2"><p className="px-4 py-2 text-[10px] uppercase tracking-[.14em] text-[#676c75]">Actions</p>{filtered.map((command) => <Link key={command.href} href={command.href} onClick={() => setOpen(false)} className="flex items-center justify-between rounded-xl px-4 py-3 hover:bg-[#211d18]"><span><span className="block text-sm font-semibold text-[#f5f5f2]">{command.label}</span><span className="mt-0.5 block text-xs text-[#9297a1]">{command.detail}</span></span><span className="text-[#e5b85c]" aria-hidden="true">→</span></Link>)}</div> : null}{!results.length && !filtered.length ? <p className="px-4 py-6 text-center text-sm text-[#9297a1]">No Japanese content or action matches that search.</p> : null}</> : filtered.length ? filtered.map((command) => <Link key={command.href} href={command.href} onClick={() => setOpen(false)} className="flex items-center justify-between rounded-xl px-4 py-3 hover:bg-[#211d18]"><span><span className="block text-sm font-semibold text-[#f5f5f2]">{command.label}</span><span className="mt-0.5 block text-xs text-[#9297a1]">{command.detail}</span></span><span className="text-[#e5b85c]" aria-hidden="true">→</span></Link>) : <p className="px-4 py-6 text-center text-sm text-[#9297a1]">No command matches that search.</p>}</div><p className="border-t border-[#292b31] px-4 py-3 text-[10px] uppercase tracking-[.14em] text-[#676c75]">Esc to close · Ctrl K to open · A for add</p></section></div> : null}</>;
}
