export type ExternalResourceMode =
  | "reference"
  | "remote-media"
  | "frame-or-link"
  | "link-only"
  | "dynamic"
  | "import";

export type ExternalResourceType =
  | "grammar-reference"
  | "pronunciation"
  | "graded-reader"
  | "native-reading"
  | "lesson"
  | "listening"
  | "reference";

export interface ExternalResource {
  id: string;
  sourceId: string;
  name: string;
  title?: string;
  description?: string;
  resourceType: ExternalResourceType;
  level?: string;
  url: string;
  deliveryMode: ExternalResourceMode;
  targetItemIds?: readonly string[];
  targetSkills?: readonly string[];
  tags?: readonly string[];
  license?: string;
  attribution?: string;
  transformAllowed?: boolean;
  metadata?: Record<string, unknown>;
}

export interface ExternalResourceFilters {
  itemId?: string;
  skill?: string;
  type?: ExternalResourceType;
  tag?: string;
}

function freezeResource(resource: ExternalResource): Readonly<ExternalResource> {
  return Object.freeze({
    ...resource,
    targetItemIds: resource.targetItemIds ? Object.freeze([...resource.targetItemIds]) : undefined,
    targetSkills: resource.targetSkills ? Object.freeze([...resource.targetSkills]) : undefined,
    tags: resource.tags ? Object.freeze([...resource.tags]) : undefined,
    metadata: resource.metadata ? Object.freeze({ ...resource.metadata }) : undefined,
  });
}

const registry: ReadonlyArray<Readonly<ExternalResource>> = Object.freeze(([
  {
    id: "erin",
    sourceId: "erin",
    name: "Erin's Challenge",
    title: "Beginner situational Japanese",
    description: "Six curated Japan Foundation lessons for natural dialogue and shadowing.",
    resourceType: "lesson",
    level: "N5",
    url: "https://www.erin.jpf.go.jp/en/",
    deliveryMode: "frame-or-link",
    targetSkills: ["natural dialogue", "shadowing"],
    tags: ["situational-japanese", "shelf"],
    metadata: { role: "beginner situational dialogue", rightsBehavior: "original-site-media" },
  },
  {
    id: "erin-01", sourceId: "erin", name: "Erin's Challenge", resourceType: "lesson", level: "N5", url: "https://www.erin.jpf.go.jp/en/lesson/01/basic/", deliveryMode: "frame-or-link", metadata: { shelf: false },
  },
  {
    id: "erin-02", sourceId: "erin", name: "Erin's Challenge", resourceType: "lesson", level: "N5", url: "https://www.erin.jpf.go.jp/en/lesson/02/basic/", deliveryMode: "frame-or-link", metadata: { shelf: false },
  },
  {
    id: "erin-03", sourceId: "erin", name: "Erin's Challenge", resourceType: "lesson", level: "N5", url: "https://www.erin.jpf.go.jp/en/lesson/03/basic/", deliveryMode: "frame-or-link", metadata: { shelf: false },
  },
  {
    id: "erin-04", sourceId: "erin", name: "Erin's Challenge", resourceType: "lesson", level: "N5", url: "https://www.erin.jpf.go.jp/en/lesson/04/basic/", deliveryMode: "frame-or-link", metadata: { shelf: false },
  },
  {
    id: "erin-06", sourceId: "erin", name: "Erin's Challenge", resourceType: "lesson", level: "N5", url: "https://www.erin.jpf.go.jp/en/lesson/06/basic/", deliveryMode: "frame-or-link", metadata: { shelf: false },
  },
  {
    id: "erin-08", sourceId: "erin", name: "Erin's Challenge", resourceType: "lesson", level: "N5", url: "https://www.erin.jpf.go.jp/en/lesson/08/basic/", deliveryMode: "frame-or-link", metadata: { shelf: false },
  },
  { id: "cejc", sourceId: "cejc", name: "CEJC", description: "Authorized conversational corpus listening and naturalness evidence.", resourceType: "listening", url: "https://chunagon.ninjal.ac.jp/shc/", deliveryMode: "link-only", metadata: { role: "real conversational patterns", rightsBehavior: "authorized-session-only" } },
  { id: "csj", sourceId: "csj", name: "CSJ", description: "Authorized spoken-corpus listening for broad spoken Japanese exposure.", resourceType: "listening", url: "https://chunagon.ninjal.ac.jp/auth/login", deliveryMode: "link-only", metadata: { role: "spoken-corpus exposure", rightsBehavior: "authorized-session-only" } },
  { id: "common-voice", sourceId: "common-voice", name: "Common Voice Japanese", description: "Broad human-speaker exposure without re-hosting the dataset.", resourceType: "listening", url: "https://mozilladatacollective.com/datasets/cmqim4lxy00tunr07cjkcupeg", deliveryMode: "link-only", metadata: { role: "diverse human voices", rightsBehavior: "provider-hosted" } },
  { id: "tatoeba", sourceId: "tatoeba", name: "Tatoeba audio", description: "Sentence-level human recordings with contributor-level attribution.", resourceType: "listening", url: "https://tatoeba.org/en/audio/index/jpn", deliveryMode: "link-only", metadata: { role: "sentence-linked human audio", rightsBehavior: "provider-hosted" } },
  { id: "jsut", sourceId: "jsut", name: "JSUT", description: "Clean Japanese speech corpus for controlled listening exposure.", resourceType: "listening", url: "https://sites.google.com/site/shinnosuketakamichi/publication/jsut", deliveryMode: "link-only", metadata: { role: "controlled speech", rightsBehavior: "provider-hosted" } },
  { id: "japanese-pod101", sourceId: "japanese-pod101", name: "JapanesePod101", description: "Polished learner-oriented beginner listening material.", resourceType: "listening", url: "https://www.japanesepod101.com/begin/", deliveryMode: "link-only", metadata: { role: "polished learner listening", rightsBehavior: "provider-hosted" } },
  { id: "tae-kim-grammar", sourceId: "tae-kim", name: "Tae Kim's Guide", title: "Alternative grammar explanation", description: "A structural, Japanese-first alternative explanation for mapped grammar points.", resourceType: "grammar-reference", url: "https://guidetojapanese.org/learn/grammar", deliveryMode: "reference", tags: ["alternative-explanation"], license: "CC BY-NC-SA 3.0", attribution: "Tae Kim's Guide to Japanese", transformAllowed: false, metadata: { role: "alternative grammar intuition", rightsBehavior: "deep-link; do-not-relabel-source-prose" } },
  { id: "wikibooks-japanese-grammar", sourceId: "wikibooks-japanese", name: "Wikibooks Japanese", title: "Japanese grammar reference", description: "Supplementary reference for particles, counters, conjugation, and pronunciation.", resourceType: "reference", url: "https://en.wikibooks.org/wiki/Japanese_Grammar", deliveryMode: "reference", tags: ["reference"], license: "CC BY-SA 4.0 / GFDL", attribution: "Wikibooks Japanese", transformAllowed: false, metadata: { role: "supplementary grammar reference", rightsBehavior: "MediaWiki API with attribution" } },
  { id: "wikimedia-commons-lingua-libre", sourceId: "wikimedia-commons", name: "Wikimedia Commons / Lingua Libre", title: "Human pronunciation", description: "Resolve compatible Japanese recordings dynamically without downloading the library.", resourceType: "pronunciation", url: "https://commons.wikimedia.org/wiki/Category:Japanese_pronunciation", deliveryMode: "dynamic", tags: ["human-audio", "pronunciation"], metadata: { role: "dynamic human pronunciation", rightsBehavior: "per-file-license-validation" } },
  { id: "aozora-bunko", sourceId: "aozora-bunko", name: "Aozora Bunko", title: "Native reading", description: "Long-form native reading for later immersion, with estimated difficulty.", resourceType: "native-reading", url: "https://www.aozora.gr.jp/", deliveryMode: "dynamic", tags: ["native-reading"], metadata: { role: "native reading", rightsBehavior: "public-domain-status-filter" } },
  { id: "tadoku-free-books", sourceId: "tadoku", name: "Free Tadoku Books", title: "Graded extensive reading", description: "Provider-hosted unchanged graded readers for beginner extensive reading.", resourceType: "graded-reader", level: "Start", url: "https://tadoku.org/japanese/en/free-books-en/", deliveryMode: "frame-or-link", tags: ["graded-reading"], transformAllowed: false, metadata: { role: "graded extensive-reading", rightsBehavior: "unchanged-provider-hosted-content" } },
  { id: "irodori-practical-lessons", sourceId: "irodori", name: "Irodori", title: "Practical Japanese lessons", description: "Can-do lessons, practical contexts, and source-hosted resources that reinforce Kizashi study.", resourceType: "lesson", level: "Beginner", url: "https://www.irodori.jpf.go.jp/en/", deliveryMode: "frame-or-link", tags: ["can-do", "real-world-practice"], transformAllowed: false, metadata: { role: "practical situational practice", rightsBehavior: "official-source-resource" } },
] satisfies ExternalResource[]).map(freezeResource));

export const externalResources = registry;

export function getExternalResources(filters: ExternalResourceFilters = {}): ReadonlyArray<Readonly<ExternalResource>> {
  return registry.filter((resource) => {
    if (resource.metadata?.shelf === false) return false;
    if (filters.itemId && !resource.targetItemIds?.includes(filters.itemId)) return false;
    if (filters.skill && !resource.targetSkills?.includes(filters.skill)) return false;
    if (filters.type && resource.resourceType !== filters.type) return false;
    if (filters.tag && !resource.tags?.includes(filters.tag)) return false;
    return true;
  });
}

export function getExternalResourceById(id: string): Readonly<ExternalResource> | undefined {
  return registry.find((resource) => resource.id === id);
}
