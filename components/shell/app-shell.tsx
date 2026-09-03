"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type MouseEvent } from "react";
import { CommandPalette } from "@/components/shell/command-palette";
import { AccountSync } from "@/components/profile/account-sync";
import { readDisplayName } from "@/lib/session";

const primaryNavItems = [
  { href: "/journey", label: "Today", shortLabel: "Today", jpLabel: "今日", mark: "◈" },
  { href: "/practice", label: "Practice", shortLabel: "Drill", jpLabel: "練習", mark: "◆" },
  { href: "/immersion", label: "Immersion", shortLabel: "Listen", jpLabel: "聞く", mark: "耳" },
  { href: "/library", label: "Library", shortLabel: "Library", jpLabel: "本棚", mark: "本" },
];

const secondaryNavItems = [
  { href: "/learn", label: "Learn", shortLabel: "Study", jpLabel: "学ぶ", mark: "文" },
  { href: "/review", label: "Review", shortLabel: "Review", jpLabel: "復習", mark: "↻" },
  { href: "/mistakes", label: "Mistakes", shortLabel: "Mistakes", jpLabel: "弱点", mark: "!" },
  { href: "/books", label: "Books", shortLabel: "Shelf", jpLabel: "参考", mark: "冊" },
  { href: "/reference", label: "Reference", shortLabel: "Charts", jpLabel: "手引き", mark: "字" },
  { href: "/progress", label: "Progress", shortLabel: "Progress", jpLabel: "歩み", mark: "〽" },
  { href: "/studio", label: "Studio", shortLabel: "Studio", jpLabel: "編集", mark: "✎" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/journey" && pathname.startsWith(`${href}/`));
}

export function AppShell({ children, isAdmin }: Readonly<{ children: React.ReactNode; isAdmin: boolean }>) {
  const pathname = usePathname();
  const [displayName, setDisplayName] = useState("");
  const [secondaryOpen, setSecondaryOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const visibleSecondaryItems = isAdmin ? secondaryNavItems : secondaryNavItems.filter((item) => item.href !== "/studio");
  const secondaryActive = visibleSecondaryItems.some((item) => isActive(pathname, item.href));

  useEffect(() => {
    const refresh = () => setDisplayName(readDisplayName());
    refresh();
    window.addEventListener("michi-profile-updated", refresh);
    return () => window.removeEventListener("michi-profile-updated", refresh);
  }, []);

  useEffect(() => {
    setSecondaryOpen(false);
    setNavigating(false);
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setSecondaryOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pathname]);

  useEffect(() => {
    if (!navigating) return;
    const timeout = window.setTimeout(() => setNavigating(false), 12000);
    return () => window.clearTimeout(timeout);
  }, [navigating]);

  const showNavigationFeedback = (event: MouseEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as HTMLElement).closest("a");
    const href = link?.getAttribute("href");
    if (!link || !href || !href.startsWith("/") || link.target === "_blank") return;
    if (new URL(href, window.location.origin).pathname !== pathname) setNavigating(true);
  };

  return (
    <div className="app-shell min-h-screen lg:flex" onClickCapture={showNavigationFeedback}>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 self-start overflow-y-auto flex-col border-r border-[#617486]/45 px-5 py-6 lg:flex">
        <div className="mb-8 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#172b3a]/45 px-3 py-3 shadow-[0_14px_35px_rgba(5,12,20,.16)]">
          <div className="relative grid size-10 place-items-center rounded-xl bg-[#e34a3f] text-sm font-bold text-[#0b0b0d] shadow-[0_8px_24px_rgba(227,74,63,.22)]"><span>道</span><span className="absolute -right-1 -top-2 text-[10px] text-[#e5b85c]">✦</span></div>
          <div>
            <p className="text-[15px] font-semibold tracking-[.2em]">KIZASHI</p>
            <p className="jp-serif text-[11px] tracking-[.16em] text-[#e5b85c]">日本語の道</p>
          </div>
        </div>

        <nav aria-label="Main navigation" className="relative space-y-1 pl-2">
          <span className="absolute bottom-3 left-0 top-3 w-px bg-gradient-to-b from-[#e34a3f] via-[#e5b85c] to-transparent" aria-hidden="true" />
          {primaryNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={`relative flex items-center gap-3 rounded-xl border-l-2 px-3 py-3 text-sm ${isActive(pathname, item.href) ? "border-[#e34a3f] bg-[#4a2e34]/80 text-[#f5f5f2] shadow-[0_8px_24px_rgba(227,74,63,.1)]" : "border-transparent text-[#c3c7ce] hover:bg-[#253747]/70 hover:text-[#f5f5f2]"}`}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
            >
              <span className="sidebar-station" aria-hidden="true" />
              <span className={`grid size-7 place-items-center rounded-lg text-xs ${isActive(pathname, item.href) ? "bg-[#e34a3f] text-[#0b0b0d]" : "bg-[#203747]/80 text-[#e5b85c]"}`} aria-hidden="true">{item.mark}</span>
              <span>{item.label}</span>
              <span className="jp-serif ml-auto text-xs text-[#9db4bd]">{item.jpLabel}</span>
            </Link>
          ))}
          <div className="relative">
            <button type="button" onClick={() => setSecondaryOpen((open) => !open)} aria-expanded={secondaryOpen} aria-controls="secondary-navigation" className={`relative flex w-full items-center gap-3 rounded-xl border-l-2 px-3 py-3 text-sm ${secondaryOpen || secondaryActive ? "border-[#e34a3f] bg-[#4a2e34]/80 text-[#f5f5f2]" : "border-transparent text-[#c3c7ce] hover:bg-[#253747]/70 hover:text-[#f5f5f2]"}`}>
              <span className="sidebar-station" aria-hidden="true" />
              <span className={`grid size-7 place-items-center rounded-lg text-xs ${secondaryOpen || secondaryActive ? "bg-[#e34a3f] text-[#0b0b0d]" : "bg-[#203747]/80 text-[#e5b85c]"}`} aria-hidden="true">…</span>
              <span>More</span>
              <span className="jp-serif ml-auto text-xs text-[#9db4bd]">その他</span>
            </button>
            {secondaryOpen ? <div id="secondary-navigation" className="absolute left-0 right-0 top-full z-50 mt-1 rounded-2xl border border-[#4b3a29] bg-[#111216]/95 p-2 shadow-2xl backdrop-blur-xl">{visibleSecondaryItems.map((item) => <Link key={item.href} prefetch={false} href={item.href} onClick={() => setSecondaryOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm ${isActive(pathname, item.href) ? "bg-[#3a2023] text-[#f5f5f2]" : "text-[#c3c7ce] hover:bg-[#211d18] hover:text-[#f5f5f2]"}`}><span className="grid size-7 place-items-center rounded-lg bg-[#203747]/80 text-xs text-[#e5b85c]" aria-hidden="true">{item.mark}</span><span>{item.label}</span><span className="jp-serif ml-auto text-xs text-[#9db4bd]">{item.jpLabel}</span></Link>)}</div> : null}
          </div>
        </nav>

        <div className="mt-auto space-y-4">
          <div className="rounded-2xl border border-[#617486]/50 bg-gradient-to-br from-[#23445a]/80 via-[#1b3041]/70 to-[#302533]/70 p-4 shadow-[0_12px_30px_rgba(0,0,0,.14)]">
            <div className="flex items-center justify-between"><p className="eyebrow">Next stop · 次の駅</p><span className="jp-serif text-lg text-[#e5b85c]">一</span></div>
            <p className="mt-2 text-sm font-medium text-[#f5f5f2]">A small step is enough.</p>
            <p className="mt-1 text-xs leading-5 text-[#c3c7ce]">Keep the N5 path warm with a five-minute drill.</p>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10"><span className="block h-full w-1/3 rounded-full bg-gradient-to-r from-[#e34a3f] to-[#e5b85c]" /></div>
            <Link prefetch={false} href="/practice?mode=quick&duration=5" className="mt-3 inline-flex text-xs font-semibold text-[#e5b85c] hover:text-[#f1cf7c]">Begin today&apos;s path <span className="ml-2" aria-hidden="true">→</span></Link>
          </div>
          <div className="border-t border-[#292b31] px-2 pt-4"><p className="text-xs text-[#9297a1]">N5 foundations</p><p className="mt-1 text-[10px] uppercase tracking-[.14em] text-[#676c75]">learn · review · return</p></div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="app-header flex h-16 items-center justify-between border-b border-[#292b31] px-5 lg:px-10">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="grid size-8 place-items-center rounded-lg bg-[#e34a3f] text-xs font-bold text-[#0b0b0d]">道</div>
            <span className="text-xs font-semibold tracking-[.2em]">KIZASHI</span>
          </div>
          <div className="hidden text-xs text-[#676c75] lg:block"><span className="jp-serif text-[#e5b85c]">はじまり</span><span className="px-2 text-[#292b31]">/</span>N5 Foundations</div>
          <div className="ml-auto flex items-center gap-3"><CommandPalette isAdmin={isAdmin} /><Link prefetch={false} href="/profile" className="flex items-center gap-2 rounded-full text-xs text-[#9297a1] hover:text-[#f5f5f2]" aria-label="Open profile">
            <span className="grid size-8 place-items-center rounded-full border border-[#4b3a29] bg-[#211d18] text-[#e5b85c]">人</span>
            <span className="hidden max-w-36 truncate sm:block">{displayName || "Your path"}</span>
          </Link></div>
        </header>

        <main className="relative z-10 min-w-0 overflow-x-clip safe-bottom min-h-[calc(100vh-4rem)] px-5 py-7 lg:px-10 lg:py-10">{children}<AccountSync visible={pathname === "/profile"} /></main>

        {secondaryOpen ? <button type="button" aria-label="Close more navigation" onClick={() => setSecondaryOpen(false)} className="fixed inset-0 z-30 bg-[#07080c]/45 lg:hidden" /> : null}
        {secondaryOpen ? <div id="mobile-secondary-navigation" className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-50 rounded-2xl border border-[#4b3a29] bg-[#111216]/95 p-2 shadow-2xl backdrop-blur-xl lg:hidden">{visibleSecondaryItems.map((item) => <Link key={item.href} prefetch={false} href={item.href} onClick={() => setSecondaryOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm ${isActive(pathname, item.href) ? "bg-[#3a2023] text-[#f5f5f2]" : "text-[#c3c7ce] hover:bg-[#211d18] hover:text-[#f5f5f2]"}`}><span className="grid size-7 place-items-center rounded-lg bg-[#203747]/80 text-xs text-[#e5b85c]" aria-hidden="true">{item.mark}</span><span>{item.label}</span><span className="jp-serif ml-auto text-xs text-[#9db4bd]">{item.jpLabel}</span></Link>)}</div> : null}
        <nav aria-label="Mobile navigation" className="app-mobile-nav fixed inset-x-0 bottom-0 z-40 min-w-0 max-w-[100vw] overflow-x-hidden border-t border-[#292b31] px-1 pb-[env(safe-area-inset-bottom)] lg:hidden">
          <div className="mx-auto grid w-full max-w-lg min-w-0 grid-cols-5">
            {primaryNavItems.map((item) => (
              <Link key={item.href} prefetch={false} href={item.href} className={`flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 overflow-hidden px-1 text-[10px] ${isActive(pathname, item.href) ? "text-[#f5f5f2]" : "text-[#676c75]"}`} aria-current={isActive(pathname, item.href) ? "page" : undefined}>
                <span className={`grid size-7 place-items-center rounded-lg text-xs ${isActive(pathname, item.href) ? "bg-[#e34a3f] text-[#0b0b0d]" : "bg-[#1e2026]"}`} aria-hidden="true">{item.mark}</span>
                <span className="max-w-full truncate jp-serif text-[11px]">{item.jpLabel}</span><span className="max-w-full truncate text-[9px]">{item.shortLabel}</span>
              </Link>
            ))}
            <button type="button" onClick={() => setSecondaryOpen((open) => !open)} aria-expanded={secondaryOpen} aria-controls="mobile-secondary-navigation" className={`flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 overflow-hidden px-1 text-[10px] ${secondaryOpen || secondaryActive ? "text-[#f5f5f2]" : "text-[#676c75]"}`}>
              <span className={`grid size-7 place-items-center rounded-lg text-xs ${secondaryOpen || secondaryActive ? "bg-[#e34a3f] text-[#0b0b0d]" : "bg-[#1e2026]"}`} aria-hidden="true">…</span>
              <span className="max-w-full truncate jp-serif text-[11px]">その他</span><span className="max-w-full truncate text-[9px]">More</span>
            </button>
          </div>
        </nav>
      </div>
      {navigating ? <div className="pointer-events-none fixed inset-x-0 top-0 z-[200] flex justify-center p-3" role="status" aria-live="polite"><div className="rounded-full border border-[#e5b85c]/60 bg-[#111216]/95 px-4 py-2 text-xs font-semibold text-[#f1cf7c] shadow-2xl backdrop-blur-xl">Loading the next stop…</div></div> : null}
    </div>
  );
}
