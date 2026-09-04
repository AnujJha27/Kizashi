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
  videoCatalog?: readonly { id: string; title: string; level: string; publishedAt: string; url: string; frameUrl: string; posterUrl: string }[];
  videoCatalogFeed?: string;
  podcastFeed?: string;
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
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    const refresh = () => setOpened(Boolean(readExternalSourceProgress()[source.id]));
    refresh();
    window.addEventListener("michi-source-progress-updated", refresh);
    return () => window.removeEventListener("michi-source-progress-updated", refresh);
  }, [source.id]);

  return <a href={source.url} target="_blank" rel="noreferrer" onClick={() => { markExternalSourceOpened(source.id); setOpened(true); }} data-source-opened={opened || undefined} className={`inline-flex rounded-lg border px-3 py-2 text-xs font-semibold ${opened ? "border-[#6fb98f] text-[#8bcca6]" : "border-[#3f4652] text-[#c3c7ce] hover:border-[#e5b85c] hover:text-[#f1cf7c]"}`}>{opened ? "✓ Opened · " : null}{children}</a>;
}
