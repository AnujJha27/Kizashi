import { MistakeNotebook } from "@/components/mistakes/mistake-notebook";
import { n5Module } from "@/lib/curriculum";

export const metadata = { title: "Mistakes" };

export default function MistakesPage() {
  const items = [...n5Module.vocabulary, ...n5Module.kanji, ...n5Module.grammar, ...n5Module.readings, ...n5Module.listening];
  return <div className="mx-auto max-w-5xl"><div className="mb-8"><p className="eyebrow mb-3">Mistakes · targeted repair</p><h1 className="jp-serif text-3xl tracking-tight text-[#f5f5f2] sm:text-4xl">Let the wrong answers teach you.</h1><p className="mt-2 max-w-xl text-sm text-[#9297a1]">A private notebook of the concepts that need another pass, without shame or noise.</p></div><section className="surface-panel overflow-hidden p-7 sm:p-10"><MistakeNotebook items={items} grammarContrasts={n5Module.grammarContrasts} /></section></div>;
}
