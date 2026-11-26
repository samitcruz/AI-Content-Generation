import fs from "node:fs";
import path from "node:path";
import { stageBanner, logRun } from "./lib/log.js";
import { loadStoryboard } from "./lib/validate.js";
import { ensureOutputDirs, writeJson } from "./lib/fsutil.js";
import { paths } from "./lib/paths.js";
import { shouldSkip, writeCacheMeta } from "./lib/cache.js";
import { env, isDryRun } from "./lib/config.js";
import { writeSilentWav } from "./lib/placeholder.js";
import { runGenerateScore } from "./generate_score_ffmpeg.js";
import { buildLyriaPrompt, generateLyriaMusic, writeLyriaAudio } from "./lib/lyria.js";
import { isMain } from "./lib/main.js";

function musicSource() {
  return (process.env.MUSIC_SOURCE || "auto").toLowerCase();
}

function useExistingOnly() {
  return process.env.MUSIC_USE_EXISTING === "1";
}

function isAudibleFile(filePath) {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).size > 8000;
  } catch {
    return false;
  }
}

function clearScoreFiles() {
  for (const name of ["score.wav", "score.mp3"]) {
    const p = path.join(paths.music, name);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
}

/**
 * Music stage:
 * 1) Gemini Lyria (if key + live + MUSIC_SOURCE auto|lyria)
 * 2) Local FFmpeg cinematic pad (free-tier reliable audible bed)
 * Optional: drop score.wav|.mp3 yourself (MUSIC_USE_EXISTING=1 or preexisting skip).
 */
export async function runMusic() {
  stageBanner("music");
  ensureOutputDirs();
  const sb = loadStoryboard();
  const outWav = path.join(paths.music, "score.wav");
  const outMp3 = path.join(paths.music, "score.mp3");
  const briefPath = path.join(paths.music, "music_brief.json");
  const prompt = buildLyriaPrompt(sb);
  const source = musicSource();

  fs.writeFileSync(path.join(paths.music, "lyria_prompt.txt"), prompt, "utf8");

  writeJson(briefPath, {
    model: source === "ffmpeg" ? "ffmpeg-cinematic-pad" : "lyria-or-ffmpeg",
    caption: sb.music.caption,
    durationSec: sb.music.durationSec,
    tempoBpm: sb.music.tempoBpm,
    instrumental: sb.music.instrumental,
    cues: sb.music.cues,
    outputFilenames: ["score.mp3", "score.wav"],
    lyriaPromptFile: "lyria_prompt.txt",
    musicSource: source,
  });

  const inputs = {
    stage: "music",
    caption: sb.music.caption,
    durationSec: sb.music.durationSec,
    tempoBpm: sb.music.tempoBpm,
    musicSource: source,
  };
  const cacheTarget = isAudibleFile(outMp3) ? outMp3 : outWav;
  const { key } = shouldSkip("music", inputs, cacheTarget);

  // Keep preexisting score only when explicitly requested (default: regenerate).
  if (
    (useExistingOnly() || source === "file") &&
    (isAudibleFile(outWav) || isAudibleFile(outMp3))
  ) {
    const existing = isAudibleFile(outMp3) ? outMp3 : outWav;
    writeCacheMeta("music", key, existing, { source: "preexisting" });
    logRun({
      stage: "music",
      model: "preexisting-score",
      parameters: { file: path.basename(existing) },
      seed: null,
      latencyMs: 0,
      costUsd: 0,
      status: "ok",
    });
    console.log(`ok music (existing ${path.basename(existing)})`);
    return;
  }

  if (isDryRun()) {
    const how = writeSilentWav(outWav, sb.music.durationSec);
    writeCacheMeta("music", key, outWav, { dryRun: true, how });
    logRun({
      stage: "music",
      model: "dry-run-silence",
      parameters: { note: "Set PIPELINE_MODE=live for Lyria/FFmpeg score" },
      seed: null,
      latencyMs: 0,
      costUsd: 0,
      status: "dry-run",
    });
    console.log(`dry-run music → ${outWav}`);
    return;
  }

  // --- Lyria (Gemini API) ---
  const wantLyria = source === "auto" || source === "lyria";
  const apiKey = env.geminiKey();
  if (wantLyria && apiKey) {
    const t0 = Date.now();
    try {
      const result = await generateLyriaMusic(apiKey, prompt);
      clearScoreFiles();
      const outPath = writeLyriaAudio(result, path.join(paths.music, "score"));
      if (!isAudibleFile(outPath)) {
        throw new Error(`Lyria wrote tiny/empty file: ${outPath}`);
      }
      if (result.text) {
        fs.writeFileSync(path.join(paths.music, "lyria_structure.txt"), result.text, "utf8");
      }
      writeCacheMeta("music", key, outPath, {
        source: "lyria",
        model: result.model,
        via: result.via,
        bytes: fs.statSync(outPath).size,
      });
      logRun({
        stage: "music",
        model: result.model,
        parameters: {
          via: result.via,
          bytes: fs.statSync(outPath).size,
          file: path.basename(outPath),
          note: "Lyria instrumental; free tier may be unavailable — FFmpeg is fallback",
        },
        seed: null,
        latencyMs: Date.now() - t0,
        costUsd: 0,
        status: "ok",
      });
      console.log(`ok music (Lyria ${result.model}) → ${outPath}`);
      return;
    } catch (e) {
      console.warn("Lyria unavailable (common on free tier):", e.message || e);
      logRun({
        stage: "music",
        model: "lyria",
        parameters: { error: String(e.message || e).slice(0, 400) },
        seed: null,
        latencyMs: Date.now() - t0,
        costUsd: 0,
        status: "fallback",
      });
      if (source === "lyria") {
        // Still fall through to FFmpeg so the film is never silent
        console.warn("MUSIC_SOURCE=lyria failed — falling back to audible FFmpeg pad");
      }
    }
  } else if (wantLyria && !apiKey) {
    console.warn("No GEMINI_API_KEY — skipping Lyria, using FFmpeg pad");
  }

  // --- FFmpeg audible pad (free, local, reliable) ---
  if (source !== "file") {
    try {
      clearScoreFiles();
      await runGenerateScore();
      if (!isAudibleFile(outWav)) {
        throw new Error("FFmpeg score missing or too small");
      }
      writeCacheMeta("music", key, outWav, { source: "ffmpeg-cinematic-pad" });
      console.log(`ok music (FFmpeg pad) → ${outWav}`);
      console.log(`Brief → ${briefPath}`);
      return;
    } catch (e) {
      console.warn("FFmpeg score generate failed:", e.message || e);
    }
  }

  const how = writeSilentWav(outWav, sb.music.durationSec);
  writeCacheMeta("music", key, outWav, { how, placeholder: true });
  logRun({
    stage: "music",
    model: "placeholder-bed",
    parameters: {
      caption: sb.music.caption.slice(0, 120),
      note: "Silent fallback only — check FFmpeg install",
    },
    seed: null,
    latencyMs: 0,
    costUsd: 0,
    status: "fallback",
  });
  console.log(`placeholder music → ${outWav}`);
}

if (isMain(import.meta.url)) {
  runMusic().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
