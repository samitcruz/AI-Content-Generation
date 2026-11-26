# Wan 2.2 TI2V-5B — Kaggle guide

Goal: image-to-video clips (~5s, 24fps) from each keyframe.

## Setup (notebook)

```python
# GPU: T4. Install per current Wan 2.2 repo instructions:
# https://github.com/Wan-Video/Wan2.2
# https://huggingface.co/Wan-AI/Wan2.2-TI2V-5B

# Pseudo-workflow (adjust to the repo's latest CLI):
from pathlib import Path
import json

jobs = json.loads(Path("/kaggle/input/.../wan_jobs.json").read_text())
# for job in jobs["jobs"]:
#   run TI2V with image=job["keyframe"], prompt=job["motionPrompt"], seed=job["seed"]
#   save to /kaggle/working/{job['id']}.mp4
```

## Prompt rule

Keyframe already holds subject + place. Prompt = **motion + camera only**, e.g.:

> slow push-in toward the glowing television, soft flicker, gentle motion, fixed framing otherwise

Avoid re-describing the boy or inventing logos.

## After download

Place files at:

```
outputs/shots/shot_01.mp4
...
outputs/shots/shot_10.mp4
```

Then locally:

```bash
npm run shots
npm run assemble
```
