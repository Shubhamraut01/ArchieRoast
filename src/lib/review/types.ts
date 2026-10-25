export const DIMENSIONS = [
  "reliability",
  "security",
  "scalability",
  "cost",
  "observability",
  "sustainability",
] as const;
export type Dimension = (typeof DIMENSIONS)[number];

export type Level = "low" | "medium" | "high";

/** Token usage reported by the model API, summed across calls. */
export type Usage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

// ---- Stage 1: extract -------------------------------------------------

export type Inventory = {
  /** False when the image is not an architecture diagram. */
  isArchitecture: boolean;
  summary: string;
  components: { name: string; kind: string; notes?: string }[];
  connections: { from: string; to: string; label?: string }[];
  /** Cloud regions or zones, only if labelled in the diagram. */
  regions: string[];
};

// ---- Stage 2: analyse -------------------------------------------------

export type Issue = {
  title: string;
  severity: Level;
  dimension: Dimension;
  detail: string;
};

export type Change = {
  problem: string;
  change: string;
  effort: Level;
  impact: Level;
  affects: Dimension[];
};

export type CarbonDriver = {
  driver: string;
  level: Level;
  note: string;
};

export type Carbon = {
  grade: "A" | "B" | "C" | "D" | "E";
  summary: string;
  drivers: CarbonDriver[];
  /** What the estimate assumes; shown to the user. */
  assumptions: string;
};

export type Analysis = {
  /** 1-10 per dimension, higher is better. */
  scores: Record<Dimension, number>;
  issues: Issue[];
  changes: Change[];
  /** Titles of the 3 changes to do first. */
  doFirst: string[];
  carbon: Carbon;
};

// ---- Stage 3: roast ---------------------------------------------------

export type RoastText = {
  roast: string;
  advice: string;
};

// ---- Stage 4: redesign ------------------------------------------------

export type Redesign = {
  /** Mermaid flowchart source for the improved architecture. */
  mermaid: string;
  /** What changed, one short paragraph. */
  summary: string;
};

export type Stage = "extract" | "analyse" | "roast" | "redesign";

/** Every stage response carries the usage it consumed. */
export type StageResponse<T> = { data: T; usage: Usage | null };
