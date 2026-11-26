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

### E05 — Ken Burns as respectable fallback
- **Hypothesis:** Slow pan/zoom on strong keyframes beats a failed Wan clip for continuity.
- **Change:** `fallback: kenburns` per shot when clip missing.
- **Result:** _pending_

### E06 — ACE-Step candidate batch
- **Hypothesis:** Three instrumental candidates, auditioned under narration at low volume, beats one lucky generation.
- **Change:** Request 3 ACE-Step candidates; pick one; note why.
- **Result:** _pending_

### E07 — Ducking parameters
- **Hypothesis:** FFmpeg sidechaincompress threshold 0.02 / ratio 6 / attack 300 / release 1500 keeps voice readable.
- **Change:** Use those defaults in assemble; tune by ear.
- **Result:** _pending_

### E08 — Amharic TTS on football names
- **Hypothesis:** Gemini TTS may mispronounce Rooney / Old Trafford in Amharic lines.
- **Change:** Native listen; adjust spelling/spacing in Amharic narration if needed.
- **Result:** _pending_

### E09 — Seed-locked prompt compare
- **Hypothesis:** Changing one adjective with a fixed seed isolates style drift.
- **Change:** Same seed, one prompt word change on one keyframe.
- **Result:** _pending_

### E10 — Cross-subtitles readability
- **Hypothesis:** ≤2 lines / ~40 chars improves vertical safe-area readability.
- **Change:** SRT wrapper in assemble.
- **Result:** _pending_
