import { LocalEntry } from "@/components/library/local-entry";
import { n5Module } from "@/lib/curriculum";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = [...n5Module.vocabulary, ...n5Module.kanji, ...n5Module.grammar, ...n5Module.readings, ...n5Module.listening].find((entry) => entry.id === id);
  return { title: item?.title ?? "Entry" };
}

export default async function EntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = [...n5Module.vocabulary, ...n5Module.kanji, ...n5Module.grammar, ...n5Module.readings, ...n5Module.listening].find((entry) => entry.id === id);
  return <LocalEntry id={id} fallbackItem={item} fallbackContrasts={n5Module.grammarContrasts} />;
}
