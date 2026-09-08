"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { markExternalSourceOpened, readExternalSourceProgress } from "@/lib/external-source-progress.js";
import { externalResourceToSourceLink as adaptExternalResource } from "@/lib/external-resources";
import type { ExternalResource, ExternalResourceCatalogEntry } from "@/lib/external-resources";

export type ExternalSourceDelivery = "original-site" | "remote-media" | "frame-or-link" | "link-only";

export interface ExternalSourceLink {
  id: string;
  sourceId: string;
  name: string;
  title?: string;
  level?: string;
  context?: string;
  course?: string;
  lesson?: string;
  canDo?: string;
  targetSkills?: readonly string[];
  targetItemIds?: readonly string[];
  annotationStatus?: string;
  reviewedAt?: string;
  resourceTypes: readonly string[];
  transcriptAvailable?: boolean;
  translationAvailable?: boolean;
  mediaDelivery: ExternalSourceDelivery;
  mediaUrl?: string;
  posterUrl?: string;
  frameUrl?: string;
  videoCatalog?: readonly { id: string; title: string; level: string; publishedAt: string; url: string; frameUrl: string; posterUrl: string; contentType?: string; targetItemIds?: readonly string[]; mappedTopics?: readonly string[] }[];
  videoCatalogFeed?: string;
  podcastFeed?: string;
  immersionRole?: "real-life" | "comprehensible-input" | "guided-understanding";
  providerLevel?: string;
  kizashiRecommendedLevel?: string;
  aliases?: readonly string[];
  nativeInput?: boolean;
  journeyContexts?: readonly string[];
  contentTypes?: readonly string[];
  catalog?: readonly ExternalResourceCatalogEntry[];
  description: string;
  url: string;
  license?: string;
  attribution?: string;
}

export function externalResourceToSourceLink(resource: ExternalResource): ExternalSourceLink {
  return adaptExternalResource(resource);
}

export function ExternalSourceLauncher({ source, children = "Open original source ↗" }: Readonly<{ source: ExternalSourceLink; children?: ReactNode }>) {
  const [progress, setProgress] = useState<string | undefined>();

  useEffect(() => {
    const refresh = () => setProgress(readExternalSourceProgress()[source.id]);
    refresh();
    window.addEventListener("michi-source-progress-updated", refresh);
    return () => window.removeEventListener("michi-source-progress-updated", refresh);
  }, [source.id]);

  const status = progress === "completed" ? "✓ Complete · " : progress === "started" ? "Started · " : progress === "opened" ? "✓ Opened · " : "";
  return <a href={source.url} target="_blank" rel="noreferrer" onClick={() => { markExternalSourceOpened(source.id); setProgress((value) => value ?? "opened"); }} data-source-opened={Boolean(progress) || undefined} className={`inline-flex rounded-lg border px-3 py-2 text-xs font-semibold ${progress ? "border-[#6fb98f] text-[#8bcca6]" : "border-[#3f4652] text-[#c3c7ce] hover:border-[#e5b85c] hover:text-[#f1cf7c]"}`}>{status}{children}</a>;
}
