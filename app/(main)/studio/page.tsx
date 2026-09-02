import { ContentStudio } from "@/components/content/content-studio";
import { requireAdminUser } from "@/lib/auth/guard";
import { n5Module } from "@/lib/curriculum";
import { getModuleItems, validateModule, validatePracticeQuestions } from "@/lib/content-validation";
import { getN5PracticeCoverage, getPracticeQuestions } from "@/lib/questions";
import { contentSources } from "@/lib/jlpt";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ContentSource } from "@/lib/types";

export const metadata = { title: "Content Studio" };
export const dynamic = "force-dynamic";

async function loadSourceRegister(fallback: ContentSource[]): Promise<ContentSource[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return fallback.length ? fallback : contentSources;
  const { data, error } = await supabase.from("content_sources").select("*").order("name");
  if (error || !data?.length) return fallback.length ? fallback : contentSources;
  const remote = data.map((row): ContentSource => ({ id: row.id, name: row.name, type: row.source_type, url: row.url ?? undefined, license: row.license ?? undefined, retrievedAt: row.retrieved_at ?? undefined, notes: row.notes ?? undefined, sha256: row.sha256 ?? undefined, localFilename: row.local_filename ?? undefined }));
  return [...new Map([...fallback, ...remote].map((source) => [source.id, source])).values()].sort((left, right) => left.name.localeCompare(right.name));
}

export default async function ContentStudioPage() {
  await requireAdminUser();
  const module = n5Module;
  const sources = await loadSourceRegister(module.sourceManifest ?? []);
  const items = getModuleItems(module);
  const seedHealth = validateModule(module);
  const generatedQuestions = getPracticeQuestions();
  const questionHealth = validatePracticeQuestions(generatedQuestions, new Set(items.map((item) => item.id)), new Map(items.map((item) => [item.id, item.category])));
  const practiceCoverage = getN5PracticeCoverage(module);
  const pendingQuestions = generatedQuestions.filter((question) => question.validationStatus === "generated" || question.review?.status === "draft");

  return <div className="mx-auto max-w-6xl"><div className="mb-8"><p className="eyebrow mb-3">Studio · provenance</p><h1 className="jp-serif text-3xl tracking-tight text-[#f5f5f2] sm:text-4xl">Make the path worth trusting.</h1><p className="mt-2 max-w-2xl text-sm text-[#9297a1]">A workspace for checking curriculum packages before they become lessons, drills, readings, or listening practice.</p></div><section className="mb-7 rounded-xl border border-white/10 bg-[#101b2b]/60 p-5"><div className="mb-3 flex items-center justify-between gap-3"><p className="eyebrow">Source register</p><span className="text-xs text-[#676c75]">{sources.length} sources</span></div><div className="divide-y divide-white/10">{sources.map((source) => <div key={source.id} className="flex items-center justify-between gap-3 px-2 py-3"><div className="min-w-0"><p className="truncate text-sm text-[#f5f5f2]">{source.name}</p><p className="mt-1 truncate text-[10px] text-[#676c75]">{source.localFilename ?? source.url ?? "Authored locally"}</p></div><span className="shrink-0 text-[10px] uppercase tracking-[.12em] text-[#e5b85c]">{source.type}</span></div>)}</div></section><ContentStudio seed={module} seedHealth={seedHealth} questionHealth={questionHealth} practiceCoverage={practiceCoverage} questions={pendingQuestions} knownItemIds={items.map((item) => item.id)} sources={sources} /></div>;
}
