import { LocalLesson } from "@/components/learning/local-lesson";
import { IrodoriPracticeCard } from "@/components/learning/irodori-practice-card";
import { MarugotoPracticeCard } from "@/components/learning/marugoto-practice-card";
import { getCurriculumForTarget, getCurrentLesson, getLessonItems, n5Module } from "@/lib/curriculum";
import type { TargetLevel } from "@/lib/types";

export const metadata = { title: "Learn" };

export default async function LearnPage({ searchParams }: { searchParams: Promise<{ lesson?: string; level?: string }> }) {
  const { lesson: requestedLessonId, level: requestedLevel } = await searchParams;
  const targetLevel: TargetLevel = requestedLevel === "N4" ? "N4" : "N5";
  const targetModule = getCurriculumForTarget(n5Module, targetLevel);
  const lesson = targetModule.course.chapters.flatMap((chapter) => chapter.lessons).find((entry) => entry.id === requestedLessonId) ?? (targetLevel === "N5" ? getCurrentLesson() : targetModule.course.chapters.flatMap((chapter) => chapter.lessons)[0] ?? null);

  return <><LocalLesson initialTargetLevel={targetLevel} requestedLessonId={requestedLessonId} fallbackLesson={lesson ?? null} fallbackItems={lesson ? getLessonItems(lesson) : []} fallbackContrasts={targetModule.grammarContrasts} /><div className="mx-auto max-w-5xl px-4 pb-8"><IrodoriPracticeCard itemIds={lesson?.itemIds ?? []} /><MarugotoPracticeCard itemIds={lesson?.itemIds ?? []} /></div></>;
}
