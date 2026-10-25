# Temporal integration

Archi Analyser can run every review step as a **durable Temporal workflow**. A model call that times
out or fails is retried automatically, every attempt is recorded in a replayable history, and a step
survives the worker crashing mid-flight.

It is **off by default**. With `TEMPORAL_ENABLED` unset (or anything but `true`) the app behaves exactly
as before, so you can run it without Temporal installed.

## Architecture

```
Browser ──POST /api/review {stage}──▶ Next.js route
                                        │  TEMPORAL_ENABLED=true
                                        ▼
                         saveImage() ─ claim check (image only) ─▶ os.tmpdir()
                                        │
                      client.workflow.start("reviewStageWorkflow")
                                        │
                                        ▼
                               Temporal server (history, retries, timers)
                                        │  task queue "archie-roast"
                                        ▼
                                  Worker (npm run worker)
                                        │  runReviewStage activity
                                        ▼
              JarvisLabs model ◀── extract | analyse | roast | redesign
                                        │
                      cleanupImage activity (always, in `finally`)
```

A full review is **three workflows** (extract, analyse, roast) plus a fourth if the user clicks
"Generate improved diagram". Each is its own workflow, so the UI still shows results as each step
arrives, and each stays under the 60s request limit.

## Files

| File | Purpose |
|---|---|
| `src/temporal/workflows.ts` | `reviewStageWorkflow` and the `getStage` query. Retry policy lives here. |
| `src/temporal/activities.ts` | `runReviewStage` (calls the existing stage code) and `cleanupImage`. |
| `src/temporal/image-store.ts` | Claim-check store: images go to disk, only a uuid goes through Temporal. |
| `src/temporal/worker.ts` | The worker process (`npm run worker`). |
| `src/temporal/client.ts` | Cached Temporal client, survives Next.js hot reload. |
| `src/temporal/run.ts` | `runStageViaTemporal`: start a workflow, await it, return proof metadata. |
| `src/temporal/config.ts` | Env-driven settings and Temporal UI links. |
| `src/temporal/types.ts` | Types only, safe to import from client components. |
| `src/app/api/review/route.ts` | Routes each stage through Temporal when enabled. |
| `src/app/api/temporal/route.ts` | `GET /api/temporal` health and proof endpoint. |
| `src/components/temporal-proof.tsx` | The "Orchestrated by Temporal" panel. |
| `scripts/verify-temporal.ts` | End-to-end verification checklist. |

### Retry and timeout policy

| Setting | Value |
|---|---|
| Activity `startToCloseTimeout` | 50s |
| Retries | up to 3 attempts, 1s initial interval, x2 backoff, 10s max interval |
| Non-retryable | `ModelClientError` (a 4xx from the model API other than 408 and 429) |
| Cleanup activity | 10s timeout, 3 attempts, runs in `finally` |
| Workflow execution timeout | 58s |

## Run it

You need the Temporal CLI. On macOS: `brew install temporal`. Then, in four terminals:

```bash
npm run temporal:server    # 1. local dev server; UI at http://localhost:8233
```

```bash
npm run worker             # 2. the worker; prints "[temporal] worker started"
```

```bash
TEMPORAL_ENABLED=true npm run dev    # 3. the app
```

```bash
npm run verify:temporal    # 4. checklist; exits non-zero on failure
```

You can set `TEMPORAL_ENABLED=true` in `.env` instead of on the command line. The worker reads the
same env files, including your `JARVIS_*` keys. Restart the worker after changing code or env, because
it bundles the workflow code at startup.

## How to verify it works

1. **Verify script:** `npm run verify:temporal` checks the claim-check store, the server connection, that
   a worker is polling, runs a real workflow, and confirms the history has a `runReviewStage`
   `ActivityTaskScheduled` event. It prints a Temporal UI link.
2. **In the app:** after a real upload (not the offline sample) an **Orchestrated by Temporal** panel
   appears under the roast, listing each step with its workflow id and attempt number.
3. **Temporal UI:** open http://localhost:8233, find workflows named `review-extract-...`,
   `review-analyse-...` and so on, and open the Event History.
4. **API:** `curl localhost:3000/api/temporal` returns the connection state, the number of workers
   polling and the five most recent workflows. It returns `503` if the server is unreachable.

The offline **Try a sample** button never calls Temporal, so it will not produce a panel.

## Live demos

### 1. Automatic retries

```bash
DEMO_FAIL_FIRST_ATTEMPTS=2 npm run worker
```

Restart the worker with that variable, then run a review. The first two attempts of every step throw a
simulated error, and the third succeeds. The panel says "model call succeeded on attempt 3
(auto-retried)", and the Event History shows the two failed `ActivityTaskFailed` events and the retries.
Remember to restart the worker without the variable afterwards.

### 2. Crash survival

1. Start a review, and while the "analysing" step is running, stop the worker with Ctrl+C.
2. The workflow stays `Running` in the Temporal UI. Nothing is lost.
3. Start the worker again with `npm run worker`. It picks the activity back up and the review finishes.

The request from the browser stays open while the worker is down, so restart it within the 58s workflow
execution timeout, otherwise the step times out.

## Known limits

- **Server and worker must share a machine.** The claim check stores the image under the OS temp
  directory, so a worker on another host cannot read it. Swap `image-store.ts` for S3 or similar to
  scale out.
- **The worker cannot run on Vercel serverless.** It is a long-lived process. Deploy the Next.js app
  anywhere and run the worker on a VM, container or similar, with a reachable Temporal server
  (Temporal Cloud works: set `TEMPORAL_ADDRESS`, `TEMPORAL_NAMESPACE` and `TEMPORAL_API_KEY`).
- **Demo failures are per step.** `DEMO_FAIL_FIRST_ATTEMPTS` fails the first N attempts of each
  workflow, so a full review makes three retried calls.
