"use client";

import dynamic from "next/dynamic";

import type { PracticeMode, TargetLevel } from "@/lib/types";

const LazyLocalPractice = dynamic(() => import("@/components/practice/local-practice").then((module) => module.LocalPractice), {
  ssr: false,
  loading: () => <div className="min-h-80 animate-pulse rounded-xl bg-[#17181d]" aria-label="Loading practice" />,
});

export function LazyPractice({ mode, duration, focus, section, topic, targetLevel }: Readonly<{ mode: PracticeMode; duration: number; focus?: string; section?: string; topic?: string; targetLevel: TargetLevel }>) {
  return <LazyLocalPractice mode={mode} duration={duration} focus={focus} section={section} topic={topic} targetLevel={targetLevel} />;
}
