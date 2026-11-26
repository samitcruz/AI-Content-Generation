# EXPERIMENTS

Log as: **hypothesis → change → result**. Target ~10 entries. Add dates and point at `runs.jsonl` lines when possible.

## Template

### E00 — title
- **Hypothesis:**
- **Change:**
- **Result:**
- **Decision:**

---

### E01 — Radio cut before pictures
- **Hypothesis:** Timing the story on voice alone will reveal which lines feel long before we spend GPU quota.
- **Change:** Generate narration only; listen end-to-end on black.
- **Result:** _pending_
- **Decision:** _pending_

### E02 — Dual language from one storyboard
- **Hypothesis:** Amharic + English can share shot timings if lines are kept short (~2–2.5 words/sec English equivalent).
- **Change:** Parallel `narration.am` / `narration.en` fields; assemble twice.
- **Result:** _pending_
- **Decision:** _pending_

### E03 — Character sheet before keyframes
- **Hypothesis:** Locking an anonymous fan reference first reduces identity drift across 10 shots.
- **Change:** Generate `outputs/references/character_sheet.png` before shot keyframes.
- **Result:** _pending_
- **Decision:** keep / revise prompts

### E04 — Motion prompts without re-describing the subject
- **Hypothesis:** For image-to-video, motion+camera-only prompts stay more consistent than full scene re-prompts.
- **Change:** Wan / fallback prompts describe only motion and camera.
- **Result:** _pending_

### E05 — Ken Burns as respectable fallback / local animation
- **Hypothesis:** Varied slow pan/zoom on strong keyframes beats static holds and buys time until Wan GPU clips exist.
- **Change:** `kenburns-v2` in `pipeline/shots.js` with multiple zoom/pan patterns; Wan job contract in `kaggle/wan_ti2v.ipynb` + `wan_jobs.json`.
- **Result:** All 10 shots re-exported as Ken Burns clips (~150–340KB each). Real Wan I2V still pending Kaggle GPU run (on-brief, not a deviation).
- **Decision:** Ship Ken Burns now; replace per-shot with Wan downloads when ready.

### E06 — ACE-Step candidate batch
- **Hypothesis:** Three instrumental candidates, auditioned under narration at low volume, beats one lucky generation.
- **Change:** Request 3 ACE-Step candidates; pick one; note why.
- **Result:** _pending_

### E07 — Ducking parameters
- **Hypothesis:** FFmpeg sidechaincompress threshold 0.02 / ratio 6 / attack 300 / release 1500 keeps voice readable.
- **Change:** Use those defaults in assemble; tune by ear.
- **Result:** _pending_

### E08 — Amharic TTS: Addis Voices 2 vs Gemini
- **Hypothesis:** Addis male narration (`am-yohanes-calm`) will sound more natural in Amharic than Gemini TTS.
- **Change:** Wire `addisai` SDK; Amharic → Addis primary, English → Gemini; male voice from catalog.
- **Result:** After top-up, all 10 Amharic lines generated with **Addis Voices 2 / `am-yohanes-calm`** (male narration). Story time corrected to dusk 5–6pm (not late evening). Films reassembled.
- **Decision:** Keep Addis + Yohanes Calm as Amharic default.

### E08b — Amharic TTS on football names
- **Hypothesis:** Even with Addis, names like Rooney / Old Trafford may need spelling hints.
- **Change:** Native listen after Addis credit is available; adjust Amharic lines if needed.
- **Result:** _pending (blocked on Addis credits)_

### E09 — Seed-locked prompt compare
- **Hypothesis:** Changing one adjective with a fixed seed isolates style drift.
- **Change:** Same seed, one prompt word change on one keyframe.
- **Result:** _pending_

### E10 — Cross-subtitles readability
- **Hypothesis:** ≤2 lines / ~40 chars improves vertical safe-area readability.
- **Change:** SRT wrapper in assemble.
- **Result:** _pending_
