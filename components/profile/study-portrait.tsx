"use client";

import { useEffect, useState } from "react";

import { getJourneyWorldState } from "@/lib/journey-world-core.js";
import { readExamPlanPreferences, readLessonState, readReviewRecords } from "@/lib/session";

export function StudyPortrait({ level, rhythm }: Readonly<{ level: number; rhythm: number }>) {
  const [world, setWorld] = useState(() => getJourneyWorldState());
  const safeLevel = Math.max(1, level);
  const chapter = Math.floor((safeLevel - 1) / 3) + 1;
  const chapterProgress = (((safeLevel - 1) % 3) + 1) / 3 * 100;
  const lanterns = Math.min(6, Math.max(1, Math.ceil(safeLevel / 2)));
  const lights = Math.min(8, Math.max(1, rhythm));
  const livedIn = world.stage.id === "lived-in" || world.stage.id === "settled";
  const settled = world.stage.id === "settled";

  useEffect(() => {
    const refresh = () => setWorld(getJourneyWorldState({ lessonId: readLessonState().lessonId, records: readReviewRecords(), targetLevel: readExamPlanPreferences().targetLevel }));
    refresh();
    window.addEventListener("michi-lesson-updated", refresh);
    window.addEventListener("michi-profile-updated", refresh);
    window.addEventListener("michi-review-updated", refresh);
    return () => { window.removeEventListener("michi-lesson-updated", refresh); window.removeEventListener("michi-profile-updated", refresh); window.removeEventListener("michi-review-updated", refresh); };
  }, []);

  const sceneLabel = `${world.area.japaneseTitle} · ${world.area.title} · ${world.stage.label}`;

  return (
    <div className="study-portrait relative overflow-hidden rounded-2xl border border-[#617486]/55 bg-[#102536] shadow-[0_22px_55px_rgba(3,10,18,.24)]" role="img" aria-label={"Journey portrait, level " + safeLevel + ", " + rhythm + " day rhythm, " + sceneLabel}>
      <img src={world.area.visualAssets.portrait} alt="" width={2172} height={724} className="h-60 w-full object-cover" style={{ objectPosition: world.area.focalPoint.desktop }} onError={(event) => { event.currentTarget.hidden = true; }} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0d1725]/15 via-transparent to-[#0c1723]/90" />
      <div className={`pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0b0b0d]/70 to-transparent ${settled ? "opacity-90" : livedIn ? "opacity-70" : "opacity-45"}`} />
      <div className="pointer-events-none absolute inset-x-0 bottom-5 flex items-end justify-center gap-4" aria-hidden="true">
        {Array.from({ length: lights }, (_, index) => <span key={index} className="size-1.5 rounded-full bg-[#f1cf7c] shadow-[0_0_12px_#f1cf7c]" style={{ transform: `translateY(${index * -3}px)`, opacity: index % 3 === 0 ? 1 : .7 }} />)}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-14 flex justify-center gap-5" aria-hidden="true">
        {Array.from({ length: lanterns }, (_, index) => <span key={index} className="relative h-5 w-2 rounded-b-sm bg-[#e34a3f] shadow-[0_0_10px_rgba(227,74,63,.45)]" style={{ transform: `translateY(${index * -5}px)` }}><span className="absolute inset-x-0 top-1/2 size-1 -translate-y-1/2 translate-x-0.5 rounded-full bg-[#f1cf7c]" /></span>)}
      </div>
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 sm:p-5">
        <div className="rounded-xl border border-white/15 bg-[#102536]/40 px-3 py-2 backdrop-blur-sm">
          <p className="eyebrow">Current scenery · 現在地</p>
          <p className="jp-serif mt-1 text-2xl tracking-[.12em] text-[#f5f5f2]">{world.area.japaneseTitle}</p>
        </div>
        <span className="rounded-full border border-[#f1cf7c]/35 bg-[#102536]/65 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.14em] text-[#f1cf7c]">level {safeLevel}</span>
      </div>
      <div className="absolute left-4 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-[#f1cf7c]/45 bg-[#162b3b]/70 font-serif text-lg text-[#f1cf7c] shadow-lg backdrop-blur-sm">道</div>
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-5 p-4 sm:p-5">
        <div><p className="jp-serif text-lg text-[#f5f5f2]">{world.area.title}</p><p className="mt-1 text-xs text-[#d8dde4]">{world.stage.label} · Every session changes the horizon.</p></div>
        <div className="w-36 shrink-0">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/20"><span className="block h-full rounded-full bg-[#f1cf7c]" style={{ width: chapterProgress + "%" }} /></div>
          <div className="mt-2 flex justify-between text-[10px] uppercase tracking-[.12em] text-[#d8dde4]"><span>Chapter {chapter}</span><span>{rhythm} day rhythm</span></div>
        </div>
      </div>
    </div>
  );
}
