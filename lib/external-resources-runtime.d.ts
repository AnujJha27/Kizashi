import type { ExternalResource, ExternalResourceFilters } from "./external-resources";

type RuntimeSourceLink = {
  id: string;
  sourceId: string;
  name: string;
  title?: string;
  level?: string;
  context?: string;
  targetSkills?: readonly string[];
  targetItemIds?: readonly string[];
  description: string;
  url: string;
  resourceTypes: readonly string[];
  mediaDelivery: "original-site" | "remote-media" | "frame-or-link" | "link-only";
  mediaUrl?: string;
  posterUrl?: string;
  annotationStatus?: string;
  reviewedAt?: string;
  transcriptAvailable?: boolean;
  translationAvailable?: boolean;
  license?: string;
  attribution?: string;
};

export const externalResources: ReadonlyArray<Readonly<ExternalResource>>;
export function getExternalResources(filters?: ExternalResourceFilters): ReadonlyArray<Readonly<ExternalResource>>;
export function getExternalResourceById(id: string): Readonly<ExternalResource> | undefined;
export function getErinFamilyResource(): Readonly<ExternalResource>;
export function getErinLessonResources(): ReadonlyArray<Readonly<ExternalResource>>;
export function externalResourceToSourceLink(resource: ExternalResource): RuntimeSourceLink;
export function getErinLessonSources(): ReadonlyArray<RuntimeSourceLink>;
export function canEmbedExternalSource(delivery: RuntimeSourceLink["mediaDelivery"] | undefined): boolean;
export function canPlayExternalSourceMedia(delivery: RuntimeSourceLink["mediaDelivery"] | undefined): boolean;
