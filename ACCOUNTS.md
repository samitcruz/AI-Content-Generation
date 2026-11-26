# Accounts & tools you need to set up

Do these in order. Cursor is already your coding agent — you do **not** need Antigravity/OpenCode unless you want a second agent.

## 1. Gemini API (required for English narration)

1. Open [Google AI Studio](https://aistudio.google.com/apikey)
2. Create an API key
3. Put it in `.env` as `GEMINI_API_KEY=...`

Used for: English TTS, optional script helpers. Amharic falls back here only if Addis wallet is empty.

## 1b. Addis AI (required for good Amharic narration)

1. Sign up at [addisassistant.com](https://addisassistant.com/)
2. Create an API key; claim signup free credit if offered (~$3.17 / check dashboard wallet)
3. Put it in `.env` as `ADDIS_AI_API_KEY=...`
4. Optional: `ADDIS_VOICE_AM=am-yohanes-calm` (male narration)

Used for: Amharic TTS via Addis Voices 2. Docs: https://docs.addisassistant.com/docs/capabilities/text-to-speech

## 2. Cloudflare Workers AI (required for real keyframes)

1. Sign up at [dash.cloudflare.com](https://dash.cloudflare.com/)
2. Copy **Account ID** (Workers AI / account overview)
3. Create an **API Token** with Workers AI permissions
4. Put in `.env`:
   - `CLOUDFLARE_ACCOUNT_ID=...`
   - `CLOUDFLARE_API_TOKEN=...`

Used for: FLUX keyframes + character sheet (daily free allowance).

## 3. FFmpeg on this machine (required for shots, music, assemble)

Windows: install FFmpeg and ensure `ffmpeg` works in PowerShell.

- Option A: `winget install FFmpeg`  
- Option B: download from [ffmpeg.org](https://ffmpeg.org/) and add `bin` to PATH  

Then reopen the terminal and run `ffmpeg -version`.

Used for: Ken Burns motion, local cinematic music pads (`npm run music:generate`), assemble.

## 4. Node.js (already OK)

Detected: Node v24 + npm. Run `npm install` in the project root.

## 5. Coding agent

**Cursor** writes/maintains the pipeline under your direction. That satisfies the challenge’s “coding agent under your direction” intent. Optional extras (not required): Antigravity CLI, OpenCode.

## 6. Optional showcase hosting (Vercel)

Thin React storyboard UI in `showcase/` — see `showcase/DEPLOY.md`.

1. `cd showcase && npm run build`
2. `npx vercel login` then `npx vercel deploy dist --prod`
3. Put the production URL in `README.md` / `REPORT.md`

Finished film MP4s stay on [Google Drive](https://drive.google.com/drive/folders/1Xatyvm5bmQ2fJDovh3T2HrSjtuFrVHNh) (not on Vercel).

---

## After accounts exist

```bash
copy .env.example .env   # then paste keys
# set PIPELINE_MODE=live in .env when ready
npm run smoke            # one call per provider
npm run film             # full pipeline
```

Until keys + FFmpeg are ready, keep `PIPELINE_MODE=dry-run` (default) to exercise the pipeline with placeholders.
