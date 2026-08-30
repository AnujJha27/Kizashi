import Link from "next/link";

import { ReferenceCharts } from "@/components/reference/reference-charts";
import { n5Module } from "@/lib/curriculum";

export const metadata = { title: "Reference" };

export default function ReferencePage() {
  return <div className="mx-auto max-w-6xl"><div className="mb-6"><Link href="/practice" className="text-sm text-[#e5b85c] hover:text-[#f1cf7c]">← Back to practice</Link></div><div className="mb-8"><p className="eyebrow mb-3">Reference · 参照</p><h1 className="jp-serif text-4xl tracking-tight text-[#f5f5f2]">A quiet shelf for looking things up.</h1><p className="mt-2 max-w-2xl text-sm leading-7 text-[#9297a1]">Kana charts and curriculum kanji live here, separate from active recall.</p></div><ReferenceCharts kanji={n5Module.kanji} /></div>;
}
