"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Leaf, RotateCcw } from "lucide-react";

import { Dropzone } from "@/components/dropzone";
import { LoadingMessages } from "@/components/loading-messages";
import { CarbonCard } from "@/components/review/carbon-card";
import { ChangesTable } from "@/components/review/changes-table";
import { InventoryView } from "@/components/review/inventory";
import { RedesignView } from "@/components/review/redesign-view";
import { Scorecard, spaghettiScore } from "@/components/review/scorecard";
import { UsageFooter } from "@/components/review/usage-footer";
import { TemporalProof } from "@/components/temporal-proof";
import { Typewriter } from "@/components/typewriter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prepareImage } from "@/lib/image";
import { sumUsage } from "@/lib/review/energy";
import {
  MOCK_ANALYSIS,
  MOCK_INVENTORY,
  MOCK_REDESIGN,
  MOCK_ROAST,
} from "@/lib/review/mock-data";
import type {
  Analysis,
  Inventory,
  Redesign,
  RoastText,
  Stage,
  StageResponse,
  Usage,
} from "@/lib/review/types";
import { SAMPLE_IMAGE_DATA_URL } from "@/lib/sample-image";
import type { TemporalInfo } from "@/temporal/types";
import { isSampleFile } from "@/lib/sample";

type MainStage = Exclude<Stage, "redesign">;

type Phase =
  | { kind: "idle" }
  | { kind: "running"; stage: MainStage }
  | { kind: "error"; stage: MainStage; message: string }
  | { kind: "done" };

type RedesignState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; data: Redesign };

const MESSAGES: Record<Stage, readonly string[]> = {
  extract: [
    "Reading your diagram…",
    "Counting boxes and arrows…",
    "Squinting at the small text…",
  ],
  analyse: [
    "Hunting single points of failure…",
    "Finding circular dependencies…",
    "Judging your database choices…",
    "Checking the carbon footprint…",
    "Drafting fixes…",
  ],
  roast: [
    "Sharpening the roast…",
    "Finding the funniest flaw…",
    "Writing it up…",
  ],
  redesign: [
    "Redrawing the architecture…",
    "Applying the fixes…",
    "Laying out the boxes…",
  ],
};

const SAMPLE_DATA = {
  extract: MOCK_INVENTORY,
  analyse: MOCK_ANALYSIS,
  roast: MOCK_ROAST,
  redesign: MOCK_REDESIGN,
} as const;
const SAMPLE_WAIT_MS: Record<Stage, number> = {
  extract: 3500,
  analyse: 4500,
  roast: 2500,
  redesign: 3000,
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The sample plays canned data with a realistic wait; nothing leaves the browser. */
async function sampleStage(stage: Stage): Promise<StageResponse<never>> {
  await sleep(SAMPLE_WAIT_MS[stage] + Math.random() * 1500);
  return { data: SAMPLE_DATA[stage] as never, usage: null };
}

/** Stage response; `temporal` is present only when TEMPORAL_ENABLED on the server. */
type ApiStageResponse<T> = StageResponse<T> & { temporal?: TemporalInfo };

async function apiStage<T>(
  payload: Record<string, unknown>,
): Promise<ApiStageResponse<T>> {
  const res = await fetch("/api/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? "Something went wrong.");
  return body as ApiStageResponse<T>;
}

function toMarkdown(inv: Inventory, a: Analysis, r: RoastText): string {
  const rows = a.changes
    .map(
      (c) =>
        `| ${c.problem} | ${c.change} | ${c.effort} | ${c.impact} | ${c.affects.join(", ")} |`,
    )
    .join("\n");
  return [
    `# Architecture review`,
    ``,
    inv.summary,
    ``,
    `**Spaghetti score:** ${spaghettiScore(a.scores)}/10 · **Carbon grade:** ${a.carbon.grade}`,
    ``,
    r.roast,
    ``,
    `**The actual fix:** ${r.advice}`,
    ``,
    `## Proposed changes`,
    `| Problem | Change | Effort | Impact | Affects |`,
    `|---|---|---|---|---|`,
    rows,
    ``,
    `_Reviewed by Archi Analyser. Carbon grade is an estimate from the diagram, not a measurement._`,
  ].join("\n");
}

export function ReviewFlow() {
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [roast, setRoast] = useState<RoastText | null>(null);
  const [redesign, setRedesign] = useState<RedesignState>({ status: "idle" });
  const [usages, setUsages] = useState<Usage[]>([]);
  const [temporal, setTemporal] = useState<TemporalInfo[]>([]);
  const [typed, setTyped] = useState(false);
  const [copied, setCopied] = useState(false);
  const [beforeSrc, setBeforeSrc] = useState<string | null>(null);
  // Bumping this remounts the dropzone, clearing its selected file.
  const [dropzoneKey, setDropzoneKey] = useState(0);

  const fileRef = useRef<File | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const onTyped = useCallback(() => setTyped(true), []);

  // Keep newly arrived sections in view.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [inventory, analysis, roast, typed, redesign.status]);

  // The "before" image is an object URL we own, so we revoke it.
  useEffect(() => {
    return () => {
      if (beforeSrc) URL.revokeObjectURL(beforeSrc);
    };
  }, [beforeSrc]);

  function addResult(r: ApiStageResponse<unknown>) {
    if (r.usage) setUsages((prev) => [...prev, r.usage as Usage]);
    if (r.temporal)
      setTemporal((prev) => [...prev, r.temporal as TemporalInfo]);
  }

  function resetResults() {
    setPhase({ kind: "idle" });
    setInventory(null);
    setAnalysis(null);
    setRoast(null);
    setRedesign({ status: "idle" });
    setUsages([]);
    setTemporal([]);
    setTyped(false);
    setCopied(false);
  }

  const onClear = useCallback(() => {
    resetResults();
    setBeforeSrc(null);
  }, []);

  /** Runs stages from `from` onward, reusing earlier results when retrying. */
  async function run(
    file: File,
    from: MainStage,
    seed: { inventory: Inventory | null; analysis: Analysis | null },
  ) {
    const sample = isSampleFile(file);
    const call = <T,>(stage: Stage, payload: Record<string, unknown>) =>
      sample
        ? (sampleStage(stage) as Promise<ApiStageResponse<T>>)
        : apiStage<T>({ stage, ...payload });

    let stage: MainStage = from;
    try {
      let inv = seed.inventory;
      let an = seed.analysis;

      if (from === "extract") {
        stage = "extract";
        setPhase({ kind: "running", stage });
        const image = sample ? SAMPLE_IMAGE_DATA_URL : await prepareImage(file);
        const r = await call<Inventory>("extract", { image });
        inv = r.data;
        setInventory(inv);
        addResult(r);
        if (!inv.isArchitecture) {
          setPhase({ kind: "done" });
          return;
        }
      }
      if (from !== "roast") {
        stage = "analyse";
        setPhase({ kind: "running", stage });
        const r = await call<Analysis>("analyse", { inventory: inv });
        an = r.data;
        setAnalysis(an);
        addResult(r);
      }
      stage = "roast";
      setPhase({ kind: "running", stage });
      const r = await call<RoastText>("roast", {
        inventory: inv,
        analysis: an,
      });
      setRoast(r.data);
      addResult(r);
      setPhase({ kind: "done" });
    } catch (err) {
      setPhase({
        kind: "error",
        stage,
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  }

  function handleRoast(file: File) {
    resetResults();
    fileRef.current = file;
    setBeforeSrc(URL.createObjectURL(file));
    void run(file, "extract", { inventory: null, analysis: null });
  }

  function retry() {
    if (phase.kind !== "error" || !fileRef.current) return;
    void run(fileRef.current, phase.stage, { inventory, analysis });
  }

  async function generateRedesign() {
    if (!inventory || !analysis || !fileRef.current) return;
    setRedesign({ status: "loading" });
    try {
      const sample = isSampleFile(fileRef.current);
      const r = sample
        ? ((await sampleStage("redesign")) as ApiStageResponse<Redesign>)
        : await apiStage<Redesign>({ stage: "redesign", inventory, analysis });
      addResult(r);
      setRedesign({ status: "done", data: r.data });
    } catch (err) {
      setRedesign({
        status: "error",
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  }

  async function copyReview() {
    if (!inventory || !analysis || !roast) return;
    try {
      await navigator.clipboard.writeText(
        toMarkdown(inventory, analysis, roast),
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; nothing to recover.
    }
  }

  function startOver() {
    resetResults();
    setBeforeSrc(null);
    setDropzoneKey((k) => k + 1);
  }

  const running = phase.kind === "running";
  const busy = running || redesign.status === "loading";
  const total = sumUsage(usages);

  return (
    <Card className="w-full text-left">
      <CardHeader>
        <CardTitle>Drop your diagram</CardTitle>
        <CardDescription>
          A free architecture review: roast, fixes and a carbon check. Your
          image is analysed once and never stored.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Dropzone
          key={dropzoneKey}
          onRoast={handleRoast}
          onClear={onClear}
          disabled={busy}
        />

        {inventory && !inventory.isArchitecture && (
          <p className="text-muted-foreground text-sm">
            That doesn&apos;t look like an architecture diagram. Try one with
            boxes, arrows and labels, or use the sample.
          </p>
        )}

        {inventory?.isArchitecture && <InventoryView inventory={inventory} />}
        {analysis && (
          <>
            <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
              <Scorecard scores={analysis.scores} />
              <CarbonCard carbon={analysis.carbon} />
            </div>
            <ChangesTable
              changes={analysis.changes}
              doFirst={analysis.doFirst}
            />
          </>
        )}

        {roast && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">The roast</h3>
            {/* key remounts the typewriter for each new roast */}
            <Typewriter key={roast.roast} text={roast.roast} onDone={onTyped} />
            {typed && roast.advice && (
              <div className="animate-in fade-in slide-in-from-bottom-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 duration-500">
                <p className="text-xs font-semibold tracking-wide text-emerald-400 uppercase">
                  The actual fix
                </p>
                <p className="mt-1 text-sm">{roast.advice}</p>
              </div>
            )}
            {typed && temporal.length > 0 && <TemporalProof runs={temporal} />}
          </section>
        )}

        {running && (
          <LoadingMessages key={phase.stage} messages={MESSAGES[phase.stage]} />
        )}

        {phase.kind === "error" && (
          <div
            role="alert"
            className="flex flex-wrap items-center gap-3 text-sm text-red-400"
          >
            <span>{phase.message}</span>
            <Button type="button" variant="outline" size="sm" onClick={retry}>
              <RotateCcw />
              Retry from this step
            </Button>
          </div>
        )}

        {typed && analysis && (
          <div className="animate-in fade-in space-y-4 duration-500">
            {redesign.status === "idle" && (
              <Button
                type="button"
                onClick={generateRedesign}
                className="bg-emerald-600 text-white hover:bg-emerald-600/90"
              >
                <Leaf />
                Generate improved diagram
              </Button>
            )}
            {redesign.status === "loading" && (
              <LoadingMessages key="redesign" messages={MESSAGES.redesign} />
            )}
            {redesign.status === "error" && (
              <div
                role="alert"
                className="flex flex-wrap items-center gap-3 text-sm text-red-400"
              >
                <span>{redesign.message}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateRedesign}
                >
                  <RotateCcw />
                  Try again
                </Button>
              </div>
            )}
            {redesign.status === "done" && (
              <RedesignView redesign={redesign.data} beforeSrc={beforeSrc} />
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyReview}
              >
                {copied ? <Check /> : <Copy />}
                {copied ? "Copied" : "Copy review as Markdown"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={startOver}
                disabled={busy}
              >
                <RotateCcw />
                Review another
              </Button>
            </div>

            {total && <UsageFooter usage={total} calls={usages.length} />}
          </div>
        )}

        <div ref={endRef} />
      </CardContent>
    </Card>
  );
}
