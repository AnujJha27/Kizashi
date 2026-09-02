import { NextResponse } from "next/server";

import { n5Module } from "@/lib/curriculum";
import { getExternalResources } from "@/lib/external-resources";
import type { LessonContentItem } from "@/lib/curriculum";

type SearchResult = { id: string; group: string; label: string; detail: string; href: string };

function textFor(item: LessonContentItem) {
  if (item.category === "vocabulary") return [item.writtenForm, item.reading, ...item.meanings, ...item.tags].join(" ");
  if (item.category === "kanji") return [item.character, ...item.meanings, ...item.onyomi, ...item.kunyomi, ...item.tags].join(" ");
  if (item.category === "grammar") return [item.pattern, item.meaning, item.formation, item.intuition, ...item.tags].join(" ");
  if (item.category === "reading") return [item.title, item.passage, item.translation, ...item.tags].join(" ");
  return [item.title, item.situation, item.transcript, ...item.tags].join(" ");
}

function resultFor(item: LessonContentItem): SearchResult {
  if (item.category === "vocabulary") return { id: item.id, group: "Vocabulary", label: item.writtenForm, detail: `${item.reading} · ${item.meanings.slice(0, 2).join(" · ")}`, href: `/entry/${item.id}` };
  if (item.category === "kanji") return { id: item.id, group: "Kanji", label: item.character, detail: item.meanings.slice(0, 2).join(" · "), href: `/entry/${item.id}` };
  if (item.category === "grammar") return { id: item.id, group: "Grammar", label: item.pattern, detail: item.meaning, href: `/entry/${item.id}` };
  return { id: item.id, group: item.category === "reading" ? "Reading" : "Immersion", label: item.title, detail: item.category === "reading" ? item.translation : item.situation, href: `/entry/${item.id}` };
}

export function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim().toLocaleLowerCase() ?? "";
  if (query.length < 1) return NextResponse.json([]);
  const items = [...n5Module.vocabulary, ...n5Module.kanji, ...n5Module.grammar, ...n5Module.readings, ...n5Module.listening] as LessonContentItem[];
  const itemResults = items.filter((item) => textFor(item).toLocaleLowerCase().includes(query)).slice(0, 10).map(resultFor);
  const lessonResults = n5Module.course.chapters.flatMap((chapter) => chapter.lessons).filter((lesson) => [lesson.title, lesson.subtitle, lesson.description].join(" ").toLocaleLowerCase().includes(query)).slice(0, 3).map((lesson) => ({ id: lesson.id, group: "Lessons", label: lesson.title, detail: lesson.subtitle, href: `/learn?lesson=${encodeURIComponent(lesson.id)}` }));
  const sourceResults = getExternalResources().filter((resource) => [resource.name, resource.title, resource.description, ...(resource.tags ?? [])].filter(Boolean).join(" ").toLocaleLowerCase().includes(query)).slice(0, 3).map((resource) => ({ id: resource.id, group: resource.resourceType === "grammar-reference" ? "Reference" : "Immersion", label: resource.title ?? resource.name, detail: resource.description ?? "Provider-hosted resource", href: "/immersion" }));
  return NextResponse.json([...itemResults, ...lessonResults, ...sourceResults].slice(0, 12), { headers: { "Cache-Control": "private, max-age=60" } });
}
