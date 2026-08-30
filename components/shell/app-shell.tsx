"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CommandPalette } from "@/components/shell/command-palette";
import { readDisplayName } from "@/lib/session";

const navItems = [
  { href: "/journey", label: "Journey", shortLabel: "Path", jpLabel: "道", mark: "◈" },
  { href: "/learn", label: "Learn", shortLabel: "Study", jpLabel: "学ぶ", mark: "文" },
  { href: "/practice", label: "Practice", shortLabel: "Drill", jpLabel: "練習", mark: "◆" },
  { href: "/review", label: "Review", shortLabel: "Review", jpLabel: "復習", mark: "↻" },
  { href: "/mistakes", label: "Mistakes", shortLabel: "Mistakes", jpLabel: "弱点", mark: "!" },
  { href: "/library", label: "Library", shortLabel: "Library", jpLabel: "本棚", mark: "本" },
  { href: "/books", label: "Books", shortLabel: "Shelf", jpLabel: "参考", mark: "冊" },
  { href: "/reference", label: "Reference", shortLabel: "Charts", jpLabel: "手引き", mark: "字" },
  { href: "/progress", label: "Progress", shortLabel: "Progress", jpLabel: "歩み", mark: "〽" },
  { href: "/profile", label: "Profile", shortLabel: "Profile", jpLabel: "自分", mark: "人" },
  { href: "/studio", label: "Studio", shortLabel: "Studio", jpLabel: "編集", mark: "✎" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/journey" && pathname.startsWith(`${href}/`));
}

export function AppShell({ children, isAdmin }: Readonly<{ children: React.ReactNode; isAdmin: boolean }>) {
  const pathname = usePathname();
  const [displayName, setDisplayName] = useState("");
  const visibleNavItems = isAdmin ? navItems : navItems.filter((item) => item.href !== "/studio");
  const mobileItems = visibleNavItems.filter((item) => ["/journey", "/learn", "/practice", "/review", "/profile"].includes(item.href));

  useEffect(() => {
    const refresh = () => setDisplayName(readDisplayName());
    refresh();
    window.addEventListener("michi-profile-updated", refresh);
    return () => window.removeEventListener("michi-profile-updated", refresh);
  }, []);

  return (
    <div className="app-shell min-h-screen lg:flex">
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
          {visibleNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 rounded-xl border-l-2 px-3 py-3 text-sm ${isActive(pathname, item.href) ? "border-[#e34a3f] bg-[#4a2e34]/80 text-[#f5f5f2] shadow-[0_8px_24px_rgba(227,74,63,.1)]" : "border-transparent text-[#c3c7ce] hover:bg-[#253747]/70 hover:text-[#f5f5f2]"}`}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
            >
              <span className="sidebar-station" aria-hidden="true" />
              <span className={`grid size-7 place-items-center rounded-lg text-xs ${isActive(pathname, item.href) ? "bg-[#e34a3f] text-[#0b0b0d]" : "bg-[#203747]/80 text-[#e5b85c]"}`} aria-hidden="true">{item.mark}</span>
              <span>{item.label}</span>
              <span className="jp-serif ml-auto text-xs text-[#9db4bd]">{item.jpLabel}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto space-y-4">
          <div className="rounded-2xl border border-[#617486]/50 bg-gradient-to-br from-[#23445a]/80 via-[#1b3041]/70 to-[#302533]/70 p-4 shadow-[0_12px_30px_rgba(0,0,0,.14)]">
            <div className="flex items-center justify-between"><p className="eyebrow">Next stop · 次の駅</p><span className="jp-serif text-lg text-[#e5b85c]">一</span></div>
            <p className="mt-2 text-sm font-medium text-[#f5f5f2]">A small step is enough.</p>
            <p className="mt-1 text-xs leading-5 text-[#c3c7ce]">Keep the N5 path warm with a five-minute drill.</p>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10"><span className="block h-full w-1/3 rounded-full bg-gradient-to-r from-[#e34a3f] to-[#e5b85c]" /></div>
            <Link href="/practice?mode=quick&duration=5" className="mt-3 inline-flex text-xs font-semibold text-[#e5b85c] hover:text-[#f1cf7c]">Begin today&apos;s path <span className="ml-2" aria-hidden="true">→</span></Link>
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
          <div className="ml-auto flex items-center gap-3"><CommandPalette isAdmin={isAdmin} /><Link href="/profile" className="flex items-center gap-2 rounded-full text-xs text-[#9297a1] hover:text-[#f5f5f2]" aria-label="Open profile">
            <span className="grid size-8 place-items-center rounded-full border border-[#4b3a29] bg-[#211d18] text-[#e5b85c]">人</span>
            <span className="hidden max-w-36 truncate sm:block">{displayName || "Your path"}</span>
          </Link></div>
        </header>

        <main className="safe-bottom min-h-[calc(100vh-4rem)] px-5 py-7 lg:px-10 lg:py-10">{children}</main>

        <nav aria-label="Mobile navigation" className="app-mobile-nav fixed inset-x-0 bottom-0 z-20 min-w-0 max-w-[100vw] overflow-x-hidden border-t border-[#292b31] px-1 pb-[env(safe-area-inset-bottom)] lg:hidden">
          <div className="mx-auto grid w-full max-w-lg min-w-0 grid-cols-5">
            {mobileItems.map((item) => (
              <Link key={item.href} href={item.href} className={`flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 overflow-hidden px-1 text-[10px] ${isActive(pathname, item.href) ? "text-[#f5f5f2]" : "text-[#676c75]"}`} aria-current={isActive(pathname, item.href) ? "page" : undefined}>
                <span className={`grid size-7 place-items-center rounded-lg text-xs ${isActive(pathname, item.href) ? "bg-[#e34a3f] text-[#0b0b0d]" : "bg-[#1e2026]"}`} aria-hidden="true">{item.mark}</span>
                <span className="max-w-full truncate jp-serif text-[11px]">{item.jpLabel}</span><span className="max-w-full truncate text-[9px]">{item.shortLabel}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
