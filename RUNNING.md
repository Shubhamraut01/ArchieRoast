# Running Archi Analyser

Upload an architecture diagram and get a free review for small teams: an inventory of what the
model sees, a scorecard, a roast, a sortable table of proposed changes, a carbon check and an
improved diagram. Next.js 16 + Tailwind + shadcn/ui.

## How a review works

A review is four separate requests to `POST /api/review` (one per `stage`), so each stays under
the 60s function limit and results appear as they arrive:

| Stage | Input | Output |
|---|---|---|
| `extract` | the image | inventory of components and connections |
| `analyse` | the inventory (text) | scorecard, issues, changes table, carbon grade |
| `roast` | inventory + analysis | the roast and one piece of real advice |
| `redesign` (on button click) | inventory + analysis | Mermaid source for the improved diagram |

Later stages work from structured facts, not the image, so the roast and table can't invent
components. Every stage response includes the token `usage`, which feeds the footer line.

## Prerequisites

- Node.js 20 or newer
- npm

## Quick start

```bash
npm install
cp .env.example .env.local   # skip if .env.local already exists
npm run dev
```

Open http://localhost:3000.

## Environment variables

Set these in `.env.local` (git-ignored). `.env.example` is the committed template.

| Variable | What it is |
|---|---|
| `JARVIS_BASE_URL` | OpenAI-compatible base URL, e.g. `https://models.jarvislabs.net/v1` (managed) or `https://serverlessn.jarvislabs.net/openai/<deployment_id>/v1` (your own deployment) |
| `JARVIS_API_KEY` | Your JarvisLabs API key |
| `JARVIS_MODEL` | Exact model name served by the deployment (must support images) |

### Mock mode

If any of the three variables is empty, every stage returns canned data
([src/lib/review/mock-data.ts](src/lib/review/mock-data.ts)) after a realistic delay, so the app
runs with no keys. When all three are set, stages call your JarvisLabs endpoint
([src/lib/review/llm.ts](src/lib/review/llm.ts)). Restart `npm run dev` after changing env files.

> Verified against a real JarvisLabs managed endpoint
> (`https://models.jarvislabs.net/v1`, a reasoning vision model). Reasoning models
> spend 1-2k hidden tokens before answering, so `max_tokens` is 8000 in
> [src/lib/review/llm.ts](src/lib/review/llm.ts); low values return empty replies.
> A full review takes roughly 30-40 seconds across three calls, plus about 10s for the redesign.

Put the values in `.env.local` **or** `.env` (both are git-ignored). If you use `.env`,
don't leave blank `JARVIS_*` lines in `.env.local`: it takes precedence, and an empty
value there silently disables the real model.

### Getting a JarvisLabs endpoint

1. In the JarvisLabs dashboard, create a **Serverless** deployment.
2. Pick vLLM and a vision-language model, and wait until it shows **Running**.
3. Copy the deployment ID into `JARVIS_BASE_URL`, the model name into `JARVIS_MODEL`,
   and your key into `JARVIS_API_KEY`.
4. Stop the deployment when you are not using it; GPUs bill while running.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |

## Try the API directly

```bash
curl -X POST localhost:3000/api/review \
  -H 'Content-Type: application/json' \
  -d '{"stage":"extract","image":"data:image/png;base64,<BASE64>"}'
```

Each response is `{ "data": ..., "usage": { "promptTokens", "completionTokens", "totalTokens" } | null }`
(`usage` is null in mock mode). Send `data` from `extract` as `inventory` to `analyse`, then both to
`roast` and `redesign`. Types are in [src/lib/review/types.ts](src/lib/review/types.ts).

## Energy and carbon

The carbon grade is the model's estimate from the diagram. The footer shows real token counts and a
**range** for energy, computed in [src/lib/review/energy.ts](src/lib/review/energy.ts), anchored on
Google's reported 0.24 Wh median Gemini prompt and Epoch AI's ~0.3 Wh typical GPT-4o query. Nobody
publishes the figure for this specific model, so treat it as an order-of-magnitude estimate.

## Project layout

```
src/app/page.tsx              landing page
src/app/api/review/route.ts   POST /api/review (validation, rate limit, stage dispatch)
src/components/review-flow.tsx   runs the stages, shows results as they arrive
src/components/review/        scorecard, carbon card, changes table, redesign view, usage footer
src/components/dropzone.tsx   drag/drop/paste upload + sample button
src/lib/review/               prompts, stage runner, model client, validators, mock data, energy
src/lib/rate-limit.ts         best-effort per-IP limiter (in-memory)
src/lib/image.ts              downscales images to 1536px before upload
```

## Deploy to Vercel

1. Push the repo to GitHub and import it at https://vercel.com/new.
2. Add `JARVIS_BASE_URL`, `JARVIS_API_KEY` and `JARVIS_MODEL` under Project Settings, Environment Variables.
3. Deploy. Keep the JarvisLabs deployment **Running** during the demo; a cold GPU can exceed the route's 60s limit.

Notes: `/api/review` has `maxDuration = 60`, which each stage stays under. The rate limiter (30 requests/min/IP) is in-memory, so on serverless each instance counts separately; use a shared store such as Upstash Redis for a hard limit, since every review costs several GPU calls.

## Sample data

- `diagrams/` holds demo diagrams. The "Try a sample" button uses `diagrams/architecture.png`, embedded in `src/lib/sample-image.ts`, and plays the canned review from `src/lib/review/mock-data.ts`: no AI call, no network, so it works offline. Regenerate the embed if you change the diagram.
- `public/sponsors/` holds the footer logos.

## Troubleshooting

- **Port 3000 in use:** `npm run dev -- -p 3001`
- **Env changes not picked up:** restart `npm run dev`; Next.js reads env at startup.
- **415 from the API:** the image must be a real PNG or JPG (the file signature is checked, not just the extension).
- **413 from the API:** the uploaded payload is over 4MB (the browser normally downscales first).
- **429 from the API:** more than 30 requests in a minute from one IP.
- **"Couldn't draw this diagram":** the model produced invalid Mermaid; the source is shown below it, and "Try again" regenerates it.
- **Image greyed out in the file picker:** the picker now accepts any image; WebP, AVIF and GIF are converted to JPEG in the browser. HEIC only works in Safari; export it as JPG elsewhere.
