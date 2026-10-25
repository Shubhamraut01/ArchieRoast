# Running Archi Analyser

Upload an architecture diagram, get roasted. Next.js 16 + Tailwind + shadcn/ui.

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
| `JARVIS_BASE_URL` | JarvisLabs endpoint: `https://serverlessn.jarvislabs.net/openai/<deployment_id>/v1` |
| `JARVIS_API_KEY` | Your JarvisLabs API key |
| `JARVIS_MODEL` | Exact model name served by the deployment (must support images) |

### Mock mode

If any of the three variables is empty, the app falls back to a **mock roaster**
([src/lib/roast/mock.ts](src/lib/roast/mock.ts)), so it runs with no keys. When all
three are set, requests go to your JarvisLabs deployment
([src/lib/roast/jarvis.ts](src/lib/roast/jarvis.ts)). Restart `npm run dev` after
changing `.env.local`.

> The JarvisLabs path is tested against a fake OpenAI-compatible server (request
> shape, bearer auth, JSON parsing, retry, error handling). It has not been run
> against a real JarvisLabs deployment yet, so check the first real roast.

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
curl -X POST localhost:3000/api/roast \
  -H 'Content-Type: application/json' \
  -d '{"image":"data:image/png;base64,<BASE64>"}'
```

Returns `{ "roast": "...", "score": 1-10, "issues": [{ "title": "...", "severity": "low|medium|high" }], "advice": "..." }`.

## Project layout

```
src/app/page.tsx            landing page
src/app/api/roast/route.ts  POST /api/roast (validates, calls the provider)
src/components/dropzone.tsx drag-and-drop upload + preview
src/components/roast-card.tsx  calls the API, shows the result
src/components/typewriter.tsx, loading-messages.tsx  reveal + loading polish
src/lib/image.ts            downscales images to 1536px before upload
src/lib/roast/              provider interface, mock, provider selection
```

## Deploy to Vercel

1. Push the repo to GitHub and import it at https://vercel.com/new.
2. Add `JARVIS_BASE_URL`, `JARVIS_API_KEY` and `JARVIS_MODEL` under Project Settings, Environment Variables.
3. Deploy. Keep the JarvisLabs deployment **Running** during the demo; a cold GPU can exceed the route's 60s limit.

Notes: `/api/roast` has `maxDuration = 60`. There is no rate limiting yet; add one (for example Upstash Redis) before sharing the URL publicly, since every roast costs a GPU call.

## Sample data

- `diagrams/` holds demo diagrams. The "Try a sample" button uses `diagrams/architecture.png`, embedded in `src/lib/sample-image.ts`, and plays a canned roast from `src/lib/sample.ts`: no AI call, no network, so it works offline. Regenerate the embed if you change the diagram.
- `public/sponsors/` holds the footer logos.

## Troubleshooting

- **Port 3000 in use:** `npm run dev -- -p 3001`
- **Env changes not picked up:** restart `npm run dev`; Next.js reads env at startup.
- **415 from the API:** the image must be a real PNG or JPG (the file signature is checked, not just the extension).
- **413 from the API:** the uploaded payload is over 4MB (the browser normally downscales first).
- **Image greyed out in the file picker:** the picker now accepts any image; WebP, AVIF and GIF are converted to JPEG in the browser. HEIC only works in Safari; export it as JPG elsewhere.
