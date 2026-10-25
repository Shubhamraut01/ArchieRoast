import { Info } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

const STACK = [
  {
    label: "Frontend",
    value:
      "Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui",
  },
  {
    label: "API",
    value:
      "Next.js route handler. Validates the file signature and size, and the browser downscales images before upload.",
  },
  {
    label: "AI",
    value:
      "A vision-and-reasoning model on JarvisLabs GPUs, called through its OpenAI-compatible endpoint with the OpenAI SDK. Four steps: extract, analyse, roast, redesign.",
  },
  {
    label: "Orchestration",
    value:
      "Temporal runs each review step as a durable workflow with automatic retries and a replayable history.",
  },
  {
    label: "Diagrams",
    value:
      "Mermaid (open source) draws the improved architecture in the browser.",
  },
  {
    label: "UX",
    value:
      "Results stream in as each step finishes, with a typewriter reveal, paste and drag-and-drop upload, and a token and energy footer.",
  },
] as const;

export function TechStack() {
  return (
    <Popover>
      <PopoverTrigger
        aria-label="About the tech stack"
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 flex size-7 items-center justify-center rounded-full border transition-colors focus-visible:ring-[3px] focus-visible:outline-none"
      >
        <Info className="size-4" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 gap-3 p-4">
        <PopoverHeader>
          <PopoverTitle>Tech stack</PopoverTitle>
          <PopoverDescription>
            What Archi Analyser is built with.
          </PopoverDescription>
        </PopoverHeader>
        <dl className="space-y-2.5 text-xs">
          {STACK.map((item) => (
            <div key={item.label}>
              <dt className="font-semibold tracking-wide text-orange-400 uppercase">
                {item.label}
              </dt>
              <dd className="text-muted-foreground mt-0.5">{item.value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-muted-foreground border-t pt-3 text-xs">
          Thanks to our sponsors{" "}
          <span className="text-foreground">JarvisLabs</span>,{" "}
          <span className="text-foreground">Kepler</span> and{" "}
          <span className="text-foreground">Temporal</span>.
        </p>
      </PopoverContent>
    </Popover>
  );
}
