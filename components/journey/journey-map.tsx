"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { JourneyNode, TargetLevel } from "@/lib/types";
import { InkField } from "@/components/journey/ink-field";
import { Landscape } from "@/components/journey/landscape";
import { readLessonState, readReviewRecords, type ReviewRecord } from "@/lib/session";

const statusLabel: Record<JourneyNode["status"], string> = {
  locked: "Locked",
  available: "Available",
  current: "Current lesson",
  learned: "Learned",
  mastered: "Mastered",
};

function nodeStatusLabel(node: JourneyNode) {
  if (node.kind === "course") return "Path overview";
  if (node.kind === "chapter" && node.status === "current") return "Current region";
  return statusLabel[node.status];
}

export function JourneyMap({ nodes, focusLessonId, targetLevel = "N5", world }: Readonly<{ nodes: JourneyNode[]; focusLessonId?: string; targetLevel?: TargetLevel; world?: { area: { id: string; title: string; japaneseTitle: string }; stage: { id: string; label: string } } }>) {
  const [records, setRecords] = useState<Record<string, ReviewRecord> | null>(null);

  useEffect(() => {
    const refresh = () => setRecords(readReviewRecords());
    refresh();
    window.addEventListener("michi-review-updated", refresh);
    window.addEventListener("michi-lesson-updated", refresh);
    return () => { window.removeEventListener("michi-review-updated", refresh); window.removeEventListener("michi-lesson-updated", refresh); };
  }, []);
  const lessonStatus = (node: JourneyNode, index: number) => {
    if (!records || node.kind !== "lesson" || !node.itemIds?.length) return node.status;
    const prerequisitesMet = (node.prerequisiteIds ?? []).every((itemId) => Boolean(records[itemId]));
    if (!prerequisitesMet && node.status === "available") return "locked";
    const learned = node.itemIds.filter((itemId) => records[itemId]).length;
    const mastered = node.itemIds.filter((itemId) => records[itemId]?.masteryState === "strong" || (records[itemId]?.streak ?? 0) >= 4).length;
    const lessonComplete = readLessonState(node.id).status === "complete";
    const previousLesson = [...nodes.slice(0, index)].reverse().find((entry) => entry.kind === "lesson");
    const previousComplete = Boolean(previousLesson?.itemIds?.length && (readLessonState(previousLesson.id).status === "complete" || previousLesson.itemIds.every((itemId) => records[itemId])));
    if (node.status === "locked" && !lessonComplete && !previousComplete) return node.status;
    if (lessonComplete && node.status === "locked") return mastered === node.itemIds.length ? "mastered" as const : "learned" as const;
    if (node.status === "locked") return "available";
    if (node.status === "learned") return mastered === node.itemIds.length ? "mastered" as const : node.status;
    if (mastered === node.itemIds.length) return "mastered" as const;
    if (learned === node.itemIds.length) return "learned" as const;
    if (node.status === "current") return "current" as const;
    return previousComplete ? "available" as const : node.status;
  };
  const lessonStatuses = new Map(nodes.map((node, index) => [node.id, lessonStatus(node, index)]));
  const visibleNodes = nodes.map((node, index) => {
    if (!records || node.kind === "course") return node;
    if (node.kind === "lesson") return { ...node, status: lessonStatuses.get(node.id) ?? node.status };
    if (node.kind !== "chapter") return node;
    const afterChapter = nodes.slice(index + 1);
    const nextChapterIndex = afterChapter.findIndex((entry) => entry.kind === "chapter");
    const chapterLessons = (nextChapterIndex < 0 ? afterChapter : afterChapter.slice(0, nextChapterIndex)).filter((entry) => entry.kind === "lesson");
    const statuses = chapterLessons.map((lesson) => lessonStatuses.get(lesson.id) ?? lesson.status);
    if (!statuses.length) return node;
    if (statuses.every((status) => status === "mastered")) return { ...node, status: "mastered" as const };
    if (statuses.every((status) => status === "learned" || status === "mastered")) return { ...node, status: "learned" as const };
    if (statuses.some((status) => status === "current" || status === "learned" || status === "mastered")) return { ...node, status: "current" as const };
    if (statuses.some((status) => status === "available")) return { ...node, status: "available" as const };
    return node;
  });
  const lessonIndexes = visibleNodes.flatMap((node, index) => node.kind === "lesson" ? [index] : []);
  const focusIndex = focusLessonId ? visibleNodes.findIndex((node) => node.id === focusLessonId) : lessonIndexes[0] ?? -1;
  const focusLessonPosition = Math.max(0, lessonIndexes.findIndex((index) => index === focusIndex));
  const windowLessonIndexes = lessonIndexes.slice(Math.max(0, focusLessonPosition - 3), focusLessonPosition + 4);
  const firstLessonIndex = windowLessonIndexes[0] ?? 0;
  const lastLessonIndex = windowLessonIndexes.at(-1) ?? Math.max(visibleNodes.length - 1, 0);
  const routeNodes = visibleNodes.slice(Math.max(0, firstLessonIndex - 1), Math.min(visibleNodes.length, lastLessonIndex + 2));
  const shownLessons = routeNodes.filter((node) => node.kind === "lesson").length;

  return (
    <div className="journey-map relative overflow-hidden rounded-2xl border border-[#292b31] px-5 py-8 sm:px-10" data-world-area={world?.area.id} data-world-stage={world?.stage.id}>
      <InkField />
      <Landscape areaId={world?.area.id} stageId={world?.stage.id} />
      <div className="relative z-10 max-w-xl">
        <div className="mb-8 flex items-center justify-between">
          <div><p className="eyebrow">{world?.area.japaneseTitle ?? "旅の道"} · the path</p><p className="jp-serif mt-1 text-sm text-[#9297a1]">{world?.area.title ?? "静かに、ひとつずつ"} · {world?.stage.label ?? "Arrival"}</p></div>
          <span className="seal" aria-label={`${targetLevel} pass path`}><span>{targetLevel}</span><small>道</small></span>
        </div>
        {lessonIndexes.length > shownLessons ? <p className="mb-4 text-xs text-[#676c75]">Showing the current lesson and up to three nearby lessons. <Link href="/learn" className="text-[#e5b85c] hover:text-[#f1cf7c]">View all lessons →</Link></p> : null}
        <div className="space-y-0">
          {routeNodes.map((node, index) => {
            const isLink = Boolean(node.href) && node.status !== "locked";
            const isActiveLesson = node.kind === "lesson" && node.status === "current";
            const content = (
              <div className="flex items-center gap-4 py-3">
                <span className={`relative z-10 grid size-9 shrink-0 place-items-center rounded-full border text-xs ${isActiveLesson ? "journey-marker border-[#e34a3f] bg-[#e34a3f] font-bold text-[#0b0b0d]" : node.status === "available" || node.status === "current" ? "border-[#e5b85c] bg-[#211d18] text-[#e5b85c]" : node.status === "mastered" ? "border-[#e5b85c] bg-[#302818] font-bold text-[#f1cf7c]" : node.status === "learned" ? "border-[#6fb98f] bg-[#17231d] text-[#6fb98f]" : "border-[#3b3d44] bg-[#17181d] text-[#676c75]"}`} aria-hidden="true">{node.kind === "course" ? "道" : node.status === "locked" ? "·" : node.status === "mastered" ? "✦" : index}</span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm font-medium ${node.status === "locked" ? "text-[#676c75]" : "text-[#f5f5f2]"}`}>{node.label}</span>
                  <span className="mt-0.5 block text-xs capitalize text-[#676c75]">{node.detail}</span>
                </span>
                <span className="hidden text-[10px] uppercase tracking-[.12em] text-[#676c75] sm:block">{nodeStatusLabel(node)}</span>
              </div>
            );
            return (
              <div key={node.id} className="relative">
                {index < routeNodes.length - 1 ? <span className="journey-line absolute left-[17px] top-12 h-8 w-px" aria-hidden="true" /> : null}
                {isLink ? <Link href={node.href!} className="block rounded-xl hover:bg-[#17181d]">{content}</Link> : <div>{content}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
