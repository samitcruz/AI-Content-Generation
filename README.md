# Red After Midnight — Heritage Short Pipeline

60–90s AI film pipeline for the 10 Academy Week 0 challenge: **a late-night teenager finds Manchester United through counter-attacks — and keeps the loyalty after the glory fades.**

One contract: `storyboard.json`. One command: `npm run film`.

## Quick start

```bash
npm install
copy .env.example .env
# Leave PIPELINE_MODE=dry-run until keys + FFmpeg are ready
npm run validate
npm run film
```

Films land in `outputs/films/` (Amharic + English × 9:16 + 16:9).

For live generation: fill `.env`, set `PIPELINE_MODE=live`, install FFmpeg, then `npm run smoke` and `npm run film`.

**Accounts checklist:** see [`ACCOUNTS.md`](./ACCOUNTS.md).

## Stages

| Command | Stage |
|---------|--------|
| `npm run validate` | Schema-check storyboard |
| `npm run narration` | Gemini TTS (am + en) |
| `npm run keyframes` | Character sheet + FLUX stills |
| `npm run shots` | Wan job manifest + Ken Burns fallback |
| `npm run music` | ACE-Step brief + placeholder bed |
| `npm run assemble` | Duck, subtitles, both aspects |
| `npm run film` | All of the above |
| `npm run smoke` | One cheap call per provider |

## Repository map

```
storyboard.json      contract (shots, prompts, narration, music)
schema/              JSON Schema
pipeline/            one script per stage + shared lib
outputs/             images, audio, video (inspectable)
runs.jsonl           one line per model/stage call
DESIGN.md            audience, intent, user tests
ARCHITECTURE.md      contracts, caching, failures
EXPERIMENTS.md       hypothesis → change → result
FAILURES.md          blockers and workarounds
COSTS.md             latency / GPU / list-price notes
ETHICS.md            consent, licences, labelling
kaggle/              Wan + ACE-Step guides
showcase/            thin React viewer (optional)
```

## Design summary

- Anonymous young fan (no real likeness)
- No club crests / player faces in visuals; names only in narration
- Dual exports: Amharic VO + English subs, and English VO + Amharic subs
- Synthetic TTS only (no voice clone)
- GPU fallback: Ken Burns stills still count as a film

## Showcase UI

```bash
npm run showcase
```

Optional Vite + React app to browse the storyboard. Generation stays in Node.
