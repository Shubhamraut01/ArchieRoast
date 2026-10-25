"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import type { Change, Level } from "@/lib/review/types";

const RANK: Record<Level, number> = { low: 0, medium: 1, high: 2 };

const LEVEL_STYLE: Record<Level, string> = {
  low: "border-emerald-500/40 text-emerald-400",
  medium: "border-yellow-500/40 text-yellow-400",
  high: "border-red-500/40 text-red-400",
};
// For impact, high is good, so flip the colours.
const IMPACT_STYLE: Record<Level, string> = {
  low: "border-red-500/40 text-red-400",
  medium: "border-yellow-500/40 text-yellow-400",
  high: "border-emerald-500/40 text-emerald-400",
};

type Sort = "bang" | "impact" | "effort";

const SORTS: { id: Sort; label: string }[] = [
  { id: "bang", label: "Best value" },
  { id: "impact", label: "Impact" },
  { id: "effort", label: "Easiest" },
];

export function ChangesTable({
  changes,
  doFirst,
}: {
  changes: Change[];
  doFirst: string[];
}) {
  const [sort, setSort] = useState<Sort>("bang");

  const rows = useMemo(() => {
    const value = (c: Change) => RANK[c.impact] * 3 - RANK[c.effort];
    return [...changes].sort((a, b) =>
      sort === "impact"
        ? RANK[b.impact] - RANK[a.impact]
        : sort === "effort"
          ? RANK[a.effort] - RANK[b.effort]
          : value(b) - value(a),
    );
  }, [changes, sort]);

  return (
    <section className="animate-in fade-in slide-in-from-bottom-2 space-y-3 duration-500">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Proposed changes</h3>
        <div className="flex gap-1" role="group" aria-label="Sort changes">
          {SORTS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSort(s.id)}
              aria-pressed={sort === s.id}
              className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                sort === s.id
                  ? "border-orange-500/60 bg-orange-500/10 text-orange-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {doFirst.length > 0 && (
        <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-3 text-xs">
          <p className="font-semibold tracking-wide text-orange-400 uppercase">
            Do these 3 first
          </p>
          <ol className="mt-1.5 list-inside list-decimal space-y-1">
            {doFirst.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[34rem] text-left text-xs">
          <thead className="text-muted-foreground bg-white/5">
            <tr>
              <th className="px-3 py-2 font-medium">Problem</th>
              <th className="px-3 py-2 font-medium">Proposed change</th>
              <th className="px-3 py-2 font-medium">Effort</th>
              <th className="px-3 py-2 font-medium">Impact</th>
              <th className="px-3 py-2 font-medium">Affects</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((c) => (
              <tr key={c.change} className="align-top">
                <td className="px-3 py-2">{c.problem}</td>
                <td className="px-3 py-2">{c.change}</td>
                <td className="px-3 py-2">
                  <Badge variant="outline" className={LEVEL_STYLE[c.effort]}>
                    {c.effort}
                  </Badge>
                </td>
                <td className="px-3 py-2">
                  <Badge variant="outline" className={IMPACT_STYLE[c.impact]}>
                    {c.impact}
                  </Badge>
                </td>
                <td className="text-muted-foreground px-3 py-2 capitalize">
                  {c.affects.join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
