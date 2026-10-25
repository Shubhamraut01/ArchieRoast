"use client";

import { useEffect, useState } from "react";

const INTERVAL_MS = 1600;

/** Cycles through status lines; stops on the last one rather than looping. */
export function LoadingMessages({ messages }: { messages: readonly string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => Math.min(i + 1, messages.length - 1)),
      INTERVAL_MS,
    );
    return () => clearInterval(id);
  }, [messages.length]);

  return (
    <div
      role="status"
      className="text-muted-foreground flex items-center gap-2 font-mono text-sm"
    >
      <span className="size-2 animate-pulse rounded-full bg-orange-500" />
      <span
        key={`${messages[0]}-${index}`}
        className="animate-in fade-in duration-300"
      >
        {messages[index]}
      </span>
    </div>
  );
}
