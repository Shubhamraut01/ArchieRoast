"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "Analyzing microservices…",
  "Finding circular dependencies…",
  "Counting single points of failure…",
  "Judging your database choices…",
  "Questioning the load balancer…",
  "Sharpening the roast…",
];

const INTERVAL_MS = 1600;

/** Cycles through status lines; stops on the last one rather than looping. */
export function LoadingMessages() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => Math.min(i + 1, MESSAGES.length - 1)),
      INTERVAL_MS,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div
      role="status"
      className="text-muted-foreground flex items-center gap-2 font-mono text-sm"
    >
      <span className="size-2 animate-pulse rounded-full bg-orange-500" />
      <span key={index} className="animate-in fade-in duration-300">
        {MESSAGES[index]}
      </span>
    </div>
  );
}
