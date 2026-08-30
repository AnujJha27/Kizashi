"use client";

import { useContentModule } from "@/components/content/use-content-module";
import { EntryDetail } from "@/components/library/entry-detail";
import type { LessonContentItem } from "@/lib/curriculum";
import { getModuleItems } from "@/lib/content-validation";
import type { GrammarContrast } from "@/lib/types";
import { StatusPanel } from "@/components/ui/status-panel";

export function LocalEntry({ id, fallbackItem, fallbackContrasts }: Readonly<{ id: string; fallbackItem: LessonContentItem | undefined; fallbackContrasts: GrammarContrast[] }>) {
  const module = useContentModule();
  const item = getModuleItems(module).find((entry) => entry.id === id) ?? fallbackItem ?? null;
  const contrasts = module.grammarContrasts.length ? module.grammarContrasts : fallbackContrasts;

  if (!item) return <StatusPanel eyebrow="Entry not found" title="That path has not been mapped yet." description="Return to the Library and choose another entry." tone="error" />;
  return <EntryDetail item={item} contrasts={contrasts} vocabulary={module.vocabulary} kanji={module.kanji} />;
}
