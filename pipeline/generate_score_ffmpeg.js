/**
 * Local cinematic underscore generator (FFmpeg).
 * Primary music path for this project: audible dusk pads under narration.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { paths } from "./lib/paths.js";
import { loadStoryboard } from "./lib/validate.js";
import { ensureOutputDirs } from "./lib/fsutil.js";
import { logRun } from "./lib/log.js";
import { isMain } from "./lib/main.js";

function buildFilter(durationSec, bpm, variant) {
  // Soft dusk pads: sparse low chords + gentle high shimmer + very quiet noise bed
  const beat = 60 / bpm;
  const shifts = [
    { root: 110, third: 138.59, fifth: 164.81 }, // A minor-ish
    { root: 98, third: 123.47, fifth: 146.83 }, // G-ish
    { root: 130.81, third: 155.56, fifth: 196.0 }, // C-ish
  ];
  const chord = shifts[variant % shifts.length];
  const swell1 = Math.min(28, durationSec * 0.35);
  const swell2 = Math.min(48, durationSec * 0.6);

  // volume envelopes follow storyboard cues (~0, 28, 48, 64)
  const voice = (freq, vol, delay) =>
    `sine=frequency=${freq}:sample_rate=44100,volume=${vol},adelay=${delay}|${delay},afade=t=in:st=0:d=4,afade=t=out:st=${durationSec - 6}:d=6[v${freq}]`;

  return (
    `${voice(chord.root, 0.12, 0)};` +
    `${voice(chord.third, 0.08, Math.round(beat * 1000))};` +
    `${voice(chord.fifth, 0.07, Math.round(beat * 2000))};` +
    `anoisesrc=color=pink:sample_rate=44100:duration=${durationSec},volume=0.015,lowpass=f=600[n];` +
    `sine=frequency=${chord.root * 2}:sample_rate=44100,volume=0.03,afade=t=in:st=${swell1}:d=3,afade=t=out:st=${swell2}:d=8[shimmer];` +
    `[v${chord.root}][v${chord.third}][v${chord.fifth}][n][shimmer]amix=inputs=5:duration=longest:dropout_transition=3,` +
    `alimiter=limit=0.35,atrim=0:${durationSec},asetpts=PTS-STARTPTS[out]`
  );
}

function generateCandidate(outPath, durationSec, bpm, variant) {
  const filter = buildFilter(durationSec, bpm, variant);
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-filter_complex",
      filter,
      "-map",
      "[out]",
      "-t",
      String(durationSec),
      "-c:a",
      "pcm_s16le",
      outPath,
    ],
    { stdio: "ignore" }
  );
}

export async function runGenerateScore() {
  ensureOutputDirs();
  const sb = loadStoryboard();
  const duration = sb.music.durationSec || 82;
  const bpm = sb.music.tempoBpm || 78;
  const candidatesDir = path.join(paths.music, "candidates");
  fs.mkdirSync(candidatesDir, { recursive: true });

  const pathsOut = [];
  for (let i = 0; i < 3; i++) {
    const p = path.join(candidatesDir, `candidate_${i + 1}.wav`);
    const t0 = Date.now();
    generateCandidate(p, duration, bpm, i);
    const bytes = fs.statSync(p).size;
    pathsOut.push(p);
    logRun({
      stage: "music",
      model: "ffmpeg-cinematic-pad",
      parameters: { candidate: i + 1, duration, bpm, bytes },
      seed: i,
      latencyMs: Date.now() - t0,
      costUsd: 0,
      status: "ok",
    });
    console.log(`candidate ${i + 1} → ${p} (${bytes}B)`);
  }

  // Prefer candidate 1 (A-minor dusk pad) as default score
  const chosen = pathsOut[0];
  const dest = path.join(paths.music, "score.wav");
  fs.copyFileSync(chosen, dest);
  logRun({
    stage: "music",
    model: "ffmpeg-cinematic-pad",
    parameters: {
      chosen: "candidate_1.wav",
      reason: "softest under VO; dusk pad; no lead melody",
    },
    seed: 0,
    latencyMs: 0,
    costUsd: 0,
    status: "ok",
  });
  console.log(`chose → ${dest}`);
  return dest;
}

if (isMain(import.meta.url)) {
  runGenerateScore().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
