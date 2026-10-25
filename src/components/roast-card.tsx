"use client";

import { useCallback, useState } from "react";
import { Check, Copy, RotateCcw } from "lucide-react";

import { Dropzone } from "@/components/dropzone";
import { LoadingMessages } from "@/components/loading-messages";
import { Typewriter } from "@/components/typewriter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prepareImage } from "@/lib/image";
import type { RoastResult } from "@/lib/roast";
import { isSampleFile, SAMPLE_ROAST } from "@/lib/sample";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; result: RoastResult };

const SEVERITY_STYLE = {
  high: "border-red-500/50 text-red-400",
  medium: "border-orange-500/50 text-orange-400",
  low: "border-yellow-500/50 text-yellow-400",
} as const;

function shareText(r: RoastResult) {
  return `${r.roast}\n\nSpaghetti score: ${r.score}/10\nThe fix: ${r.advice}\n\nRoasted by Archi Analyser`;
}

export function RoastCard() {
  const [state, setState] = useState<State>({ status: "idle" });
  const [typed, setTyped] = useState(false);
  const [copied, setCopied] = useState(false);
  // Bumping this remounts the dropzone, clearing its selected file.
  const [dropzoneKey, setDropzoneKey] = useState(0);
  const onTyped = useCallback(() => setTyped(true), []);
  const onClear = useCallback(() => setState({ status: "idle" }), []);

  async function handleRoast(file: File) {
    setTyped(false);
    setCopied(false);
    setState({ status: "loading" });

    // Sample path: canned roast, no network. Wait like a real model call.
    if (isSampleFile(file)) {
      await new Promise((r) => setTimeout(r, 6000 + Math.random() * 3000));
      setState({ status: "done", result: SAMPLE_ROAST });
      return;
    }

    try {
      const image = await prepareImage(file);
      const res = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setState({ status: "done", result: data as RoastResult });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  }

  async function copy(result: RoastResult) {
    try {
      await navigator.clipboard.writeText(shareText(result));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (e.g. insecure context); nothing to recover.
    }
  }

  function reset() {
    setState({ status: "idle" });
    setDropzoneKey((k) => k + 1);
  }

  return (
    <Card className="w-full text-left">
      <CardHeader>
        <CardTitle>Drop your diagram</CardTitle>
        <CardDescription>
          Your image is analysed once and never stored.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Dropzone
          key={dropzoneKey}
          onRoast={handleRoast}
          onClear={onClear}
          disabled={state.status === "loading"}
        />

        {state.status === "loading" && <LoadingMessages />}

        {state.status === "error" && (
          <p role="alert" className="text-sm text-red-400">
            {state.message}
          </p>
        )}

        {state.status === "done" && (
          <div
            ref={(el) =>
              el?.scrollIntoView({ behavior: "smooth", block: "nearest" })
            }
            className="space-y-4 border-t pt-4"
          >
            {/* key remounts the typewriter for each new roast */}
            <Typewriter
              key={state.result.roast}
              text={state.result.roast}
              onDone={onTyped}
            />
            {typed && (
              <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 duration-500">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-orange-500">
                    {state.result.score}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    / 10 spaghetti score
                  </span>
                </div>
                {state.result.issues.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {state.result.issues.map((issue) => (
                      <Badge
                        key={issue.title}
                        variant="outline"
                        className={SEVERITY_STYLE[issue.severity]}
                      >
                        {issue.title}
                      </Badge>
                    ))}
                  </div>
                )}
                {state.result.advice && (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                    <p className="text-xs font-semibold tracking-wide text-emerald-400 uppercase">
                      The actual fix
                    </p>
                    <p className="mt-1 text-sm">{state.result.advice}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copy(state.result)}
                  >
                    {copied ? <Check /> : <Copy />}
                    {copied ? "Copied" : "Copy roast"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={reset}
                  >
                    <RotateCcw />
                    Roast another
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
