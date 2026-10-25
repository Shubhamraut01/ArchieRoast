# Archi Analyser

**Upload an architecture diagram and get a funny, technically accurate review, with fixes, a carbon grade and an improved diagram, powered by Gemma 4.**

Archi Analyser (a.k.a. ArchieRoast, or Gordon RAM-say) is a free architecture review for small teams that can't afford one. Drop in a screenshot of your system. A multimodal open model reads it and tells you, with brutal honesty and real substance, what is wrong and what to do about it.

## What you get

A review runs in four steps, and each result appears as soon as it is ready:

1. **Extract:** a list of the components and connections the model actually sees, so you can spot misreads.
2. **Analyse:** a scorecard (reliability, security, scalability, cost, observability, sustainability), plus a sortable table of **proposed changes** with effort, impact and a "do these 3 first" shortlist.
3. **Roast:** a specific, funny roast grounded in the analysis, plus one piece of genuinely useful advice.
4. **Redesign:** a before/after **improved architecture**, drawn with Mermaid in your browser. Copy the code or download an SVG.

It also gives the design a **carbon grade (A to E)** with its main drivers, and shows the **real token usage** of your review with a ranged energy estimate. The energy figure is clearly labelled an estimate, because no one publishes it for these models.

You can also paste a screenshot, and there is an offline **Try a sample** button that plays a canned review without any model call.

## Powered by Gemma 4 and JarvisLabs

Inference runs on open-weight models served by **[JarvisLabs](https://jarvislabs.ai)** through an OpenAI-compatible endpoint. The project was run end to end on **Gemma 4 31B** (`gemma-4-31b-it`), and it also works with other models JarvisLabs serves. Choosing the model is one environment variable:

```bash
JARVIS_MODEL=gemma-4-31b-it
```

The app is model-agnostic. With no JarvisLabs settings at all it falls back to canned data, so you can try the interface with no keys.

## Quick start

```bash
npm install
cp .env.example .env      # then fill in the three JARVIS_* values
npm run dev
```

Open http://localhost:3000.

| Variable | Meaning |
|---|---|
| `JARVIS_BASE_URL` | OpenAI-compatible base URL, e.g. `https://models.jarvislabs.net/v1` |
| `JARVIS_API_KEY` | Your JarvisLabs API key (never commit it; `.env` is git-ignored) |
| `JARVIS_MODEL` | Model to use, e.g. `gemma-4-31b-it` (must accept images) |

See [RUNNING.md](RUNNING.md) for configuration details, the API, deployment and troubleshooting.

## How it works

Each step is a separate request to `POST /api/review`, so it stays under serverless time limits and results stream into the page as they arrive. Later steps work from structured JSON facts and not the image, so the roast and the changes table cannot invent components. The model's output is validated and retried once if it returns malformed JSON.

```
image ─▶ extract ─▶ inventory ─▶ analyse ─▶ analysis ─▶ roast
                                     └────────▶ redesign (on button click)
```

Images are processed once and never stored. There is no database.

## Built with

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, the OpenAI SDK (pointed at JarvisLabs) and [Mermaid](https://mermaid.js.org) (open source).

## More docs

- [RUNNING.md](RUNNING.md): run, configure and deploy the app.
- [TEMPORAL.md](TEMPORAL.md): optional Temporal integration that runs each review step as a durable workflow with automatic retries.

## Sponsors

Thanks to [JarvisLabs](https://jarvislabs.ai), Kepler and Temporal.

## License

[MIT](LICENSE)
