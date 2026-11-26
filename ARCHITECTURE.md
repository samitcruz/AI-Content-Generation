# ARCHITECTURE

## Contract

`storyboard.json` is the single source of truth. It is validated against `schema/storyboard.schema.json` before every full run.

Each stage **reads** the storyboard and **writes** only its own outputs under `outputs/`. Changing one shot’s prompt or narration and re-running regenerates that shot (input hash cache in `.cache/`).

## Stages

```
validate → narration → keyframes → shots → music → assemble
```

| Stage | Script | Reads | Writes | Model / tool |
|-------|--------|-------|--------|----------------|
| validate | `pipeline/validate.js` | storyboard + schema | `runs.jsonl` | Ajv |
| narration | `pipeline/narration.js` | narration.am/en per shot | `outputs/narration/{lang}/*.wav` | Gemini TTS |
| keyframes | `pipeline/keyframes.js` | image prompts + style | `outputs/references/`, `outputs/keyframes/` | FLUX on Cloudflare Workers AI |
| shots | `pipeline/shots.js` | keyframes + motion prompts | `outputs/shots/*.mp4`, `wan_jobs.json` | Wan 2.2 on Kaggle; Ken Burns fallback |
| music | `pipeline/music.js` | music cues | `outputs/music/score.*`, brief JSON | ACE-Step 1.5 on Kaggle |
| assemble | `pipeline/assemble.js` | all of the above | `outputs/films/*`, SRT, ducked mix | FFmpeg |

Orchestrator: `npm run film` → `pipeline/run.js`.

## Caching

`pipeline/lib/cache.js` hashes stage inputs. If the hash matches and the output file exists, the stage skips that unit and logs `cache-hit` in `runs.jsonl`.

## Failure handling

- Missing API keys / dry-run: placeholders (silence, solid frames, Ken Burns) so the pipeline still completes.
- Wan/ACE-Step not ready: local fallbacks; job manifests point to Kaggle notebooks.
- Every attempt logged to `runs.jsonl` with status `ok | dry-run | cache-hit | fallback | error`.
- Retries: re-run a single stage (`npm run keyframes`, etc.); cache prevents unchanged work.

## Secrets

`.env` (from `.env.example`) holds keys. Never committed. `.gitignore` excludes `.env` and large media.

## Dual language

`FILM_LANGUAGE=both|am|en`. Assembly burns **cross-language** subtitles (Amharic VO → English SRT, and vice versa).

## Showcase (optional)

`showcase/` is a thin Vite + React viewer for the storyboard and output links. Generation logic stays in the Node pipeline — not in the UI.
