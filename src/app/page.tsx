import { Badge } from "@/components/ui/badge";
import { RoastCard } from "@/components/roast-card";
import { Sponsors } from "@/components/sponsors";
import { TechStack } from "@/components/tech-stack";

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[-20%] mx-auto h-[500px] w-[800px] rounded-full bg-orange-500/20 blur-[140px]"
      />

      <Sponsors />

      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <span className="font-mono text-sm font-semibold tracking-tight">
          archi<span className="text-orange-500">.</span>analyser
        </span>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">
            beta
          </Badge>
          <TechStack />
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-8 px-6 pb-16 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Your architecture diagram,{" "}
            <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              roasted.
            </span>
          </h1>
          <p className="text-muted-foreground text-balance">
            Upload a diagram. Get a brutally honest review of your single points
            of failure, circular dependencies and questionable life choices.
          </p>
        </div>

        <RoastCard />
      </main>

      <footer className="text-muted-foreground relative z-10 pb-6 text-center text-xs">
        No diagrams were harmed. Egos might be.
      </footer>
    </div>
  );
}
