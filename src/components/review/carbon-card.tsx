import type { Carbon, Level } from "@/lib/review/types";

const GRADE_STYLE: Record<Carbon["grade"], string> = {
  A: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
  B: "bg-lime-500/15 text-lime-400 border-lime-500/40",
  C: "bg-yellow-500/15 text-yellow-400 border-yellow-500/40",
  D: "bg-orange-500/15 text-orange-400 border-orange-500/40",
  E: "bg-red-500/15 text-red-400 border-red-500/40",
};

const LEVEL_DOT: Record<Level, string> = {
  low: "bg-emerald-500",
  medium: "bg-yellow-500",
  high: "bg-red-500",
};

export function CarbonCard({ carbon }: { carbon: Carbon }) {
  return (
    <section className="animate-in fade-in slide-in-from-bottom-2 space-y-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 duration-500">
      <div className="flex items-start gap-3">
        <div
          className={`flex size-12 shrink-0 items-center justify-center rounded-lg border text-2xl font-bold ${GRADE_STYLE[carbon.grade]}`}
          aria-label={`Carbon grade ${carbon.grade}`}
        >
          {carbon.grade}
        </div>
        <div>
          <h3 className="text-sm font-semibold">Carbon roast</h3>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {carbon.summary}
          </p>
        </div>
      </div>
      {carbon.drivers.length > 0 && (
        <ul className="space-y-2">
          {carbon.drivers.map((d) => (
            <li key={d.driver} className="flex gap-2 text-xs">
              <span
                className={`mt-1 size-2 shrink-0 rounded-full ${LEVEL_DOT[d.level]}`}
                title={`${d.level} impact`}
              />
              <span>
                <span className="font-medium">{d.driver}</span>
                <span className="text-muted-foreground"> · {d.note}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {carbon.assumptions && (
        <p className="text-muted-foreground border-t border-emerald-500/20 pt-2 text-[11px]">
          Estimate, not a measurement. {carbon.assumptions}
        </p>
      )}
    </section>
  );
}
