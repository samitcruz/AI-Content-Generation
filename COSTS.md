# COSTS

Measured from `runs.jsonl` (project total ≈ **184** logged calls across dry-run + live sessions). Cash spend: Gemini/Cloudflare free tiers + small Addis top-up (Br 50) for Amharic TTS. Motion and music run locally on FFmpeg (no cloud GPU minutes).

## Access (list-price equivalent)

| Stage | Provider | Access used | List-price note (approx.) |
|-------|----------|-------------|---------------------------|
| English TTS / smoke text | Gemini API | Free tier | Pay-as-you-go TTS would be cents per minute |
| Amharic TTS | Addis Voices 2 | Paid top-up after empty wallet | ~$0.032/min generated (~Br pricing on dashboard); ~10 lines ≪ Br 50 |
| Keyframes | Cloudflare Workers AI FLUX.1 schnell | Free daily allowance | Hosted image ≪ $0.01 each at list |
| Moving shots | Ken Burns local (FFmpeg) | Local CPU | Free |
| Music | Gemini Lyria (blocked free tier) → FFmpeg pad | Local CPU fallback | Lyria needs paid tier (~$0.08/song); FFmpeg free |
| Assemble | FFmpeg local | Free | — |

## Measured (from `runs.jsonl`)

| Stage | Calls (all sessions) | Median latency | GPU minutes | Notes |
|-------|----------------------|----------------|-------------|-------|
| smoke / gemini | (in smoke×4) | ~0.6–2s when OK | — | 404/503 until model fallback |
| smoke / cloudflare | (in smoke×4) | ~1.5–3s when OK | — | 400 until prompt/`seed` fixes |
| narration | 71 | ~5113 ms | — | Includes dry-run, Gemini EN/AM fallback, **Addis AM success** |
| keyframes | 35 | ~1888 ms | — | FLUX.1 schnell; character sheet + shots |
| shots | 40 | ~3719 ms | **0 GPU** | Ken Burns v2 on CPU/FFmpeg |
| music | 2+ | seconds | 0 | FFmpeg pad candidates → `score.wav` |
| assemble | 16 | ~60 s | — | Four aspect/lang mixes; FFmpeg dominant |
| validate | 3 | ~51 ms | — | Ajv schema |

### Latency snapshots (live quality runs)

| Unit | Typical |
|------|---------|
| Addis Amharic line | ~6–10 s / shot |
| Gemini English line | ~3–6 s / shot |
| FLUX keyframe | ~1.5–5 s / image |
| Full assemble (both langs × 2 aspects) | ~1–2 min |

### List-price equivalent (order of magnitude)

If the same work were billed at public list prices without free tiers: **well under a few USD** for images + English TTS; Amharic via Addis dominated the small cash outlay (Br 50 top-up, only a fraction used for ~10 lines). Local FFmpeg motion/music kept GPU queue cost at zero.

## Binding constraint

For this project: **provider fragility + Amharic quality + assemble reliability**. Caching, Ken Burns, and local FFmpeg music kept the film shippable without waiting on cloud GPUs.
