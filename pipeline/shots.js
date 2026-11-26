import fs from "node:fs";
import path from "node:path";
import { stageBanner, logRun } from "./lib/log.js";
import { loadStoryboard } from "./lib/validate.js";
import { ensureOutputDirs, writeJson } from "./lib/fsutil.js";
import { paths, shotKeyframePath, shotVideoPath } from "./lib/paths.js";
import { shouldSkip, writeCacheMeta, hashInputs } from "./lib/cache.js";
import { isDryRun } from "./lib/config.js";
import { writeKenBurnsMp4 } from "./lib/placeholder.js";
import { isMain } from "./lib/main.js";

function resolveKeyframe(shotId) {
  const png = shotKeyframePath(shotId);
  const jpg = png.replace(/\.png$/i, ".jpg");
  if (fs.existsSync(png) && fs.statSync(png).size > 10000) return png;
  if (fs.existsSync(jpg) && fs.statSync(jpg).size > 10000) return jpg;
  if (fs.existsSync(png)) return png;
  if (fs.existsSync(jpg)) return jpg;
  return null;
}

function isLikelyRealWanClip(filePath) {
  // Ken Burns clips from stills are usually small; Wan clips are larger.
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).size > 250000;
  } catch {
    return false;
  }
}

/**
 * Moving-shots stage.
 * Prefer Wan 2.2 clips from Kaggle when present; otherwise generate varied Ken Burns locally.
 */
export async function runShots() {
  stageBanner("shots");
  ensureOutputDirs();
  const sb = loadStoryboard();

  const jobs = sb.shots.map((shot) => ({
    id: shot.id,
    durationSec: Math.min(5, shot.durationSec),
    keyframePng: `keyframes/${shot.id}.png`,
    keyframeJpg: `keyframes/${shot.id}.jpg`,
    motionPrompt: `${shot.motionPrompt}. Camera: ${shot.camera}. Slow gentle motion only. No logos.`,
    seed: shot.seed,
    fallback: shot.fallback || "kenburns",
  }));

  const manifestPath = path.join(paths.shots, "wan_jobs.json");
  writeJson(manifestPath, {
    model: "Wan2.2-TI2V-5B",
    notebook: "kaggle/wan_ti2v.ipynb",
    note: "Upload keyframes + this JSON to Kaggle, run GPU notebook, download mp4s into outputs/shots/",
    jobs,
  });

  for (const [index, shot] of sb.shots.entries()) {
    const out = shotVideoPath(shot.id);
    const keyframe = resolveKeyframe(shot.id);
    const inputs = {
      stage: "shots",
      shot: shot.id,
      motion: shot.motionPrompt,
      camera: shot.camera,
      keyframeHash: keyframe
        ? hashInputs({ mtime: fs.statSync(keyframe).mtimeMs, size: fs.statSync(keyframe).size })
        : null,
      animator: "kenburns-v2",
    };
    const { skip, key } = shouldSkip("shots", inputs, out);

    if (skip && fs.existsSync(out) && fs.statSync(out).size > 5000) {
      console.log(`skip ${shot.id} (cache)`);
      logRun({
        stage: "shots",
        model: isLikelyRealWanClip(out) ? "Wan2.2-TI2V-5B" : "kenburns-v2",
        parameters: { shot: shot.id, cached: true },
        seed: shot.seed,
        latencyMs: 0,
        costUsd: 0,
        status: "cache-hit",
      });
      continue;
    }

    if (isLikelyRealWanClip(out)) {
      writeCacheMeta("shots", key, out, { source: "wan-or-preexisting" });
      logRun({
        stage: "shots",
        model: "Wan2.2-TI2V-5B",
        parameters: { shot: shot.id, source: "preexisting-file", bytes: fs.statSync(out).size },
        seed: shot.seed,
        latencyMs: 0,
        costUsd: 0,
        status: "ok",
      });
      console.log(`ok ${shot.id} (existing Wan-sized clip)`);
      continue;
    }

    // Force regenerate weak stubs / old still holds
    if (fs.existsSync(out)) fs.unlinkSync(out);

    const t0 = Date.now();
    const dur = Math.min(shot.durationSec, 8);
    const how = writeKenBurnsMp4(out, dur, keyframe, index + (shot.seed || 0));
    const bytes = fs.existsSync(out) ? fs.statSync(out).size : 0;
    writeCacheMeta("shots", key, out, {
      dryRun: isDryRun(),
      fallback: "kenburns",
      how,
      bytes,
    });
    logRun({
      stage: "shots",
      model: isDryRun() ? "dry-run-kenburns" : "kenburns-v2",
      parameters: {
        shot: shot.id,
        fallback: "kenburns",
        how,
        bytes,
        note: "Replace with Wan clip from kaggle/wan_ti2v.ipynb when GPU available",
      },
      seed: shot.seed,
      latencyMs: Date.now() - t0,
      costUsd: 0,
      status: isDryRun() ? "dry-run" : "fallback",
    });
    console.log(`${isDryRun() ? "dry-run" : "kenburns"} ${shot.id} (${how}, ${bytes}B)`);
  }

  console.log(`Job manifest → ${manifestPath}`);
  console.log("For real I2V: open kaggle/wan_ti2v.ipynb (GPU T4), then copy mp4s into outputs/shots/");
}

if (isMain(import.meta.url)) {
  runShots().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
