import fs from "node:fs";
import path from "node:path";
import { stageBanner, logRun } from "./lib/log.js";
import { loadStoryboard } from "./lib/validate.js";
import { ensureOutputDirs, writeJson } from "./lib/fsutil.js";
import { paths, shotKeyframePath, shotVideoPath } from "./lib/paths.js";
import { shouldSkip, writeCacheMeta, hashInputs } from "./lib/cache.js";
import { isDryRun } from "./lib/config.js";
import { writePlaceholderMp4 } from "./lib/placeholder.js";
import { isMain } from "./lib/main.js";

/**
 * Moving-shots stage.
 * Wan 2.2 runs on Kaggle (GPU). This stage:
 *  - builds a job manifest for the notebook
 *  - uses Ken Burns / still fallbacks locally when clips are missing (dry-run or quota)
 *  - if outputs/shots/{id}.mp4 already exists from a Kaggle download, caches and keeps it
 */
export async function runShots() {
  stageBanner("shots");
  ensureOutputDirs();
  const sb = loadStoryboard();

  const jobs = sb.shots.map((shot) => ({
    id: shot.id,
    durationSec: Math.min(5, shot.durationSec),
    keyframe: `keyframes/${shot.id}.png`,
    motionPrompt: `${shot.motionPrompt}. Camera: ${shot.camera}. Slow gentle motion only.`,
    seed: shot.seed,
    fallback: shot.fallback || "kenburns",
  }));

  const manifestPath = path.join(paths.shots, "wan_jobs.json");
  writeJson(manifestPath, {
    model: "Wan2.2-TI2V-5B",
    note: "Run kaggle/wan_ti2v.ipynb, then copy mp4 files into outputs/shots/",
    jobs,
  });

  for (const shot of sb.shots) {
    const out = shotVideoPath(shot.id);
    const keyframe = shotKeyframePath(shot.id);
    const inputs = {
      stage: "shots",
      shot: shot.id,
      motion: shot.motionPrompt,
      camera: shot.camera,
      keyframeHash: fs.existsSync(keyframe)
        ? hashInputs({ mtime: fs.statSync(keyframe).mtimeMs, size: fs.statSync(keyframe).size })
        : null,
    };
    const { skip, key } = shouldSkip("shots", inputs, out);

    // Prefer a real downloaded clip if present and cache says ok
    if (skip) {
      console.log(`skip ${shot.id} (cache)`);
      logRun({
        stage: "shots",
        model: "Wan2.2-TI2V-5B",
        parameters: { shot: shot.id, cached: true },
        seed: shot.seed,
        latencyMs: 0,
        costUsd: 0,
        status: "cache-hit",
      });
      continue;
    }

    // If user already dropped a real mp4 here (not a stub), accept it
    if (fs.existsSync(out) && fs.statSync(out).size > 1000) {
      writeCacheMeta("shots", key, out, { source: "preexisting" });
      logRun({
        stage: "shots",
        model: "Wan2.2-TI2V-5B",
        parameters: { shot: shot.id, source: "preexisting-file" },
        seed: shot.seed,
        latencyMs: 0,
        costUsd: 0,
        status: "ok",
      });
      console.log(`ok ${shot.id} (existing clip)`);
      continue;
    }

    const how = writePlaceholderMp4(out, Math.min(5, shot.durationSec), fs.existsSync(keyframe) ? keyframe : null);
    writeCacheMeta("shots", key, out, {
      dryRun: isDryRun(),
      fallback: shot.fallback || "kenburns",
      how,
    });
    logRun({
      stage: "shots",
      model: isDryRun() ? "dry-run-kenburns" : "kenburns-fallback",
      parameters: {
        shot: shot.id,
        fallback: shot.fallback || "kenburns",
        note: "Replace with Wan clip from Kaggle when ready",
      },
      seed: shot.seed,
      latencyMs: 0,
      costUsd: 0,
      status: isDryRun() ? "dry-run" : "fallback",
    });
    console.log(`${isDryRun() ? "dry-run" : "fallback"} ${shot.id} (${how})`);
  }

  console.log(`Job manifest → ${manifestPath}`);
  console.log("Next: open kaggle/wan_ti2v.ipynb, generate clips, copy into outputs/shots/");
}

if (isMain(import.meta.url)) {
  runShots().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
