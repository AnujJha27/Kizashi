"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { markExternalSourceOpened, readExternalSourceProgress } from "@/lib/external-source-progress.js";
import type { ExternalResource } from "@/lib/external-resources";

export interface ExternalSourceLink {
  id: string;
  name: string;
  title?: string;
  level?: string;
  context?: string;
  targetSkills?: readonly string[];
  targetItemIds?: readonly string[];
  annotationStatus?: string;
  reviewedAt?: string;
  resourceTypes?: readonly string[];
  transcriptAvailable?: boolean;
  translationAvailable?: boolean;
  mediaDelivery?: string;
  mediaUrl?: string;
  posterUrl?: string;
  description: string;
  url: string;
}

export function externalResourceToSourceLink(resource: ExternalResource): ExternalSourceLink {
  return {
    id: resource.id,
    name: resource.name,
    title: resource.title,
    level: resource.level,
    targetSkills: resource.targetSkills,
    targetItemIds: resource.targetItemIds,
    description: resource.description ?? "",
    url: resource.url,
    resourceTypes: [resource.resourceType],
    mediaDelivery: resource.deliveryMode,
    annotationStatus: resource.metadata?.annotationStatus as string | undefined,
    reviewedAt: resource.metadata?.reviewedAt as string | undefined,
    transcriptAvailable: resource.metadata?.transcriptAvailable as boolean | undefined,
    translationAvailable: resource.metadata?.translationAvailable as boolean | undefined,
  };
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
