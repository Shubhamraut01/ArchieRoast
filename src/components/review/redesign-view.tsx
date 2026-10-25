"use client";

import { useEffect, useId, useState } from "react";
import { Check, Copy, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Redesign } from "@/lib/review/types";

type Props = {
  redesign: Redesign;
  /** Object URL or data URL of the diagram the user uploaded. */
  beforeSrc: string | null;
};

export function RedesignView({ redesign, beforeSrc }: Props) {
  const rawId = useId();
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Loaded on demand: mermaid is large and only needed here.
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          securityLevel: "strict",
          flowchart: { htmlLabels: false },
        });
        const id = `mmd-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
        const { svg } = await mermaid.render(id, redesign.mermaid);
        if (!cancelled) setSvg(svg);
      } catch (err) {
        console.error("mermaid render failed", err);
        if (!cancelled)
          setError("Couldn't draw this diagram. The source is below.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [redesign.mermaid, rawId]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(redesign.mermaid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; nothing to recover.
    }
  }

  function download() {
    if (!svg) return;
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "improved-architecture.svg";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="animate-in fade-in slide-in-from-bottom-2 space-y-3 duration-500">
      <h3 className="text-sm font-semibold">Improved architecture</h3>
      {redesign.summary && (
        <p className="text-muted-foreground text-xs">{redesign.summary}</p>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {beforeSrc && (
          <figure className="space-y-1.5">
            <figcaption className="text-muted-foreground text-[11px] tracking-wide uppercase">
              Before
            </figcaption>
            <div className="flex min-h-40 items-center justify-center overflow-hidden rounded-lg border bg-black/40 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
              <img
                src={beforeSrc}
                alt="Original diagram"
                className="max-h-72 w-auto object-contain"
              />
            </div>
          </figure>
        )}
        <figure className={`space-y-1.5 ${beforeSrc ? "" : "md:col-span-2"}`}>
          <figcaption className="text-[11px] tracking-wide text-emerald-400 uppercase">
            After
          </figcaption>
          <div className="flex min-h-40 items-center justify-center overflow-auto rounded-lg border border-emerald-500/30 bg-black/40 p-2">
            {svg ? (
              <div
                className="[&_svg]:h-auto [&_svg]:max-h-80 [&_svg]:max-w-full"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            ) : error ? (
              <p className="text-xs text-red-400">{error}</p>
            ) : (
              <p className="text-muted-foreground text-xs">Drawing…</p>
            )}
          </div>
        </figure>
      </div>

      {error && (
        <pre className="text-muted-foreground overflow-x-auto rounded-lg border p-3 text-[11px]">
          {redesign.mermaid}
        </pre>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={copy}>
          {copied ? <Check /> : <Copy />}
          {copied ? "Copied" : "Copy Mermaid code"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={download}
          disabled={!svg}
        >
          <Download />
          Download SVG
        </Button>
      </div>
    </section>
  );
}
