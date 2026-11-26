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

function isSubstantialClip(filePath) {
  // Keep hand-dropped / higher-bitrate clips instead of regenerating Ken Burns.
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).size > 250000;
  } catch {
    return false;
  }
}

/**
 * Moving-shots stage — varied Ken Burns motion from keyframes (local, free, fast).
 */
export async function runShots() {
  stageBanner("shots");
  ensureOutputDirs();
  const sb = loadStoryboard();

  writeJson(path.join(paths.shots, "shots_manifest.json"), {
    model: "kenburns-v2",
    note: "Local FFmpeg Ken Burns from FLUX keyframes. Drop custom mp4s into outputs/shots/ to override.",
    shots: sb.shots.map((shot) => ({
      id: shot.id,
      durationSec: shot.durationSec,
      camera: shot.camera,
      motionPrompt: shot.motionPrompt,
      seed: shot.seed,
    })),
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
        model: "kenburns-v2",
        parameters: { shot: shot.id, cached: true },
        seed: shot.seed,
        latencyMs: 0,
        costUsd: 0,
        status: "cache-hit",
      });
      continue;
    }

    if (isSubstantialClip(out)) {
      writeCacheMeta("shots", key, out, { source: "preexisting" });
      logRun({
        stage: "shots",
        model: "preexisting-clip",
        parameters: { shot: shot.id, source: "preexisting-file", bytes: fs.statSync(out).size },
        seed: shot.seed,
        latencyMs: 0,
        costUsd: 0,
        status: "ok",
      });
      console.log(`ok ${shot.id} (existing clip)`);
      continue;
    }

    if (fs.existsSync(out)) fs.unlinkSync(out);

    const t0 = Date.now();
    const dur = Math.min(shot.durationSec, 8);
    const how = writeKenBurnsMp4(out, dur, keyframe, index + (shot.seed || 0));
    const bytes = fs.existsSync(out) ? fs.statSync(out).size : 0;
    writeCacheMeta("shots", key, out, {
      dryRun: isDryRun(),
      how,
      bytes,
    });
    logRun({
      stage: "shots",
      model: isDryRun() ? "dry-run-kenburns" : "kenburns-v2",
      parameters: { shot: shot.id, how, bytes },
      seed: shot.seed,
      latencyMs: Date.now() - t0,
      costUsd: 0,
      status: isDryRun() ? "dry-run" : "ok",
    });
    console.log(`${isDryRun() ? "dry-run" : "kenburns"} ${shot.id} (${how}, ${bytes}B)`);
  }
}

if (isMain(import.meta.url)) {
  runShots().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
