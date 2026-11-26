# FAILURES

Record real blockers: quota, memory, consistency, language, tooling. What you tried, what fixed it or the workaround.

## Template

### F00 — title
- **When:**
- **Symptom:**
- **Tried:**
- **Resolution / workaround:**
- **Evidence:** (`runs.jsonl`, screenshot, note)

---

### F01 — FFmpeg not on PATH (setup)
- **When:** Project bootstrap
- **Symptom:** `ffmpeg` command not recognised on Windows
- **Tried:** Checked shell PATH
- **Resolution / workaround:** Install FFmpeg and add to PATH before real assemble; pipeline writes stubs until then
- **Evidence:** Local smoke check

### F02 — Gemini free-tier 503 / retired model IDs
- **When:** First live smoke (25 Nov)
- **Symptom:** `gemini-2.0-flash` / `gemini-2.5-flash` 404 for new keys; `gemini-3.8-flash` often 503 high demand
- **Tried:** Listed available models; probed alternatives
- **Resolution / workaround:** Smoke falls back `3.8-flash → 3.6-flash → 3.1-flash-lite`. TTS uses `gemini-3.8-flash-tts` with retry later if busy
- **Evidence:** `runs.jsonl` smoke entries; models list via API

### F03 — Cloudflare FLUX rejects `seed`; NSFW filter on toy prompts
- **When:** First live keyframe attempt
- **Symptom:** HTTP 400 “Additional … '/seed' … not allowed”; smoke prompt “red circle on black” flagged NSFW
- **Tried:** Removed seed from Workers AI body; changed smoke prompt to lamp-in-dark-room
- **Resolution / workaround:** Prompt-only body for `@cf/black-forest-labs/flux-1-schnell`; keep seeds in storyboard/logs for our own bookkeeping
- **Evidence:** Workers AI error codes 5006 / 8007

### F04 — Addis AI Amharic TTS: insufficient credits
- **When:** 26 Nov live narration upgrade
- **Symptom:** `INSUFFICIENT_CREDITS` / HTTP 402 — estimated Br 0.33, wallet Br 0.00
- **Tried:** SDK `voice.generate` with `am-yohanes-calm`; key authenticates; `voices.list` works
- **Resolution / workaround:** Pipeline keeps Addis as primary for `am`. On empty wallet, falls back to Gemini TTS and logs the error. Claim signup free credit or top up at [addisassistant.com](https://addisassistant.com/), then re-run `FILM_LANGUAGE=am npm run narration` + `npm run assemble`
- **Evidence:** `runs.jsonl` narration errors with `addis-voices-2`; request id in logs

### F05 — Cloud GPU music path abandoned (too slow / brittle)
- **When:** 26 Nov music generation
- **Symptom:** No local NVIDIA GPU; system Python 3.14; cloud notebook installs hit Python/`vector_quantize_pytorch` and long weight downloads
- **Tried:** Local model clone; cloud notebook bootstrap with Python 3.12 venv
- **Resolution / workaround:** Dropped the cloud GPU music path. Primary score is **local FFmpeg cinematic pads** (`npm run music:generate`, 3 candidates → `score.wav`). Alternative: drop any royalty-free instrumental WAV/MP3 as `outputs/music/score.wav` then `npm run assemble`
- **Evidence:** `outputs/music/score.wav` mean_volume ≈ −42 dB (was silent placeholder); films reassembled with audible underscore

### F06 — Gemini Lyria blocked on Free Tier
- **When:** 26 Nov Lyria music stage
- **Symptom:** All Lyria models (`lyria-3.5`, `lyria-3-pro-preview`, `lyria-3-clip-preview`) return **429** with **limit: 0** on Free Tier
- **Tried:** Interactions API + `generateContent` with `GEMINI_API_KEY`
- **Resolution / workaround:** `MUSIC_SOURCE=auto` tries Lyria then falls back to audible **FFmpeg cinematic pad**; films still get embedded underscore. Paid Gemini billing required for real Lyria audio
- **Evidence:** `runs.jsonl` music status `fallback` for lyria; `score.wav` ~7MB from FFmpeg; assemble ducks bed under VO

### F07 — _(next failure)_
- **When:**
- **Symptom:**
- **Tried:**
- **Resolution / workaround:**
- **Evidence:**
