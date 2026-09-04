import {
  canEmbedExternalSource,
  canPlayExternalSourceMedia,
  externalResources,
  externalResourceToSourceLink,
  getErinFamilyResource,
  getErinLessonResources,
  getExternalResourceById,
  getExternalResources,
} from "./external-resources-runtime.js";

export type ExternalResourceMode = "reference" | "remote-media" | "frame-or-link" | "link-only" | "dynamic" | "import";
export type ExternalResourceType = "grammar-reference" | "pronunciation" | "graded-reader" | "native-reading" | "lesson" | "listening" | "reference";

export interface ExternalResourceCatalogEntry {
  readonly id: string;
  readonly title: string;
  readonly sourceLevel?: string;
  readonly topic: string;
  readonly activityType: string;
  readonly url: string;
  readonly audioAvailable?: boolean;
  readonly videoAvailable?: boolean;
  readonly length?: string;
  readonly progress?: string;
  readonly targetItemIds?: readonly string[];
  readonly targetSkills?: readonly string[];
  readonly communicativeFunction?: string;
  readonly jlptRelevance: string;
  readonly provenance: string;
}

export interface ExternalResourceMetadata {
  readonly role?: string;
  readonly rightsBehavior?: string;
  readonly shelf?: boolean;
  readonly lessonIds?: readonly string[];
  readonly context?: string;
  readonly course?: string;
  readonly lesson?: string;
  readonly canDo?: string;
  readonly resourceTypes?: readonly string[];
  readonly audioAvailable?: boolean;
  readonly audioDelivery?: "provider-hosted";
  readonly termsUrl?: string;
  readonly annotationStatus?: string;
  readonly reviewedAt?: string;
  readonly transcriptAvailable?: boolean;
  readonly translationAvailable?: boolean;
  readonly mediaDelivery?: "original-site" | "remote-media";
  readonly mediaUrl?: string;
  readonly posterUrl?: string;
  readonly frameUrl?: string;
  readonly videoCatalogFeed?: string;
  readonly videoCatalogChannelId?: string;
  readonly podcastFeed?: string;
  readonly catalog?: readonly ExternalResourceCatalogEntry[];
}

export interface ExternalResource {
  readonly id: string;
  readonly sourceId: string;
  readonly name: string;
  readonly title?: string;
  readonly description?: string;
  readonly resourceType: ExternalResourceType;
  readonly level?: string;
  readonly url: string;
  readonly deliveryMode: ExternalResourceMode;
  readonly targetItemIds?: readonly string[];
  readonly targetSkills?: readonly string[];
  readonly tags?: readonly string[];
  readonly license?: string;
  readonly attribution?: string;
  readonly transformAllowed?: boolean;
  readonly metadata?: ExternalResourceMetadata;
}

export interface ExternalResourceFilters {
  itemId?: string;
  skill?: string;
  type?: ExternalResourceType;
  tag?: string;
}

export { canEmbedExternalSource, canPlayExternalSourceMedia, externalResources, externalResourceToSourceLink, getErinFamilyResource, getErinLessonResources, getExternalResourceById, getExternalResources };
