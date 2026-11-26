# EXPERIMENTS

Log as: **hypothesis → change → result**. Target ~10 entries. Evidence in `runs.jsonl`, outputs, and docs.

---

### E01 — Radio / narration before expensive pictures
- **Hypothesis:** Timing the story on voice alone reveals weak lines before we spend image quota.
- **Change:** Generate narration first; listen end-to-end; only then lock keyframes.
- **Result:** Short lines worked; Amharic quality problem surfaced *before* we over-invested in final pictures. Led to Addis migration (E08).
- **Decision:** Keep narration-first as default stage order in `npm run film`.

### E02 — Dual language from one storyboard
- **Hypothesis:** Amharic + English can share one shot list if lines stay short.
- **Change:** Parallel `narration.am` / `narration.en`; `FILM_LANGUAGE=both`; assemble twice with cross-subs.
- **Result:** Four exports produced (am/en × 9:16/16:9). Amharic cut ~62s after Addis regen; English longer (~80s earlier) — VO length differs by language; assemble uses `tpad` so picture can follow voice.
- **Decision:** Keep dual export as ceiling deliverable; watch duration drift per language.

### E03 — Character sheet before keyframes
- **Hypothesis:** Locking an anonymous fan reference first reduces identity drift.
- **Change:** Generate `outputs/references/character_sheet` before shot keyframes; reuse style block.
- **Result:** Character remains an anonymous teenage boy across shots; some FLUX variance remains (expected without LoRA). Good enough for Ken Burns cut.
- **Decision:** Keep reference-first; optional LoRA later if stronger motion amplifies drift.

### E04 — Motion prompts without re-describing the subject
- **Hypothesis:** For Ken Burns / any I2V, motion+camera-only prompts stay more consistent.
- **Change:** Shot manifests + Ken Burns use motion/camera; subject stays in the keyframe.
- **Result:** Ken Burns v2 clips look coherent with still composition.
- **Decision:** Keep motion/camera separation in storyboard prompts.

### E05 — Ken Burns as primary local animation
- **Hypothesis:** Varied slow pan/zoom beats static holds without needing cloud GPU.
- **Change:** `kenburns-v2` with multiple zoom/pan patterns (local FFmpeg only).
- **Result:** All 10 shots exported as motion stills (~150–340KB+). Fast, free, shippable.
- **Decision:** Ship Ken Burns as the motion path for this submission.

### E06 — Music candidate batch (local FFmpeg pads)
- **Hypothesis:** Three instrumental candidates under narration beat one silent placeholder.
- **Change:** `npm run music:generate` — FFmpeg dusk pads, 3 candidates. Chose candidate_1 (softest). Dropped cloud GPU music (too slow / brittle).
- **Result:** `score.wav` audible (mean ≈ −42 dB, max ≈ −33 dB, 82s). Films reassembled with underscore under VO.
- **Decision:** FFmpeg cinematic pad is the primary music path; optional: drop any royalty-free instrumental as `score.wav`.

### E07 — Mixing / ducking on Windows FFmpeg
- **Hypothesis:** Challenge-suggested sidechaincompress settings will duck music cleanly.
- **Change:** First assemble used sidechaincompress; failed on stream-label / layout issues with mono silence bed.
- **Result:** Switched to reliable mono `amix` with quiet bed + alimiter; loudnorm ~−14 LUFS. Voice remains readable.
- **Decision:** Prefer working `amix` with the FFmpeg pad; revisit sidechain if a denser stem is swapped in.

### E08 — Amharic TTS: Addis Voices 2 vs Gemini
- **Hypothesis:** Addis male narration sounds more natural in Amharic than Gemini TTS.
- **Change:** `addisai` SDK; `ADDIS_AI_API_KEY`; voice `am-yohanes-calm`; Gemini kept for English.
- **Result:** After top-up, all 10 Amharic lines OK via Addis. Earlier empty wallet forced Gemini fallback (rejected for final).
- **Decision:** Addis + Yohanes Calm is the Amharic default.

### E08b — Amharic TTS on football names
- **Hypothesis:** Names like Rooney / Old Trafford may need spelling hints even on Addis.
- **Change:** Native listen after Addis regen; adjust storyboard spellings only if needed.
- **Result:** Lines accepted for submission cut; further phonetic tweaks optional if peers flag names.
- **Decision:** Monitor in peer listen (DESIGN test peers); change one shot at a time if needed.

### E09 — Provider fragility (models & Workers AI)
- **Hypothesis:** Free-tier model IDs and request shapes will break; logging + fallbacks matter more than one “perfect” call.
- **Change:** Smoke model fallbacks; FLUX without `seed`; safer Cloudflare smoke prompt.
- **Result:** Smoke became green; keyframes succeeded; failures captured in `FAILURES.md`.
- **Decision:** Keep smoke + FAILURES discipline every session.

### E10 — Cross-subtitles readability
- **Hypothesis:** Short wrapped SRT lines improve vertical safe-area readability.
- **Change:** Assemble writes cross-language SRT (AM film → EN subs, EN film → AM subs) with wrap helper; copy to local `subs.srt` (Windows path-with-spaces fix).
- **Result:** Burned-in subs present on exports; wrapping helps but peer check on phone still recommended.
- **Decision:** Keep wrapper; tighten any long Amharic subtitle lines peers flag.

### E11 — Dusk time correction (design → regenerate)
- **Hypothesis:** Wrong time-of-day breaks trust with the intended audience even if pictures look fine.
- **Change:** Storyboard + DESIGN rewrite to 5–6pm dusk; regenerate AM VO + keyframes; reassemble.
- **Result:** Narration and prompts now match maker memory; film re-exported.
- **Decision:** Treat factual personal detail as a hard constraint, not flavour text.
