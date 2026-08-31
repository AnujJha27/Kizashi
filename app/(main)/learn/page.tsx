import { LocalLesson } from "@/components/learning/local-lesson";
import { IrodoriPracticeCard } from "@/components/learning/irodori-practice-card";
import { n5Module, getCurrentLesson, getLessonItems } from "@/lib/curriculum";

export const metadata = { title: "Learn" };

export default async function LearnPage({ searchParams }: { searchParams: Promise<{ lesson?: string }> }) {
  const { lesson: requestedLessonId } = await searchParams;
  const lesson = n5Module.course.chapters.flatMap((chapter) => chapter.lessons).find((entry) => entry.id === requestedLessonId) ?? getCurrentLesson();

  return <><LocalLesson requestedLessonId={requestedLessonId} fallbackLesson={lesson ?? null} fallbackItems={lesson ? getLessonItems(lesson) : []} fallbackContrasts={n5Module.grammarContrasts} /><div className="mx-auto max-w-5xl px-4 pb-8"><IrodoriPracticeCard itemIds={lesson?.itemIds ?? []} /></div></>;
}
