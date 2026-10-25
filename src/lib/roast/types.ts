export type Severity = "low" | "medium" | "high";

export type RoastIssue = {
  title: string;
  severity: Severity;
};

export type RoastResult = {
  /** The roast itself, a few short paragraphs. */
  roast: string;
  /** 1 (clean) to 10 (spaghetti). */
  score: number;
  issues: RoastIssue[];
  /** One genuinely useful improvement, stated plainly. */
  advice: string;
};

/** A data URL, e.g. "data:image/png;base64,....". */
export type RoastProvider = (imageDataUrl: string) => Promise<RoastResult>;
