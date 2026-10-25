import { Badge } from "@/components/ui/badge";
import type { Inventory } from "@/lib/review/types";

export function InventoryView({ inventory }: { inventory: Inventory }) {
  return (
    <section className="animate-in fade-in slide-in-from-bottom-2 space-y-2 duration-500">
      <h3 className="text-sm font-semibold">What I see</h3>
      {inventory.summary && (
        <p className="text-muted-foreground text-xs">{inventory.summary}</p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {inventory.components.map((c) => (
          <Badge key={c.name} variant="outline" title={c.notes || c.kind}>
            {c.name}
            <span className="text-muted-foreground ml-1">· {c.kind}</span>
          </Badge>
        ))}
      </div>
      <p className="text-muted-foreground text-[11px]">
        {inventory.components.length} components, {inventory.connections.length}{" "}
        connections. If something is wrong here, the review will be too.
      </p>
    </section>
  );
}
