import { DIMENSIONS, type Analysis } from "@/lib/review/types";

/** 1 (clean) to 10 (spaghetti), derived from the six dimension scores. */
export function spaghettiScore(scores: Analysis["scores"]): number {
  const avg =
    DIMENSIONS.reduce((sum, d) => sum + scores[d], 0) / DIMENSIONS.length;
  return Math.min(10, Math.max(1, 11 - Math.round(avg)));
}

function barColor(score: number) {
  if (score >= 7) return "bg-emerald-500";
  if (score >= 5) return "bg-yellow-500";
  return "bg-red-500";
}

export function Scorecard({ scores }: { scores: Analysis["scores"] }) {
  const spaghetti = spaghettiScore(scores);
  return (
    <section className="animate-in fade-in slide-in-from-bottom-2 space-y-3 duration-500">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">Scorecard</h3>
        <p className="text-muted-foreground text-xs">
          <span className="text-2xl font-bold text-orange-500">
            {spaghetti}
          </span>
          /10 spaghetti
        </p>
      </div>
      <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {DIMENSIONS.map((d) => (
          <li key={d} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="capitalize">{d}</span>
              <span className="text-muted-foreground">{scores[d]}/10</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${barColor(scores[d])}`}
                style={{ width: `${scores[d] * 10}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
