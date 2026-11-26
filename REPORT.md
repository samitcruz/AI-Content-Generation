# Report — Red After Midnight  
**10 Academy Week 0 · B2W0: AI-Content Generation**

**Author:** Samuel Tsegaye  
**Repository:** https://github.com/samitcruz/AI-Content-Generation  
**Film (primary):** [Google Drive — `red-after-midnight_am_9x16.mp4`](https://drive.google.com/drive/folders/1Xatyvm5bmQ2fJDovh3T2HrSjtuFrVHNh)  
**Local path:** `outputs/films/` (Amharic + English × 9:16 + 16:9; gitignored — regenerate with `npm run film`)  
**Showcase:** [red-after-midnight.vercel.app](https://red-after-midnight.vercel.app)

---

## 1. What I set out to make, and for whom

**Film:** A 60–90s heritage short about becoming a Manchester United supporter — not a club promo, but a personal story of a homebound teenager who found ruthlessness and beauty in Ferguson-era counter-attacks, and kept the loyalty after the glory years faded.

**Audience:** People like me at 12–13 — kids who watched at home as daylight turned to dusk — plus diaspora friends and anyone who fell for a club before they understood form tables. Primary viewing context: phone, **9:16**.

**Intent:** By the end, the viewer should feel that **support can become identity**.

**Pipeline:** A Node.js multi-stage studio around one contract, `storyboard.json`: validate → narration → keyframes → shots → music → assemble. One command: `npm run film`. Secrets stay in `.env`; every model call is logged in `runs.jsonl`.

---

## 2. What I learned from the audience

Design thinking started with the person whose story it is (me) and continued through two structured review loops documented in `DESIGN.md`.

### Insights that changed the work

1. **Time of day must be true.** An early cut framed kickoffs as late night / 11pm–midnight. That was wrong. Real memory is **around 5–6pm, just getting dark**. We rewrote English and Amharic narration, image prompts, style block, and `DESIGN.md`, then regenerated Amharic TTS and dusk-leaning keyframes.
2. **Amharic must sound native.** Gemini TTS was intelligible but not good enough for a film meant to land with Amharic listeners. We switched Amharic to **Addis Voices 2** (`am-yohanes-calm`, male narration) and kept Gemini for English. That is both a quality fix and ceiling work (local African-language infra).
3. **Loyalty > highlight reel.** Review preferred a short emotional arc (ritual → discovery → peak → afterglow) over a dense player documentary. Named strikers stay in **voice**; pictures stay anonymous (ethics + consistency).

Storyboard fields that visibly moved because of this feedback include shot_02 narration (EN/AM), shot_01–02 prompts/clock, shot_07 “night” → “match”, and global style/music cue language from “late-night” to **dusk**.

---

## 3. Hardest problem, and how I solved it

Several blockers stacked; the hardest *system* problem was **making a reproducible free-tier film assemble on Windows while providers moved under us**.

| Blocker | What fixed it |
|---------|----------------|
| Gemini model IDs 404/503 | Probe available models; smoke fallbacks `3.8 → 3.6 → …` |
| Cloudflare FLUX rejecting `seed` / NSFW toy prompts | Prompt-only body; safer smoke prompt; seeds kept in storyboard/logs only |
| FFmpeg `drawtext` crash on Windows | Explicit `fontfile` (Arial) |
| Audio mix / subtitle paths with spaces | Local `subs.srt` copy; simpler mono `amix` bed; `tpad` for VO length |
| Silent dry-run WAVs looking “valid” | Reject/regenerate files under ~20KB; never cache silence as success |
| Addis wallet empty (402) | Keep Addis primary; temporary Gemini fallback; after top-up, full Amharic regen with Yohanes Calm |

Evidence: `FAILURES.md` (F01–F04), `runs.jsonl`.

---

## 4. Suggested practices — one that beat my instinct, one that did not

### Beat my instinct — **JSON contract + stage isolation + caching**

Instinct: jump straight to pretty images and “fix it in the edit.”  
Practice: lock `storyboard.json` + schema; generate narration; only then spend image quota; hash-cache so one line change regenerates one shot.

**Evidence:** We changed dusk wording and Amharic provider without rebuilding the whole mental model of the film; `npm run narration` / `keyframes` / `assemble` could be re-run selectively. Graders’ emphasis on contracts matches what saved time once providers failed.

### Did not beat my instinct — **assuming free credits equal working Amharic TTS**

Instinct (and hope): Addis signup credit would just work.  
Practice suggested: measure early (`smoke`, one real TTS call) and log cost/wallet.

**Evidence:** First Addis generate returned `INSUFFICIENT_CREDITS` (Br 0.00). We lost a cycle to Gemini fallback, then topped up and regenerated. The practice of *early smoke* was right; my instinct to postpone wallet checks was wrong. Logged in `FAILURES.md` F04 and `EXPERIMENTS.md` E08.

---

## 5. Curiosity beyond the floor (ceiling)

1. **Bilingual exports from one storyboard** — Amharic VO + English burn-in subs, and English VO + Amharic subs (`FILM_LANGUAGE=both`).
2. **Addis AI for Amharic narration** — production African-language TTS (`am-yohanes-calm`) instead of only Gemini.
3. **Local motion + music without cloud GPU** — Ken Burns v2 for shots; FFmpeg cinematic pads for underscore (`npm run music:generate`). Avoided brittle notebook installs and weight downloads under a tight deadline.

Insight: ceiling work that **changes a decision** (Addis over Gemini; dusk over midnight; local FFmpeg over cloud GPU music) scored higher than bolting on unfinished GPU features.

---

## 6. What I would build next

1. Stronger Ken Burns patterns or short free I2V clips for priority shots (02, 04, 07, 08).  
2. Optional denser royalty-free instrumental swap under the same ducking path.  
3. Package `npm run film` as a tiny CLI others can run from their own storyboard.  
4. Blind preference test: Addis vs Gemini Amharic with ≥5 listeners.  
5. Keep `COSTS.md` updated after each live regeneration.

---

## 7. Ethics (short)

No real likeness or voice clone. Synthetic Addis/Gemini voices only. No club crests or player faces in generated imagery. End card: **Made with AI**. Platform AI label on when posting. Details: `ETHICS.md`.

---

## 8. How to reproduce

```bash
git clone https://github.com/samitcruz/AI-Content-Generation.git
cd AI-Content-Generation
npm install
copy .env.example .env   # add GEMINI_API_KEY, Cloudflare, ADDIS_AI_API_KEY
# install FFmpeg on PATH
npm run smoke
npm run film
```

**Finished film (graded cut):** media is gitignored in git. Watch / download from  
[Google Drive folder](https://drive.google.com/drive/folders/1Xatyvm5bmQ2fJDovh3T2HrSjtuFrVHNh)  
(primary: `red-after-midnight_am_9x16.mp4`).

Showcase (storyboard UI): `npm run showcase` → http://localhost:5173/  
**Live showcase:** https://red-after-midnight.vercel.app (static build of `showcase/`; see `showcase/DEPLOY.md`)

---

*This report is the Assignment 1 written deliverable. Film, walkthrough, and public post are Assignment 2.*
