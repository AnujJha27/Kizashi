"use client";

import { useEffect, useMemo, useState } from "react";

import { useContentModule } from "@/components/content/use-content-module";
import { StudyLaterButton } from "@/components/library/study-later";
import { ExternalSourceViewer } from "@/components/learning/external-source-viewer";
import { ExternalSourceLauncher, externalResourceToSourceLink, type ExternalSourceLink } from "@/components/learning/external-source-launcher";
import { DictationActivity } from "@/components/learning/dictation-activity";
import { ImmersionPlayer } from "@/components/learning/immersion-player";
import { AozoraShelf } from "@/components/learning/aozora-shelf";
import { JapaneseText } from "@/components/learning/japanese-text";
import { OutputPractice } from "@/components/learning/output-practice";
import { PronunciationActivity } from "@/components/learning/pronunciation-activity";
import { TadokuShelf } from "@/components/learning/tadoku-shelf";
import { getListeningClipMetadata, selectImmersionClips } from "@/lib/immersion-core.js";
import { listeningVisualAsset } from "@/lib/learning-visual-assets";
import { markExternalSourceOpened, readExternalSourceProgress } from "@/lib/external-source-progress.js";
import { readLessonState, readMistakes, readReviewRecords, type MistakeRecord, type ReviewRecord } from "@/lib/session";
import { readExamPlanPreferences } from "@/lib/session";
import { getExternalResources } from "@/lib/external-resources";
import { getAreaForLessonId } from "@/lib/journey-world-core.js";
import { rotateCatalog } from "@/lib/shun-catalog-core.js";
import { interestScore } from "@/lib/interest-core.js";
import { readImmersionVideoReviews, recordImmersionVideoReview } from "@/lib/immersion-review.js";

type ImmersionMode = "listen" | "read" | "pronunciation" | "dictation" | "shadow" | "real-life" | "understand" | "explore";

function knownIds(records: Record<string, ReviewRecord>) {
  return new Set(Object.keys(records));
}

function coverageLabel(value: number) {
  return value ? `${Math.round(value * 100)}% familiar` : "coverage pending";
}

function immersionVideoStudyLaterId(sourceId: string | undefined, videoId: string) {
  return `immersion-video:${sourceId ?? "provider"}:${videoId}`;
}

function sourceCards() {
  return getExternalResources().filter((resource) => resource.id === "erin" || resource.tags?.includes("immersion-provider") || (resource.resourceType === "listening" && resource.sourceId !== "irodori")).map(externalResourceToSourceLink);
}

function sourceRelevance(source: ExternalSourceLink, journeyAreaId: string, interests: readonly string[]) {
  return Number(source.journeyContexts?.includes(journeyAreaId)) * 3 + interestScore(source, interests);
}

export function ImmersionSurface() {
  const module = useContentModule();
  const [records, setRecords] = useState<Record<string, ReviewRecord>>({});
  const [mistakes, setMistakes] = useState<Record<string, MistakeRecord>>({});
  const [sourceProgress, setSourceProgress] = useState<Record<string, boolean>>({});
  const [mode, setMode] = useState<ImmersionMode>("listen");
  const [visibleClipCount, setVisibleClipCount] = useState(8);
  const [visibleReadingCount, setVisibleReadingCount] = useState(8);
  const [visibleIrodoriCount, setVisibleIrodoriCount] = useState(8);
  const [rotation, setRotation] = useState(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [online, setOnline] = useState(true);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [selectedReadingId, setSelectedReadingId] = useState<string | null>(null);
  const currentJourneyArea = useMemo(() => {
    const lessons = module.course.chapters.flatMap((chapter) => chapter.lessons.map((lesson) => ({ ...lesson, region: chapter.region })));
    const lesson = lessons.find((candidate) => readLessonState(candidate.id).status !== "complete") ?? lessons[0];
    return lesson ? getAreaForLessonId(lesson.id, lesson.region, module.course.jlptLevel ?? "N5").id : "neighborhood";
  }, [module.course]);

  useEffect(() => {
    const refresh = () => { setRecords(readReviewRecords()); setMistakes(readMistakes()); setSourceProgress(readExternalSourceProgress()); setInterests(readExamPlanPreferences().interestTopics); };
    refresh();
    window.addEventListener("michi-review-updated", refresh);
    window.addEventListener("michi-mistakes-updated", refresh);
    window.addEventListener("michi-source-progress-updated", refresh);
    window.addEventListener("michi-profile-updated", refresh);
    return () => { window.removeEventListener("michi-review-updated", refresh); window.removeEventListener("michi-mistakes-updated", refresh); window.removeEventListener("michi-source-progress-updated", refresh); window.removeEventListener("michi-profile-updated", refresh); };
  }, []);

  useEffect(() => {
    const key = "michi.immersion-rotation";
    const next = Number(window.sessionStorage.getItem(key) ?? 0) + 1;
    window.sessionStorage.setItem(key, String(next));
    setRotation(next * 8);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const readingId = params.get("reading");
    const clipId = params.get("listen");
    if (readingId && module.readings.some((reading) => reading.id === readingId)) setSelectedReadingId(readingId);
    if (clipId && module.listening.some((clip) => clip.id === clipId)) setSelectedClipId(clipId);
  }, [module.listening, module.readings]);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);

  const known = useMemo(() => knownIds(records), [records]);
  const clips = useMemo(() => {
    const ordered = selectImmersionClips(module.listening, "guided", known, module.listening.length, { mistakes, sourceProgress, interests });
    const offset = ordered.length ? rotation % ordered.length : 0;
    return [...ordered.slice(offset), ...ordered.slice(0, offset)].slice(0, visibleClipCount);
  }, [interests, known, mistakes, module.listening, rotation, sourceProgress, visibleClipCount]);
  const itemMap = useMemo(() => new Map([...module.vocabulary, ...module.grammar, ...module.kanji].map((item) => [item.id, item])), [module.grammar, module.kanji, module.vocabulary]);
  const readings = useMemo(() => {
    const preferred = [...module.readings].sort((left, right) => interestScore(right, interests) - interestScore(left, interests));
    const offset = preferred.length ? rotation % preferred.length : 0;
    return [...preferred.slice(offset), ...preferred.slice(0, offset)].slice(0, visibleReadingCount);
  }, [interests, module.readings, rotation, visibleReadingCount]);
  const sources = useMemo(() => sourceCards().sort((left, right) => sourceRelevance(right, currentJourneyArea, interests) - sourceRelevance(left, currentJourneyArea, interests) || left.name.localeCompare(right.name)), [currentJourneyArea, interests]);
  const understandingSources = useMemo(() => getExternalResources({ tag: "guided-understanding" }).map(externalResourceToSourceLink), []);
  const irodoriActivities = useMemo(() => getExternalResources({ skill: "real-world-practice" }).filter((resource) => resource.sourceId === "irodori" && resource.id !== "irodori-practical-lessons").map(externalResourceToSourceLink), []);
  const visibleIrodoriActivities = irodoriActivities.slice(0, visibleIrodoriCount);
  const openedSourceCount = sources.filter((source) => sourceProgress[source.id]).length;

  if (selectedClipId) return <ImmersionPlayer clipId={selectedClipId} focus="listen" startShadowing={mode === "shadow"} onClose={() => setSelectedClipId(null)} />;
  if (selectedReadingId) return <ImmersionPlayer readingId={selectedReadingId} focus="read" onClose={() => setSelectedReadingId(null)} />;

  return <div className="space-y-7">{!online ? <p role="status" className="border-l-2 border-[#e5b85c] bg-[#211d18]/75 px-4 py-3 text-sm text-[#f1cf7c]">You&apos;re offline. Local activities remain available; Online connection required for provider material.</p> : null}<section className="surface-panel overflow-hidden p-6 sm:p-9"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Immersion · 浸る</p><h1 className="mt-1 text-3xl font-medium text-[#f5f5f2] sm:text-4xl">Explore Japanese in context.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#9297a1]">A quieter place for natural listening, short reading, pronunciation, dictation, shadowing, and useful detours. Pick an experience; Kizashi keeps the study machinery out of the way.</p></div><span className="text-xs text-[#9297a1]">{openedSourceCount} / {sources.length} sources opened</span></div><div className="mt-7 flex gap-1 overflow-x-auto border-b border-white/10 pb-px" role="tablist" aria-label="Immersion activities">{(["listen", "read", "pronunciation", "dictation", "shadow", "real-life", "understand", "explore"] as ImmersionMode[]).map((value) => <button key={value} type="button" role="tab" aria-selected={mode === value} onClick={() => setMode(value)} className={`min-w-fit border-b-2 px-3 py-2 text-left text-sm transition ${mode === value ? "border-[#e5b85c] text-[#f1cf7c]" : "border-transparent text-[#9297a1] hover:border-[#e5b85c]/60 hover:text-[#f1cf7c]"}`}><span className="block font-semibold capitalize">{value === "understand" ? "Understand Japanese" : value === "real-life" ? "Real life" : value}</span><span className="jp-serif text-xs text-[#e5b85c]">{value === "listen" ? "聞く" : value === "read" ? "読む" : value === "pronunciation" ? "発音" : value === "dictation" ? "書き取り" : value === "shadow" ? "まねる" : value === "real-life" ? "実際に使う" : value === "understand" ? "しくみ" : "寄り道"}</span></button>)}</div></section>
    {mode === "pronunciation" ? <PronunciationActivity /> : null}
    {mode === "dictation" ? <DictationActivity clips={module.listening} vocabulary={module.vocabulary} kanji={module.kanji} /> : null}
    {mode === "understand" ? <section className="border-t border-white/10 pt-7"><div><p className="eyebrow">しくみ · Understand Japanese</p><h2 className="mt-1 text-2xl font-medium">See another explanation.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#9297a1]">Structural references sit beside Kizashi&apos;s canonical explanations; use them as another perspective, not as a replacement for the lesson.</p></div><div className="mt-6 divide-y divide-white/10">{understandingSources.map((source) => <SourceCard key={source.id} source={source} opened={Boolean(sourceProgress[source.id])} rotation={rotation} interests={interests} journeyAreaId={currentJourneyArea} />)}</div></section> : null}
    {mode === "explore" ? <section className="border-t border-white/10 pt-7"><div className="flex items-end justify-between gap-3"><div><p className="eyebrow">寄り道 · Detours</p><h2 className="mt-1 text-2xl font-medium">Explore the source worlds.</h2><p className="mt-2 text-sm text-[#9297a1]">Open provider-hosted material when you want to wander further.</p></div><span className="text-xs text-[#9297a1]">{openedSourceCount} opened</span></div><div className="mt-6 divide-y divide-white/10">{sources.map((source) => <SourceCard key={source.id} source={source} opened={Boolean(sourceProgress[source.id])} rotation={rotation} interests={interests} journeyAreaId={currentJourneyArea} />)}</div></section> : null}
    {mode === "read" ? <><section className="border-t border-white/10 pt-7"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">読む · Quick read</p><h2 className="mt-1 text-2xl font-medium">Read a little Japanese.</h2><p className="mt-2 text-sm text-[#9297a1]">Short passages stay together with their questions.</p></div><span className="text-xs text-[#9297a1]">{module.readings.length} passages · showing {readings.length}</span></div><div className="mt-5 divide-y divide-white/10">{readings.map((reading) => <button key={reading.id} type="button" onClick={() => setSelectedReadingId(reading.id)} className="group flex w-full items-start justify-between gap-5 py-4 text-left first:pt-0 last:pb-0"><span className="min-w-0"><span className="eyebrow block text-[10px]">{reading.subcategory ?? "reading"}</span><span className="mt-1 block text-lg font-medium text-[#f5f5f2] group-hover:text-[#f1cf7c]"><JapaneseText text={reading.title} vocabulary={module.vocabulary} kanji={module.kanji} always inspect={false} /></span><span className="jp-serif mt-1 block line-clamp-2 text-sm text-[#e5b85c]"><JapaneseText text={reading.passage} vocabulary={module.vocabulary} kanji={module.kanji} always inspect={false} /></span></span><span className="shrink-0 pt-5 text-xs text-[#9297a1] group-hover:text-[#f1cf7c]">Open →</span></button>)}</div>{readings.length < module.readings.length ? <button type="button" onClick={() => setVisibleReadingCount((value) => value + 8)} className="mt-5 border-t border-white/10 pt-4 text-sm font-semibold text-[#e5b85c] hover:text-[#f1cf7c]">Load more passages →</button> : null}</section><TadokuShelf /><AozoraShelf /></> : null}
    {mode === "real-life" ? <section className="border-t border-white/10 pt-7"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">実際に使う · Real-life Japanese</p><h2 className="mt-1 text-2xl font-medium">Practice a real situation.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#9297a1]">Irodori lessons turn Kizashi foundations into useful listening, dialogue, shadowing, and Can-do practice. The original lesson stays with the Japan Foundation.</p></div><span className="text-xs text-[#9297a1]">{irodoriActivities.length} activities · showing {visibleIrodoriActivities.length}</span></div><div className="mt-6 divide-y divide-white/10">{visibleIrodoriActivities.map((source) => <article key={source.id} className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="eyebrow text-[10px]">{source.level} · {source.course ?? "Irodori"} · {source.lesson ?? "lesson"}</p><h3 className="mt-2 text-lg font-medium text-[#f5f5f2]">{source.title ?? source.name}</h3><p className="mt-2 text-sm leading-6 text-[#e5b85c]">{source.canDo ?? source.description}</p><p className="mt-3 text-xs leading-5 text-[#9297a1]">{source.resourceTypes.join(" · ")} · provider-hosted</p></div><div className="shrink-0 sm:w-56"><ExternalSourceViewer source={source} /><details className="mt-3 text-[11px] text-[#676c75]"><summary className="cursor-pointer">ⓘ Source</summary><p className="mt-2 leading-5">{source.attribution} · {source.license}</p></details></div></article>)}</div>{visibleIrodoriActivities.length < irodoriActivities.length ? <button type="button" onClick={() => setVisibleIrodoriCount((value) => value + 8)} className="mt-5 border-t border-white/10 pt-4 text-sm font-semibold text-[#e5b85c] hover:text-[#f1cf7c]">Load more Irodori activities →</button> : null}</section> : null}
    {mode === "real-life" ? <OutputPractice module={module} /> : null}
    {mode === "listen" || mode === "shadow" ? <section className="border-t border-white/10 pt-7"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">{mode === "shadow" ? "まねる · Shadow" : "聞く · For you"}</p><h2 className="mt-1 text-2xl font-medium">{mode === "shadow" ? "Speak along with the scene." : "Hear Japanese where it lives."}</h2><p className="mt-2 text-sm text-[#9297a1]">{mode === "shadow" ? "Listen, shadow, then speak alone. Support stays available when you need it." : "Start with a clip selected from your current knowledge and recent signals."}</p></div><span className="text-xs text-[#9297a1]">{module.listening.length} activities · showing {clips.length}</span></div>{clips.length ? <div className="mt-5 divide-y divide-white/10">{clips.map((clip, index) => { const metadata = getListeningClipMetadata(clip, itemMap, known); return <button key={clip.id} type="button" onClick={() => setSelectedClipId(clip.id)} className="group flex w-full items-start justify-between gap-5 py-4 text-left first:pt-0 last:pb-0"><img src={listeningVisualAsset(metadata.context)} alt="" aria-hidden="true" width={112} height={80} loading="lazy" decoding="async" className="h-16 w-24 shrink-0 rounded-lg object-cover opacity-80 sm:h-20 sm:w-28" onError={(event) => { event.currentTarget.hidden = true; }} /><span className="min-w-0"><span className="eyebrow block text-[10px]">{metadata.context} · {metadata.naturalness} speech</span><span className="mt-1 block text-xl font-medium text-[#f5f5f2] group-hover:text-[#f1cf7c]"><JapaneseText text={clip.title} vocabulary={module.vocabulary} kanji={module.kanji} always inspect={false} /></span><span className="mt-2 block text-sm text-[#9297a1]">{metadata.source} · {metadata.level} · {coverageLabel(Math.max(metadata.vocabularyCoverage, metadata.grammarCoverage))}</span></span><span className="shrink-0 pt-5 text-xs text-[#e5b85c]">{mode === "shadow" ? "Shadow →" : index === 0 ? "Recommended →" : "Open →"}</span></button>; })}</div> : <p className="mt-6 text-sm text-[#9297a1]">No listening activities are ready yet. Try a short reading or a source detour.</p>}{clips.length < module.listening.length ? <button type="button" onClick={() => setVisibleClipCount((value) => value + 8)} className="mt-5 border-t border-white/10 pt-4 text-sm font-semibold text-[#e5b85c] hover:text-[#f1cf7c]">Load more listening →</button> : null}</section> : null}
  </div>;
}

function SourceCard({ source, opened, rotation, interests, journeyAreaId }: Readonly<{ source: ExternalSourceLink; opened: boolean; rotation: number; interests: readonly string[]; journeyAreaId?: string }>) {
  const role = source.immersionRole === "real-life" ? "Real-life Japanese" : source.immersionRole === "comprehensible-input" ? "Comprehensible input" : source.immersionRole === "guided-understanding" ? "Structural explanation" : undefined;
  const journeyMatch = journeyAreaId && source.journeyContexts?.includes(journeyAreaId);
  return <article className="border-l border-white/15 py-4 pl-4 first:pt-0 last:pb-0">{source.sourceId === "japanese-with-shun" || source.videoCatalogFeed ? <YouTubeVideoCatalog source={source} rotation={rotation} interests={interests} journeyAreaId={journeyAreaId} /> : source.sourceId === "nihongo-con-teppei" ? <TeppeiPodcastCatalog source={source} rotation={rotation} interests={interests} /> : <><p className="text-lg font-medium text-[#f5f5f2]">{source.title ?? source.name}</p><p className="mt-1 text-xs uppercase tracking-[.1em] text-[#676c75]">{source.name}{source.level ? ` · ${source.level}` : ""}</p>{role ? <p className="mt-2 text-xs uppercase tracking-[.1em] text-[#e5b85c]">{role}</p> : null}{journeyMatch ? <p className="mt-2 text-xs text-[#8bcca6]">Matches your current Journey area</p> : null}<p className="mt-3 text-sm leading-6 text-[#9297a1]">{source.description}</p><div className="mt-4 flex flex-wrap items-center gap-2"><ExternalSourceViewer source={source} /><span className="text-[11px] text-[#676c75]">{opened ? "Opened" : "Provider-hosted"}</span></div><ProviderCatalog source={source} /></>}</article>;
}

type YouTubeVideo = NonNullable<ExternalSourceLink["videoCatalog"]>[number];

function ProviderCatalog({ source }: Readonly<{ source: ExternalSourceLink }>) {
  if (!source.catalog?.length) return null;
  return <div className="mt-4 rounded-xl border border-white/10 bg-[#101b2b]/45 p-3"><p className="eyebrow">Activity map · {source.catalog.length}</p><ul className="mt-2 divide-y divide-white/10">{source.catalog.map((entry) => <li key={entry.id} className="py-2 first:pt-0 last:pb-0"><a href={entry.url} target="_blank" rel="noreferrer" onClick={() => { markExternalSourceOpened(source.id); markExternalSourceOpened(`${source.id}:${entry.id}`); }} className="text-sm font-medium text-[#e5b85c] hover:text-[#f1cf7c]">{entry.title} ↗</a><p className="mt-1 text-[11px] leading-4 text-[#9297a1]">{entry.topic} · {entry.activityType} · {entry.sourceLevel ?? source.level ?? "provider"}</p><p className="mt-1 text-[10px] leading-4 text-[#676c75]">{entry.jlptRelevance} · {entry.audioAvailable ? "audio" : entry.videoAvailable ? "video" : "provider page"}</p></li>)}</ul></div>;
}

function YouTubeVideoCatalog({ source, rotation, interests, journeyAreaId }: Readonly<{ source: ExternalSourceLink; rotation: number; interests: readonly string[]; journeyAreaId?: string }>) {
  const [videos, setVideos] = useState<YouTubeVideo[]>([...(source.videoCatalog ?? [])]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(videos.length === 0);
  const [error, setError] = useState(false);
  const [reviews, setReviews] = useState(readImmersionVideoReviews);

  useEffect(() => {
    let active = true;
    const endpoint = source.sourceId === "japanese-with-shun" ? "/api/immersion/shun" : `/api/immersion/youtube/${encodeURIComponent(source.sourceId)}`;
    fetch(endpoint).then((response) => { if (!response.ok) throw new Error("provider catalog unavailable"); return response.json() as Promise<YouTubeVideo[]>; }).then((catalog) => { if (active && Array.isArray(catalog) && catalog.length) setVideos([...new Map([...catalog, ...(source.videoCatalog ?? [])].map((video) => [video.id, video])).values()]); }).catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const refresh = () => setReviews(readImmersionVideoReviews());
    window.addEventListener("michi-immersion-review-updated", refresh);
    return () => window.removeEventListener("michi-immersion-review-updated", refresh);
  }, []);

  const rotated = rotateCatalog([...videos].sort((left, right) => interestScore(right, interests) - interestScore(left, interests) || String(right.publishedAt).localeCompare(String(left.publishedAt))), rotation);
  const selected = videos.find((video) => video.id === selectedId) ?? rotated[0];
  const selectedSource = selected ? { ...source, id: `${source.id}-${selected.id}`, title: selected.title, level: selected.level, url: selected.url, frameUrl: selected.frameUrl, posterUrl: selected.posterUrl, targetItemIds: selected.targetItemIds } : source;
  const selectedReview = selected ? reviews[selected.id] : undefined;

  const role = source.immersionRole === "real-life" ? "REAL LIFE" : source.immersionRole === "comprehensible-input" ? "COMPREHENSIBLE" : "LISTEN";
  const journeyMatch = journeyAreaId && source.journeyContexts?.includes(journeyAreaId);
  return <><p className="text-lg font-medium text-[#f5f5f2]">{source.name} · choose a video</p><p className="mt-1 text-xs uppercase tracking-[.1em] text-[#e5b85c]">{role} · {source.providerLevel ?? source.level} · {source.kizashiRecommendedLevel ?? source.level}</p>{journeyMatch ? <p className="mt-2 text-xs text-[#8bcca6]">Matches your current Journey area</p> : null}<p className="mt-3 text-sm leading-6 text-[#9297a1]">{source.description}</p>{source.contentTypes?.length ? <p className="mt-2 text-[11px] text-[#676c75]">{source.contentTypes.join(" · ")}</p> : null}{loading ? <p className="mt-4 text-xs text-[#9297a1]">Loading the latest videos…</p> : null}{error ? <p role="status" className="mt-3 text-xs text-[#e5b85c]">Provider catalog unavailable. The official channel is still available below.</p> : null}{selected ? <div className="mt-4"><label className="eyebrow block" htmlFor={`${source.sourceId}-video`}>Video</label><select id={`${source.sourceId}-video`} value={selected.id} onChange={(event) => setSelectedId(event.target.value)} className="mt-2 w-full rounded-lg border border-[#3f4652] bg-[#111216] px-3 py-2 text-sm text-[#f5f5f2]">{rotated.map((video) => <option key={video.id} value={video.id}>{video.title} · {video.level}{video.contentType ? ` · ${video.contentType}` : ""}</option>)}</select>{selected.mappedTopics?.length ? <p className="mt-2 text-xs text-[#e5b85c]">Relevant to: {selected.mappedTopics.join(" · ")}</p> : null}<div className="mt-3 flex flex-wrap items-center gap-2"><ExternalSourceViewer source={selectedSource} /><StudyLaterButton itemId={immersionVideoStudyLaterId(source.sourceId, selected.id)} label="Save · あとで" /><span className="text-[11px] text-[#676c75]">Provider-hosted · no media stored</span></div><div className="mt-4 rounded-lg border border-white/10 bg-[#17181d]/55 p-3"><div className="flex flex-wrap items-center gap-2" role="group" aria-label="Video comprehension review"><span className="text-[11px] text-[#9297a1]">How did it feel?</span>{([["clear", "Clear"], ["shaky", "Shaky"], ["missed", "Missed"]] as const).map(([status, label]) => <button key={status} type="button" onClick={() => recordImmersionVideoReview(selected.id, status)} className={`rounded-md border px-2 py-1 text-[11px] ${selectedReview?.status === status ? "border-[#e5b85c] bg-[#302818] text-[#f1cf7c]" : "border-[#3f4652] text-[#c3c7ce] hover:border-[#e5b85c]"}`}>{label}</button>)}</div>{selectedReview ? <p className="mt-2 text-[10px] text-[#8bcca6]">Saved locally · {new Date(selectedReview.updatedAt).toLocaleDateString()}</p> : <p className="mt-2 text-[10px] text-[#676c75]">Mark your comprehension after listening; this does not change source approval.</p>}</div></div> : <div className="mt-4 flex flex-wrap items-center gap-2"><ExternalSourceViewer source={source} /><span className="text-[11px] text-[#676c75]">Official channel fallback</span></div>}</>;
}

type TeppeiEpisode = { id: string; title: string; publishedAt: string; url: string; mediaUrl: string; duration: string };

function TeppeiPodcastCatalog({ source, rotation, interests }: Readonly<{ source: ExternalSourceLink; rotation: number; interests: readonly string[] }>) {
  const [episodes, setEpisodes] = useState<TeppeiEpisode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/immersion/teppei").then((response) => { if (!response.ok) throw new Error("provider catalog unavailable"); return response.json() as Promise<TeppeiEpisode[]>; }).then((catalog) => { if (active && Array.isArray(catalog)) setEpisodes(catalog); }).catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const rotated = rotateCatalog([...episodes].sort((left, right) => interestScore(right, interests) - interestScore(left, interests)), rotation);
  const selected = episodes.find((episode) => episode.id === selectedId) ?? rotated[0];
  const selectedSource = selected ? { ...source, id: `${source.id}-${selected.id}`, title: selected.title, url: selected.url, mediaUrl: selected.mediaUrl } : source;

  return <><p className="text-lg font-medium text-[#f5f5f2]">Nihongo con Teppei · choose an episode</p><p className="mt-1 text-xs uppercase tracking-[.1em] text-[#676c75]">{source.level} · rotating provider catalog</p><p className="mt-3 text-sm leading-6 text-[#9297a1]">{source.description}</p>{loading ? <p className="mt-4 text-xs text-[#9297a1]">Loading the latest episodes…</p> : null}{error ? <p role="status" className="mt-3 text-xs text-[#e5b85c]">Provider catalog unavailable. The official source is still available below.</p> : null}{selected ? <div className="mt-4"><label className="eyebrow block" htmlFor="teppei-episode">Episode</label><select id="teppei-episode" value={selected.id} onChange={(event) => setSelectedId(event.target.value)} className="mt-2 w-full rounded-lg border border-[#3f4652] bg-[#111216] px-3 py-2 text-sm text-[#f5f5f2]">{rotated.map((episode) => <option key={episode.id} value={episode.id}>{episode.title}{episode.duration ? ` · ${episode.duration}` : ""}</option>)}</select><div className="mt-3 rounded-xl border border-[#3f4652] bg-[#0b0b0d] p-3"><audio controls preload="metadata" className="w-full" src={selected.mediaUrl} onPlay={() => markExternalSourceOpened(source.id)}>Your browser does not support audio playback.</audio><p className="mt-2 text-[11px] text-[#9297a1]">Provider-hosted audio · {selected.publishedAt ? new Date(selected.publishedAt).toLocaleDateString() : "date unavailable"}</p></div><div className="mt-3 flex flex-wrap items-center gap-2"><ExternalSourceLauncher source={selectedSource}>Open episode ↗</ExternalSourceLauncher><span className="text-[11px] text-[#676c75]">No audio stored</span></div></div> : <div className="mt-4 flex flex-wrap items-center gap-2"><ExternalSourceLauncher source={source} /><span className="text-[11px] text-[#676c75]">Official site fallback</span></div>}</>;
}
