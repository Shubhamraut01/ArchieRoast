import {
  DIMENSIONS,
  type Analysis,
  type Carbon,
  type Change,
  type Dimension,
  type Inventory,
  type Issue,
  type Level,
  type Redesign,
  type RoastText,
} from "./types";

const LEVELS: Level[] = ["low", "medium", "high"];
const GRADES = ["A", "B", "C", "D", "E"] as const;

type Obj = Record<string, unknown>;

const obj = (v: unknown): Obj =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {};
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
/** Trims and caps a string, cutting at a word boundary with an ellipsis. */
const str = (v: unknown, max = 600): string => {
  if (typeof v !== "string") return "";
  const t = v.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ") > max * 0.6 ? cut.lastIndexOf(" ") : max).trimEnd()}…`;
};
const level = (v: unknown): Level =>
  LEVELS.includes(v as Level) ? (v as Level) : "medium";
const dimension = (v: unknown): Dimension =>
  DIMENSIONS.includes(v as Dimension) ? (v as Dimension) : "reliability";
const score = (v: unknown): number => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(10, Math.max(1, n)) : 5;
};

export function validateInventory(raw: unknown): Inventory {
  const o = obj(raw);
  const components = arr(o.components).flatMap((c) => {
    const x = obj(c);
    const name = str(x.name, 80);
    return name
      ? [
          {
            name,
            kind: str(x.kind, 40) || "component",
            notes: str(x.notes, 200) || undefined,
          },
        ]
      : [];
  });
  const connections = arr(o.connections).flatMap((c) => {
    const x = obj(c);
    const from = str(x.from, 80);
    const to = str(x.to, 80);
    return from && to
      ? [{ from, to, label: str(x.label, 80) || undefined }]
      : [];
  });
  if (o.isArchitecture !== false && components.length === 0) {
    throw new Error("Inventory has no components.");
  }
  return {
    isArchitecture: o.isArchitecture !== false,
    summary: str(o.summary, 500),
    components: components.slice(0, 40),
    connections: connections.slice(0, 80),
    regions: arr(o.regions)
      .map((r) => str(r, 40))
      .filter(Boolean)
      .slice(0, 10),
  };
}

function validateCarbon(raw: unknown): Carbon {
  const o = obj(raw);
  const grade = GRADES.includes(o.grade as Carbon["grade"])
    ? (o.grade as Carbon["grade"])
    : "C";
  return {
    grade,
    summary: str(o.summary, 400),
    drivers: arr(o.drivers)
      .flatMap((d) => {
        const x = obj(d);
        const driver = str(x.driver, 100);
        return driver
          ? [{ driver, level: level(x.level), note: str(x.note, 240) }]
          : [];
      })
      .slice(0, 6),
    assumptions: str(o.assumptions, 400),
  };
}

export function validateAnalysis(raw: unknown): Analysis {
  const o = obj(raw);
  const s = obj(o.scores);
  const scores = Object.fromEntries(
    DIMENSIONS.map((d) => [d, score(s[d])]),
  ) as Analysis["scores"];

  const issues: Issue[] = arr(o.issues)
    .flatMap((i) => {
      const x = obj(i);
      const title = str(x.title, 140);
      return title
        ? [
            {
              title,
              severity: level(x.severity),
              dimension: dimension(x.dimension),
              detail: str(x.detail, 420),
            },
          ]
        : [];
    })
    .slice(0, 8);

  const changes: Change[] = arr(o.changes)
    .flatMap((c) => {
      const x = obj(c);
      const problem = str(x.problem, 260);
      const change = str(x.change, 420);
      if (!problem || !change) return [];
      const affects = arr(x.affects).map(dimension);
      return [
        {
          problem,
          change,
          effort: level(x.effort),
          impact: level(x.impact),
          affects: [...new Set(affects)].slice(0, 3),
        },
      ];
    })
    .slice(0, 8);

  if (changes.length === 0)
    throw new Error("Analysis has no proposed changes.");

  const doFirst = arr(o.doFirst)
    .map((t) => str(t, 200))
    .filter(Boolean)
    .slice(0, 3);

  return {
    scores,
    issues,
    changes,
    doFirst: doFirst.length
      ? doFirst
      : changes.slice(0, 3).map((c) => c.change),
    carbon: validateCarbon(o.carbon),
  };
}

export function validateRoast(raw: unknown): RoastText {
  const o = obj(raw);
  const roast = str(o.roast, 2500);
  if (!roast) throw new Error("Roast is empty.");
  return { roast, advice: str(o.advice, 500) };
}

/** Strips code fences and rejects anything that is not a flowchart. */
export function validateRedesign(raw: unknown): Redesign {
  const o = obj(raw);
  const mermaid = str(o.mermaid, 6000)
    .replace(/^```(?:mermaid)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  if (!/^(flowchart|graph)\s+(TD|TB|LR|RL|BT)\b/i.test(mermaid)) {
    throw new Error("Redesign is not a Mermaid flowchart.");
  }
  return { mermaid, summary: str(o.summary, 600) };
}
