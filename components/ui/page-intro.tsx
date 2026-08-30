import Link from "next/link";

export function PageIntro({
  eyebrow,
  title,
  description,
  action,
}: Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  action?: { label: string; href: string };
}>) {
  return (
    <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-4">
        <span className="jp-serif hidden pt-1 text-2xl text-[#e34a3f] sm:block" aria-hidden="true">道</span>
        <div>
        <p className="eyebrow mb-3">{eyebrow}</p>
        <h1 className="jp-serif text-3xl tracking-tight text-[#f5f5f2] sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-xl text-sm text-[#9297a1]">{description}</p>
        </div>
      </div>
      {action ? <Link href={action.href} className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#e34a3f] px-4 py-3 text-sm font-semibold text-[#0b0b0d] hover:bg-[#ef675d]">{action.label}<span aria-hidden="true">→</span></Link> : null}
    </div>
  );
}
