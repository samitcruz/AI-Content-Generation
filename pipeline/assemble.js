import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { stageBanner, logRun } from "./lib/log.js";
import { loadStoryboard } from "./lib/validate.js";
import { ensureOutputDirs } from "./lib/fsutil.js";
import {
  paths,
  shotKeyframePath,
  shotVideoPath,
  narrationPath,
  subtitlePath,
  filmPath,
} from "./lib/paths.js";
import { filmLanguages, isDryRun } from "./lib/config.js";
import { hasFfmpeg, writePlaceholderMp4 } from "./lib/placeholder.js";
import { isMain } from "./lib/main.js";

function escapeDrawtext(text) {
  return text.replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'");
}

function resolveFontFile() {
  const candidates = [
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/segoeui.ttf",
    "C:/Windows/Fonts/calibri.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

function ffmpegRun(args, opts = {}) {
  try {
    execFileSync("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"], ...opts });
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString().slice(-1200) : "";
    throw new Error(`ffmpeg failed: ${stderr || err.message}`);
  }
}

function writeSrt(sb, lang, outPath) {
  let t = 0;
  const lines = [];
  sb.shots.forEach((shot, i) => {
    const start = t;
    const end = t + shot.durationSec;
    // Subtitles are the *other* language
    const subLang = lang === "am" ? "en" : "am";
    const text = shot.narration[subLang];
    lines.push(String(i + 1));
    lines.push(`${fmtTs(start)} --> ${fmtTs(end)}`);
    lines.push(wrapSub(text));
    lines.push("");
    t = end;
  });
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, lines.join("\n"), "utf8");
}

function fmtTs(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.round((sec % 1) * 1000);
  return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)},${pad(ms, 3)}`;
}

function pad(n, w) {
  return String(n).padStart(w, "0");
}

function wrapSub(text) {
  if (text.length <= 40) return text;
  const mid = Math.floor(text.length / 2);
  let breakAt = text.lastIndexOf(" ", mid);
  if (breakAt < 10) breakAt = text.indexOf(" ", mid);
  if (breakAt < 0) return text;
  return `${text.slice(0, breakAt)}\n${text.slice(breakAt + 1)}`;
}

function musicFile() {
  const wav = path.join(paths.music, "score.wav");
  const mp3 = path.join(paths.music, "score.mp3");
  if (fs.existsSync(wav)) return wav;
  if (fs.existsSync(mp3)) return mp3;
  return null;
}

function buildConcatList(sb, workDir) {
  const listPath = path.join(workDir, "concat.txt");
  const lines = [];
  for (const shot of sb.shots) {
    const clip = shotVideoPath(shot.id);
    const key = shotKeyframePath(shot.id);
    let src = clip;
    if (!fs.existsSync(clip) || fs.statSync(clip).size < 100) {
      // Build a short Ken Burns from keyframe into assembly work dir
      src = path.join(workDir, `${shot.id}_kb.mp4`);
      if (hasFfmpeg() && fs.existsSync(key)) {
        execFileSync(
          "ffmpeg",
          [
            "-y",
            "-loop",
            "1",
            "-i",
            key,
            "-t",
            String(shot.durationSec),
            "-vf",
            "scale=768:1280:force_original_aspect_ratio=increase,crop=768:1280,zoompan=z='min(zoom+0.0008,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=768x1280:fps=24",
            "-pix_fmt",
            "yuv420p",
            "-r",
            "24",
            src,
          ],
          { stdio: "ignore" }
        );
      } else {
        writePlaceholderMp4(src, shot.durationSec, fs.existsSync(key) ? key : null);
      }
    } else {
      // Re-time clip to shot duration if needed
      const timed = path.join(workDir, `${shot.id}_timed.mp4`);
      if (hasFfmpeg()) {
        execFileSync(
          "ffmpeg",
          [
            "-y",
            "-i",
            clip,
            "-t",
            String(shot.durationSec),
            "-vf",
            "scale=768:1280:force_original_aspect_ratio=decrease,pad=768:1280:(ow-iw)/2:(oh-ih)/2",
            "-an",
            "-pix_fmt",
            "yuv420p",
            "-r",
            "24",
            timed,
          ],
          { stdio: "ignore" }
        );
        src = timed;
      }
    }
    lines.push(`file '${src.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`);
  }

  // End card
  const endCard = path.join(workDir, "endcard.mp4");
  if (hasFfmpeg()) {
    const font = resolveFontFile();
    const draw = font
      ? `drawtext=fontfile='${font.replace(/:/g, "\\:")}':text='${escapeDrawtext(sb.endCard.text)}':fontcolor=0xeeeeee:fontsize=42:x=(w-text_w)/2:y=(h-text_h)/2`
      : null;
    if (draw) {
      ffmpegRun([
        "-y",
        "-f",
        "lavfi",
        "-i",
        `color=c=0x140808:s=768x1280:d=${sb.endCard.durationSec}`,
        "-vf",
        draw,
        "-pix_fmt",
        "yuv420p",
        "-r",
        "24",
        endCard,
      ]);
    } else {
      // No system font: plain card; text still appears via burned-in SRT end note if needed
      ffmpegRun([
        "-y",
        "-f",
        "lavfi",
        "-i",
        `color=c=0x140808:s=768x1280:d=${sb.endCard.durationSec}`,
        "-pix_fmt",
        "yuv420p",
        "-r",
        "24",
        endCard,
      ]);
    }
  } else {
    writePlaceholderMp4(endCard, sb.endCard.durationSec, null);
  }
  lines.push(`file '${endCard.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`);

  fs.writeFileSync(listPath, lines.join("\n"), "utf8");
  return listPath;
}

function concatNarration(sb, lang, workDir) {
  const list = path.join(workDir, `narr_${lang}.txt`);
  const lines = [];
  for (const shot of sb.shots) {
    const p = narrationPath(shot.id, lang);
    if (!fs.existsSync(p)) throw new Error(`Missing narration ${p}`);
    lines.push(`file '${p.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`);
  }
  fs.writeFileSync(list, lines.join("\n"), "utf8");
  const out = path.join(workDir, `narration_${lang}.wav`);
  if (!hasFfmpeg()) {
    fs.copyFileSync(narrationPath(sb.shots[0].id, lang), out);
    return out;
  }
  execFileSync(
    "ffmpeg",
    ["-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", out],
    { stdio: "ignore" }
  );
  return out;
}

function aspectFilter(aspect) {
  if (aspect === "16:9") {
    return "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2";
  }
  return "scale=768:1280:force_original_aspect_ratio=decrease,pad=768:1280:(ow-iw)/2:(oh-ih)/2";
}

export async function runAssemble() {
  stageBanner("assemble");
  ensureOutputDirs();
  const sb = loadStoryboard();
  const langs = filmLanguages();
  const ffmpegOk = hasFfmpeg();

  if (!ffmpegOk) {
    console.warn("FFmpeg not found on PATH — writing stub film files. Install FFmpeg for real exports.");
  }

  for (const lang of langs) {
    const workDir = path.join(paths.assembly, lang);
    fs.mkdirSync(workDir, { recursive: true });
    writeSrt(sb, lang, subtitlePath(lang));

    const t0 = Date.now();
    const listPath = buildConcatList(sb, workDir);
    const picture = path.join(workDir, "picture.mp4");
    const narr = concatNarration(sb, lang, workDir);
    const music = musicFile();
    const srt = subtitlePath(lang);

    for (const aspect of sb.aspectRatios) {
      const out = filmPath(lang, aspect);
      if (!ffmpegOk) {
        writePlaceholderMp4(out, sb.durationTargetSec, shotKeyframePath(sb.shots[0].id));
        logRun({
          stage: "assemble",
          model: "stub-no-ffmpeg",
          parameters: { lang, aspect, dryRun: isDryRun() },
          seed: null,
          latencyMs: Date.now() - t0,
          costUsd: 0,
          status: "fallback",
        });
        console.log(`stub ${path.basename(out)}`);
        continue;
      }

      // Concat picture
      ffmpegRun(["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", picture]);

      // Subtitles path with spaces breaks libass on Windows — copy to a short local name
      const localSrt = path.join(workDir, "subs.srt");
      fs.copyFileSync(srt, localSrt);
      const mixed = path.join(workDir, `mixed_${aspect.replace(":", "x")}.mp4`);
      const vf = `${aspectFilter(aspect)},subtitles=subs.srt`;

      // Mix voice (+ quiet bed). Avoid sidechaincompress label bugs on some builds.
      if (music) {
        ffmpegRun([
          "-y",
          "-i",
          picture,
          "-i",
          narr,
          "-i",
          music,
          "-filter_complex",
          `[0:v]${vf},tpad=stop_mode=clone:stop_duration=30[vout];` +
            `[1:a]aformat=sample_rates=48000:channel_layouts=mono,volume=1.0[voice];` +
            `[2:a]aformat=sample_rates=48000:channel_layouts=mono,volume=0.12[bed];` +
            `[voice][bed]amix=inputs=2:duration=first:dropout_transition=2,alimiter=limit=0.95[aout]`,
          "-map",
          "[vout]",
          "-map",
          "[aout]",
          "-c:v",
          "libx264",
          "-pix_fmt",
          "yuv420p",
          "-c:a",
          "aac",
          "-shortest",
          mixed,
        ], { cwd: workDir });
      } else {
        ffmpegRun([
          "-y",
          "-i",
          picture,
          "-i",
          narr,
          "-filter_complex",
          `[0:v]${vf},tpad=stop_mode=clone:stop_duration=30[vout];[1:a]aformat=sample_rates=48000:channel_layouts=mono[aout]`,
          "-map",
          "[vout]",
          "-map",
          "[aout]",
          "-c:v",
          "libx264",
          "-pix_fmt",
          "yuv420p",
          "-c:a",
          "aac",
          "-shortest",
          mixed,
        ], { cwd: workDir });
      }

      // Loudness pass (~-14 LUFS)
      try {
        ffmpegRun([
          "-y",
          "-i",
          mixed,
          "-af",
          "loudnorm=I=-14:TP=-1.5:LRA=11",
          "-c:v",
          "copy",
          "-c:a",
          "aac",
          out,
        ]);
      } catch {
        fs.copyFileSync(mixed, out);
      }

      logRun({
        stage: "assemble",
        model: "ffmpeg",
        parameters: { lang, aspect, subtitles: path.basename(srt), ducked: Boolean(music) },
        seed: null,
        latencyMs: Date.now() - t0,
        costUsd: 0,
        status: "ok",
      });
      console.log(`ok ${path.basename(out)}`);
    }
  }
}

if (isMain(import.meta.url)) {
  runAssemble().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
