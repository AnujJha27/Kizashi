import type { ReactNode } from "react";

export interface ExternalSourceLink {
  id: string;
  name: string;
  title?: string;
  level?: string;
  context?: string;
  targetSkills?: string[];
  targetItemIds?: string[];
  annotationStatus?: string;
  reviewedAt?: string;
  resourceTypes?: string[];
  transcriptAvailable?: boolean;
  translationAvailable?: boolean;
  mediaDelivery?: string;
  mediaUrl?: string;
  posterUrl?: string;
  description: string;
  url: string;
}

export function ExternalSourceLauncher({ source, children = "Open original source ↗" }: Readonly<{ source: ExternalSourceLink; children?: ReactNode }>) {
  return <a href={source.url} target="_blank" rel="noreferrer" className="inline-flex rounded-lg border border-[#3f4652] px-3 py-2 text-xs font-semibold text-[#c3c7ce] hover:border-[#e5b85c] hover:text-[#f1cf7c]">{children}</a>;
}
