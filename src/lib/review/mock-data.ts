import type { Analysis, Inventory, Redesign, RoastText } from "./types";

// Canned review of diagrams/architecture.png. Used when no JARVIS_* keys are
// set and by the "Try a sample" demo, so neither makes a model call.

export const MOCK_INVENTORY: Inventory = {
  isArchitecture: true,
  summary:
    "A browser app uploads a diagram to a single Next.js deployable that validates it, rate limits by IP and asks a vision model for a roast.",
  components: [
    {
      name: "Browser",
      kind: "client",
      notes: "Dropzone, paste, downscale, typewriter reveal",
    },
    { name: "App Router UI", kind: "service" },
    {
      name: "MIME + magic bytes, 4 MB",
      kind: "gateway",
      notes: "Input validation",
    },
    { name: "POST /api/roast", kind: "api" },
    { name: "20 req/min/IP", kind: "gateway", notes: "Rate limit" },
    { name: "Grounded rubric", kind: "service" },
    { name: "GPT-4o vision", kind: "ai-model" },
    {
      name: "Upstash Redis",
      kind: "cache",
      notes: "Optional, dashed link for quota",
    },
    {
      name: "Logs, traces, token cost",
      kind: "monitoring",
      notes: "Dashed, outside the request path",
    },
  ],
  connections: [
    {
      from: "Browser",
      to: "POST /api/roast",
      label: "image up / roast JSON down",
    },
    {
      from: "POST /api/roast",
      to: "GPT-4o vision",
      label: "image + rubric / roast JSON",
    },
    { from: "POST /api/roast", to: "Upstash Redis", label: "quota, optional" },
    {
      from: "POST /api/roast",
      to: "Logs, traces, token cost",
      label: "logs, cost",
    },
  ],
  regions: [],
};

export const MOCK_ANALYSIS: Analysis = {
  scores: {
    reliability: 4,
    security: 5,
    scalability: 6,
    cost: 4,
    observability: 4,
    sustainability: 5,
  },
  issues: [
    {
      title: "Rate limiting depends on an optional Redis",
      severity: "high",
      dimension: "security",
      detail:
        "A per-IP limit inside stateless serverless functions is not shared across instances. Without Redis there is effectively no limit, and every request costs a model call.",
    },
    {
      title: "Single vision provider, no fallback",
      severity: "high",
      dimension: "reliability",
      detail:
        "Every roast depends on one external model. An outage or quota error takes the whole product down.",
    },
    {
      title: "UI, validation and AI orchestration share one deployable",
      severity: "medium",
      dimension: "scalability",
      detail:
        "Fine at this scale, but a slow model call holds a function open and couples frontend deploys to API changes.",
    },
    {
      title: "Cost and error signals sit outside any alerting",
      severity: "medium",
      dimension: "observability",
      detail:
        "Logs and token cost are collected, but nothing pages anyone when spend or error rate spikes.",
    },
  ],
  changes: [
    {
      problem: "Rate limit is optional and per-instance",
      change:
        "Make Upstash Redis required and use a sliding-window limiter keyed by IP",
      effort: "low",
      impact: "high",
      affects: ["security", "cost"],
    },
    {
      problem: "Single model provider",
      change:
        "Put a second model behind the same provider interface and fail over on errors",
      effort: "medium",
      impact: "high",
      affects: ["reliability"],
    },
    {
      problem: "Identical uploads are re-analysed every time",
      change: "Cache results by image hash in Redis for 24 hours",
      effort: "low",
      impact: "medium",
      affects: ["cost", "sustainability"],
    },
    {
      problem: "No alerting on spend or errors",
      change:
        "Add daily token-budget and error-rate alerts on the existing logs",
      effort: "low",
      impact: "medium",
      affects: ["observability", "cost"],
    },
    {
      problem: "Large images sent at full size to the model",
      change:
        "Downscale to 1536px server-side as well and reject oversize payloads early",
      effort: "low",
      impact: "low",
      affects: ["cost", "sustainability"],
    },
  ],
  doFirst: [
    "Make Upstash Redis required and use a sliding-window limiter keyed by IP",
    "Cache results by image hash in Redis for 24 hours",
    "Add daily token-budget and error-rate alerts on the existing logs",
  ],
  carbon: {
    grade: "C",
    summary:
      "Lean hosting, but every request triggers a large vision-model call with no caching, and that call dominates the footprint.",
    drivers: [
      {
        driver: "Vision-model call on every request",
        level: "high",
        note: "GPU inference is the most energy-hungry step and nothing is cached or batched.",
      },
      {
        driver: "Serverless hosting",
        level: "low",
        note: "Scales to zero when idle, so there is little wasted always-on capacity.",
      },
      {
        driver: "Repeated analysis of identical inputs",
        level: "medium",
        note: "Without a cache, the same diagram can be re-processed many times.",
      },
    ],
    assumptions:
      "Assumes Vercel serverless hosting, one model call per roast and typical traffic.",
  },
};

export const MOCK_ROAST: RoastText = {
  roast:
    "Congratulations, you built a system whose headline feature is \"one deployable\" and then drew five boxes inside it like that's a flex. Next.js is doing the UI, the validation, the rate limiting and the AI orchestration. It's not a monolith, it's a Swiss Army knife with a Vercel invoice.\n\nI do respect the magic-byte check and the 4MB cap. But your rate limiter lives in an optional Redis, which is like installing a smoke detector and keeping the battery as a nice-to-have. And everything funnels into one vision provider with no fallback, so when GPT-4o has a bad day, so does your product.\n\nAnd the planet would like a word: every upload fires a fresh GPU call, even when someone uploads the same diagram for the tenth time. Serverless keeps the idle footprint tiny, then the model call eats it all. A cache would be the greenest feature you never built.",
  advice:
    "Make the rate limiter a hard dependency and cache results by image hash. It protects your budget, your uptime and your carbon footprint with one change.",
};

export const MOCK_REDESIGN: Redesign = {
  mermaid: `flowchart LR
  browser["Browser - dropzone and typewriter"] -->|"image up"| api["POST api roast"]
  api --> validate["MIME and magic bytes, 4 MB"]
  api --> limiter["Sliding window limiter - changed"]
  limiter --> redis["Upstash Redis - now required"]
  api --> cache["Result cache by image hash - new"]
  cache --> redis
  api --> primary["Vision model"]
  api -.->|"on failure"| fallback["Fallback model - new"]
  api --> logs["Logs, traces, token cost"]
  logs --> alerts["Spend and error alerts - new"]`,
  summary:
    "Redis becomes a hard dependency that powers both a shared rate limiter and a result cache. A second model sits behind the same interface for failover, and alerts now watch spend and error rate.",
};
