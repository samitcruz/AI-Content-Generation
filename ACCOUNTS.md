# Accounts & tools you need to set up

Do these in order. Cursor is already your coding agent — you do **not** need Antigravity/OpenCode unless you want a second agent.

## 1. Gemini API (required for real narration)

1. Open [Google AI Studio](https://aistudio.google.com/apikey)
2. Create an API key
3. Put it in `.env` as `GEMINI_API_KEY=...`

Used for: TTS narration (Amharic + English), optional script helpers.

## 2. Cloudflare Workers AI (required for real keyframes)

1. Sign up at [dash.cloudflare.com](https://dash.cloudflare.com/)
2. Copy **Account ID** (Workers AI / account overview)
3. Create an **API Token** with Workers AI permissions
4. Put in `.env`:
   - `CLOUDFLARE_ACCOUNT_ID=...`
   - `CLOUDFLARE_API_TOKEN=...`

Used for: FLUX keyframes + character sheet (daily free allowance).

## 3. Kaggle (required for Wan video + ACE-Step music)

1. Create / log in at [kaggle.com](https://www.kaggle.com/)
2. **Phone-verify** the account (needed for GPU)
3. Open notebooks under `kaggle/` in this repo (upload or copy cells)
4. Enable GPU (T4) in notebook settings
5. Download outputs into:
   - `outputs/shots/shot_XX.mp4`
   - `outputs/music/score.wav`

Used for: moving shots (Wan 2.2), score (ACE-Step 1.5). Weekly GPU hours are the bottleneck.

## 4. FFmpeg on this machine (required for real assemble)

Windows: install FFmpeg and ensure `ffmpeg` works in PowerShell.

- Option A: `winget install FFmpeg`  
- Option B: download from [ffmpeg.org](https://ffmpeg.org/) and add `bin` to PATH  

Then reopen the terminal and run `ffmpeg -version`.

## 5. Node.js (already OK)

Detected: Node v24 + npm. Run `npm install` in the project root.

## 6. Coding agent

**Cursor** writes/maintains the pipeline under your direction. That satisfies the challenge’s “coding agent under your direction” intent. Optional extras (not required): Antigravity CLI, OpenCode.

## 7. Optional showcase hosting

Hugging Face Space or any static host for the thin React showcase — after the film exists.

---

## After accounts exist

```bash
copy .env.example .env   # then paste keys
# set PIPELINE_MODE=live in .env when ready
npm run smoke            # one call per provider
npm run film             # full pipeline
```

Until keys + FFmpeg are ready, keep `PIPELINE_MODE=dry-run` (default) to exercise the pipeline with placeholders.
