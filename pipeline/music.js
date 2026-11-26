import fs from "node:fs";
import path from "node:path";
import { stageBanner, logRun } from "./lib/log.js";
import { loadStoryboard } from "./lib/validate.js";
import { ensureOutputDirs, writeJson } from "./lib/fsutil.js";
import { paths } from "./lib/paths.js";
import { shouldSkip, writeCacheMeta } from "./lib/cache.js";
import { isDryRun } from "./lib/config.js";
import { writeSilentWav } from "./lib/placeholder.js";
import { isMain } from "./lib/main.js";

/**
 * Music stage — ACE-Step 1.5 on Kaggle/Colab.
 * Writes a job brief + dry-run / placeholder bed so assembly can proceed.
 * Drop the chosen track at outputs/music/score.wav (or .mp3) when ready.
 */
export async function runMusic() {
  stageBanner("music");
  ensureOutputDirs();
  const sb = loadStoryboard();
  const outWav = path.join(paths.music, "score.wav");
  const briefPath = path.join(paths.music, "ace_step_brief.json");

  writeJson(briefPath, {
    model: "ACE-Step-1.5",
    caption: sb.music.caption,
    durationSec: sb.music.durationSec,
    tempoBpm: sb.music.tempoBpm,
    instrumental: sb.music.instrumental,
    cues: sb.music.cues,
    candidatesSuggested: 3,
    outputFilename: "score.wav",
    notebook: "kaggle/ace_step_music.ipynb",
  });

  const inputs = {
    stage: "music",
    caption: sb.music.caption,
    durationSec: sb.music.durationSec,
    tempoBpm: sb.music.tempoBpm,
  };
  const { skip, key } = shouldSkip("music", inputs, outWav);

  if (skip) {
    console.log("skip music (cache)");
    logRun({
      stage: "music",
      model: "ACE-Step-1.5",
      parameters: { cached: true },
      seed: null,
      latencyMs: 0,
      costUsd: 0,
      status: "cache-hit",
    });
    return;
  }

  if (fs.existsSync(outWav) && fs.statSync(outWav).size > 1000) {
    writeCacheMeta("music", key, outWav, { source: "preexisting" });
    logRun({
      stage: "music",
      model: "ACE-Step-1.5",
      parameters: { source: "preexisting-file" },
      seed: null,
      latencyMs: 0,
      costUsd: 0,
      status: "ok",
    });
    console.log("ok music (existing score.wav)");
    return;
  }

  // Also accept mp3 dropped by user
  const outMp3 = path.join(paths.music, "score.mp3");
  if (fs.existsSync(outMp3) && fs.statSync(outMp3).size > 1000) {
    writeCacheMeta("music", key, outMp3, { source: "preexisting-mp3" });
    logRun({
      stage: "music",
      model: "ACE-Step-1.5",
      parameters: { source: "preexisting-mp3" },
      seed: null,
      latencyMs: 0,
      costUsd: 0,
      status: "ok",
    });
    console.log("ok music (existing score.mp3)");
    return;
  }

  const how = writeSilentWav(outWav, sb.music.durationSec);
  writeCacheMeta("music", key, outWav, { dryRun: isDryRun(), how, placeholder: true });
  logRun({
    stage: "music",
    model: isDryRun() ? "dry-run-silence" : "placeholder-bed",
    parameters: {
      caption: sb.music.caption.slice(0, 120),
      note: "Replace outputs/music/score.wav with ACE-Step candidate",
    },
    seed: null,
    latencyMs: 0,
    costUsd: 0,
    status: isDryRun() ? "dry-run" : "fallback",
  });
  console.log(`${isDryRun() ? "dry-run" : "placeholder"} music → ${outWav}`);
  console.log(`Brief → ${briefPath}`);
}

if (isMain(import.meta.url)) {
  runMusic().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
