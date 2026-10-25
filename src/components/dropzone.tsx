"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Flame, ImageUp, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = ["image/png", "image/jpeg"];
const MAX_BYTES = 4 * 1024 * 1024;
const SAMPLE = {
  url: "/samples/sample-architecture.png",
  name: "sample-architecture.png",
};

type DropzoneProps = {
  onRoast: (file: File) => void;
  onClear?: () => void;
  disabled?: boolean;
};

function validate(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Only PNG or JPG images, please.";
  }
  if (file.size > MAX_BYTES) {
    return `That file is ${(file.size / 1024 / 1024).toFixed(1)}MB. Max is 4MB.`;
  }
  return null;
}

export function Dropzone({
  onRoast,
  onClear,
  disabled = false,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const file = selected?.file ?? null;
  const previewUrl = selected?.previewUrl ?? null;

  // Revoke the blob URL when it is replaced or the component unmounts.
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const accept = useCallback(
    (candidate: File | undefined) => {
      if (!candidate) return;
      const problem = validate(candidate);
      setError(problem);
      setSelected(
        problem
          ? null
          : { file: candidate, previewUrl: URL.createObjectURL(candidate) },
      );
      onClear?.();
    },
    [onClear],
  );

  // Paste a screenshot straight from the clipboard.
  useEffect(() => {
    if (disabled) return;
    function onPaste(e: ClipboardEvent) {
      const pasted = [...(e.clipboardData?.files ?? [])].find((f) =>
        f.type.startsWith("image/"),
      );
      if (pasted) accept(pasted);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [accept, disabled]);

  const clear = () => {
    setSelected(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    onClear?.();
  };

  async function loadSample() {
    try {
      const blob = await (await fetch(SAMPLE.url)).blob();
      accept(new File([blob], SAMPLE.name, { type: blob.type }));
    } catch {
      setError("Couldn't load the sample diagram.");
    }
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="sr-only"
        onChange={(e) => accept(e.target.files?.[0])}
      />

      {previewUrl && file ? (
        <div className="relative overflow-hidden rounded-lg border bg-black/40">
          {/* eslint-disable-next-line @next/next/no-img-element -- blob URL preview */}
          <img
            src={previewUrl}
            alt="Architecture diagram preview"
            className="mx-auto max-h-80 w-auto object-contain"
          />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-label="Remove image"
            disabled={disabled}
            onClick={clear}
            className="absolute top-2 right-2"
          >
            <X />
          </Button>
        </div>
      ) : (
        <>
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              accept(e.dataTransfer.files?.[0]);
            }}
            className={cn(
              "text-muted-foreground flex h-48 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-sm transition-colors",
              "hover:border-orange-500/60 hover:text-foreground focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none",
              dragging && "border-orange-500 bg-orange-500/10 text-foreground",
            )}
          >
            <ImageUp className="size-8" />
            <span>
              <span className="text-foreground font-medium">
                Click to upload
              </span>{" "}
              or drag and drop
            </span>
            <span className="text-xs">
              PNG or JPG, up to 4MB. You can also paste a screenshot.
            </span>
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={loadSample}
            className="text-muted-foreground hover:text-foreground mx-auto flex items-center gap-1.5 text-xs underline-offset-4 hover:underline"
          >
            <Sparkles className="size-3.5" />
            No diagram handy? Try a sample
          </button>
        </>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      {file && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-muted-foreground truncate text-xs">
            {file.name} · {(file.size / 1024).toFixed(0)}KB
          </p>
          <Button
            type="button"
            disabled={disabled}
            onClick={() => onRoast(file)}
            className="bg-orange-500 text-white hover:bg-orange-500/90"
          >
            <Flame />
            Roast it
          </Button>
        </div>
      )}
    </div>
  );
}
