# COSTS

Free-tier challenge stack. Update with measured numbers from `runs.jsonl` after smoke tests and real runs.

## Access (list-price equivalent at $0 cash)

| Stage | Provider | Free access | List-price note (approx.) |
|-------|----------|-------------|---------------------------|
| Script / TTS | Gemini API (AI Studio) | Free tier | TTS + Flash would be cents–dollars at pay-as-you-go |
| Keyframes | Cloudflare Workers AI (FLUX) | Daily image allowance | Hosted image ~ fractions of a cent each |
| Moving shots | Wan 2.2 on Kaggle T4 | ~30 GPU h/week | Consumer GPU rental elsewhere ~$0.40–1.00/h |
| Music | ACE-Step 1.5 on Kaggle | Same GPU quota | Open weights; compute only |
| Assemble | Local FFmpeg | Free | — |

## Measured (fill in)

| Stage | Calls | Median latency | GPU minutes | Notes |
|-------|-------|----------------|-------------|-------|
| smoke/gemini | | | — | |
| smoke/cloudflare | | | — | |
| narration (am) | | | — | |
| narration (en) | | | — | |
| keyframes | | | — | |
| shots (Wan) | | | | Draft 480p first |
| music (ACE-Step) | | | | 3 candidates |
| assemble | | | — | |

## Binding constraint

GPU queue and weekly Kaggle minutes — not money. Draft low-res, batch jobs, cache aggressively, Ken Burns when clips fail.
