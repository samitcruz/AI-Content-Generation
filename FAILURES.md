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

### F05 — _(next failure)_
- **When:**
- **Symptom:**
- **Tried:**
- **Resolution / workaround:**
- **Evidence:**
