"use client";

import { useMemo } from "react";

import { useContentModule } from "@/components/content/use-content-module";
import type { LessonContentItem } from "@/lib/curriculum";

export function useLocalItems(_seed: LessonContentItem[]) {
  const module = useContentModule();
  return useMemo(() => [...module.vocabulary, ...module.kanji, ...module.grammar, ...module.readings, ...module.listening], [module]);
}
