import Link from "next/link";

import { PageIntro } from "@/components/ui/page-intro";

export function PlaceholderPage({
  eyebrow,
  title,
  description,
  japanese,
  action,
  detail,
}: Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  japanese: string;
  action: { label: string; href: string };
  detail: string;
}>) {
  return (
    <div className="mx-auto max-w-5xl">
      <PageIntro eyebrow={eyebrow} title={title} description={description} />
      <section className="surface-panel relative overflow-hidden p-7 sm:p-10">
        <div className="quiet-grid pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative max-w-2xl">
          <div className="mb-8 flex items-center gap-3 text-[10px] uppercase tracking-[.16em] text-[#676c75]"><span className="h-px w-8 bg-[#e34a3f]" /><span>N5 · 旅のしおり</span></div>
          <p className="jp-serif text-5xl text-[#e5b85c]/90 sm:text-7xl">{japanese}</p>
          <p className="mt-6 text-sm leading-7 text-[#9297a1]">{detail}</p>
          <Link href={action.href} className="mt-8 inline-flex items-center gap-2 rounded-xl border border-[#5d3936] bg-[#21191a] px-4 py-3 text-sm font-semibold text-[#f5f5f2] hover:border-[#e34a3f] hover:bg-[#2a1b1b]">{action.label}<span aria-hidden="true">→</span></Link>
        </div>
      </section>
    </div>
  );
}
