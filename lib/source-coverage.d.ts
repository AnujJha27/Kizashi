export interface ExternalSourceCoverageItem {
  readonly id: string;
  readonly category: string;
  readonly sourceIds?: readonly string[];
}

export interface ExternalSourceCoverageInput {
  readonly items?: readonly ExternalSourceCoverageItem[];
  readonly taeKimMappings?: Record<string, unknown>;
  readonly wikibooksMappings?: Record<string, unknown>;
  readonly irodoriResources?: readonly { targetItemIds?: readonly string[] }[];
  readonly tadokuEntries?: readonly unknown[];
  readonly aozoraEnabled?: boolean;
}

export interface ExternalSourceCoverage {
  readonly grammar: {
    readonly taeKim: { covered: number; total: number };
    readonly wikibooks: { covered: number; total: number };
  };
  readonly vocabulary: { commons: { covered: null; total: number; status: "on-demand" } };
  readonly irodori: { covered: number; total: number };
  readonly reading: { tadoku: number; aozora: boolean };
}

export declare function getExternalSourceCoverage(input?: ExternalSourceCoverageInput): ExternalSourceCoverage;
