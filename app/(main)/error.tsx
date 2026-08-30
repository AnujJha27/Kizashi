"use client";

export default function Error({ error, reset }: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  return <div className="mx-auto max-w-2xl py-16"><section className="surface-panel border-[#713b37] p-8" role="alert"><p className="eyebrow text-[#e34a3f]">A quiet interruption</p><h1 className="mt-3 text-2xl font-medium">This part of the path did not load.</h1><p className="mt-3 text-sm leading-6 text-[#9297a1]">{error.message || "Try the page again."}</p><button type="button" onClick={reset} className="mt-7 rounded-xl bg-[#e34a3f] px-4 py-3 text-sm font-semibold text-[#0b0b0d]">Try again</button></section></div>;
}
