import type { RoastProvider, RoastResult } from "./types";

const SAMPLES: RoastResult[] = [
  {
    score: 8,
    roast:
      "Ah, a single database that every service talks to. Bold. Why bother with microservices when you can have a distributed monolith with extra network latency?\n\nI count one load balancer, zero redundancy and an arrow that goes from the queue back to the thing that feeds the queue. That is not an event-driven architecture, that is a hamster wheel.",
    issues: [
      { title: "Shared database across services", severity: "high" },
      { title: "Circular dependency via the queue", severity: "high" },
      { title: "Single load balancer, no failover", severity: "medium" },
    ],
    advice:
      "Give each service its own datastore and communicate through events or APIs, so one team's schema change can't take everyone down.",
  },
  {
    score: 5,
    roast:
      "Not terrible, which is honestly the most insulting thing I can say. Someone read a blog post about caching and it shows.\n\nBut where is auth? Where are the retries? This diagram has the confidence of a system that has never been paged at 3am.",
    issues: [
      { title: "No auth layer shown", severity: "medium" },
      { title: "No retry or dead-letter handling", severity: "medium" },
      { title: "Cache has no invalidation story", severity: "low" },
    ],
    advice:
      "Put authentication at the edge and add retries with backoff plus a dead-letter queue around anything asynchronous.",
  },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Stand-in provider so the UI can be built before the real model is wired. */
export const mockRoast: RoastProvider = async () => {
  await sleep(2500);
  return SAMPLES[Math.floor(Math.random() * SAMPLES.length)];
};
