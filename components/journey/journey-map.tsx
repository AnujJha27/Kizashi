"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { JourneyNode } from "@/lib/types";
import { InkField } from "@/components/journey/ink-field";
import { Landscape } from "@/components/journey/landscape";
import { readReviewRecords, type ReviewRecord } from "@/lib/session";

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

export function JourneyMap({ nodes }: Readonly<{ nodes: JourneyNode[] }>) {
  const [records, setRecords] = useState<Record<string, ReviewRecord> | null>(null);

  useEffect(() => {
    const refresh = () => setRecords(readReviewRecords());
    refresh();
    window.addEventListener("michi-review-updated", refresh);
    return () => window.removeEventListener("michi-review-updated", refresh);
  }, []);
  const lessonStatus = (node: JourneyNode, index: number) => {
    if (!records || node.kind !== "lesson" || !node.itemIds?.length) return node.status;
    const prerequisitesMet = (node.prerequisiteIds ?? []).every((itemId) => Boolean(records[itemId]));
    if (!prerequisitesMet && node.status === "available") return "locked";
    const learned = node.itemIds.filter((itemId) => records[itemId]).length;
    const mastered = node.itemIds.filter((itemId) => records[itemId]?.masteryState === "strong" || (records[itemId]?.streak ?? 0) >= 4).length;
    if (node.status === "locked") return node.status;
    if (node.status === "learned") return mastered === node.itemIds.length ? "mastered" as const : node.status;
    if (mastered === node.itemIds.length) return "mastered" as const;
    if (learned === node.itemIds.length) return "learned" as const;
    if (node.status === "current") return "current" as const;
    const previousLesson = [...nodes.slice(0, index)].reverse().find((entry) => entry.kind === "lesson");
    const previousComplete = previousLesson?.itemIds?.length && previousLesson.itemIds.every((itemId) => records[itemId]);
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

  return (
    <div className="journey-map relative overflow-hidden rounded-2xl border border-[#292b31] px-5 py-8 sm:px-10">
      <InkField />
      <Landscape />
      <div className="relative z-10 max-w-xl">
        <div className="mb-8 flex items-center justify-between">
          <div><p className="eyebrow">旅の道 · the path</p><p className="jp-serif mt-1 text-sm text-[#9297a1]">静かに、ひとつずつ</p></div>
          <span className="seal" aria-label="N5 pass path"><span>N5</span><small>道</small></span>
        </div>
        <div className="space-y-0">
          {visibleNodes.map((node, index) => {
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
                {index < nodes.length - 1 ? <span className="journey-line absolute left-[17px] top-12 h-8 w-px" aria-hidden="true" /> : null}
                {isLink ? <Link href={node.href!} className="block rounded-xl hover:bg-[#17181d]">{content}</Link> : <div>{content}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
