import { getWikibooksSection as getSection } from "./wikibooks-core.js";

export interface WikibooksLookup {
  page: string;
  section?: string;
}

export interface WikibooksSection {
  title: string;
  section?: string;
  text: string;
  links: { label: string; url: string }[];
  sourceUrl: string;
  attribution: string;
  license: string;
}

export interface WikibooksOptions {
  fetch?: typeof fetch;
  cache?: Map<string, WikibooksSection | null>;
}

export function getWikibooksSection(lookup: WikibooksLookup, options?: WikibooksOptions): Promise<WikibooksSection | null> {
  return getSection(lookup, options) as Promise<WikibooksSection | null>;
}

