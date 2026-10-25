"use client";

import { useEffect, useState } from "react";

const TICK_MS = 18;
const CHARS_PER_TICK = 2;

type TypewriterProps = {
  text: string;
  onDone?: () => void;
};

/**
 * Reveals `text` a few characters at a time. Mount it with a fresh `key`
 * per text; click to skip. Shows everything at once for reduced motion.
 */
export function Typewriter({ text, onDone }: TypewriterProps) {
  const [count, setCount] = useState(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? text.length
      : 0,
  );
  const done = count >= text.length;

  useEffect(() => {
    if (done) {
      onDone?.();
      return;
    }
    const id = setInterval(
      () => setCount((c) => Math.min(c + CHARS_PER_TICK, text.length)),
      TICK_MS,
    );
    return () => clearInterval(id);
  }, [done, text.length, onDone]);

  return (
    <p
      onClick={() => setCount(text.length)}
      className="cursor-pointer text-sm leading-relaxed whitespace-pre-line"
      aria-label={text}
    >
      <span aria-hidden>{text.slice(0, count)}</span>
      {!done && (
        <span
          aria-hidden
          className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-orange-500 align-middle"
        />
      )}
    </p>
  );
}
