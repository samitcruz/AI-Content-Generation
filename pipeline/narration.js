import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { stageBanner, logRun } from "./lib/log.js";
import { loadStoryboard } from "./lib/validate.js";
import { ensureOutputDirs } from "./lib/fsutil.js";
import { narrationPath } from "./lib/paths.js";
import { shouldSkip, writeCacheMeta } from "./lib/cache.js";
import { env, filmLanguages, isDryRun } from "./lib/config.js";
import { writeSilentWav } from "./lib/placeholder.js";
import { isMain } from "./lib/main.js";

const GEMINI_TTS_MODELS = [
  "gemini-3.8-flash-tts",
  "gemini-3.1-flash-tts-preview",
  "gemini-2.5-flash-preview-tts",
];
const VOICE_EN = "Puck";

function parseRateFromMime(mime) {
  const m = /rate=(\d+)/i.exec(mime || "");
  return m ? Number(m[1]) : 24000;
}

function pcmToWav(pcm, sampleRate, channels) {
  const dataSize = pcm.length;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * 2, 28);
  buffer.writeUInt16LE(channels * 2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  pcm.copy(buffer, 44);
  return buffer;
}

function isUsableNarration(filePath) {
  try {
    if (!fs.existsSync(filePath)) return false;
    return fs.statSync(filePath).size >= 20000;
  } catch {
    return false;
  }
}

function toWavIfNeeded(filePath) {
  if (filePath.endsWith(".wav")) return filePath;
  const wav = filePath.replace(/\.[^.]+$/, ".wav");
  execFileSync("ffmpeg", ["-y", "-i", filePath, wav], { stdio: "ignore" });
  return wav;
}

async function resolveAddisMaleVoice(addis) {
  const preferred = env.addisVoiceAm();
  try {
    const voices = await addis.voices.list({ language: "am", gender: "male" });
    const list = Array.isArray(voices) ? voices : voices?.data || voices?.voices || [];
    const available = list.filter((v) => v.isAvailable !== false);
    const byId = available.find((v) => v.id === preferred);
    if (byId) return byId.id;
    const narration = available.find((v) =>
      /yohanes|yohannes|narrat|calm|reflect/i.test(
        `${v.id} ${v.name || ""} ${v.style || ""} ${v.descriptor || ""}`
      )
    );
    if (narration) return narration.id;
    if (available[0]?.id) return available[0].id;
  } catch (err) {
    console.warn(`Addis voices.list failed (${err.message}); using ${preferred}`);
  }
  return preferred;
}

async function synthesizeAddisAmharic(text, outPath) {
  const key = env.addisKey();
  if (!key) throw new Error("Missing ADDIS_AI_API_KEY (or ADDIS_API_KEY)");

  const { default: AddisAI } = await import("addisai");
  const addis = new AddisAI({ apiKey: key });
  const voiceId = await resolveAddisMaleVoice(addis);
  const t0 = Date.now();

  const clip = await addis.voice.generate({
    voiceId,
    text,
    language: "am",
    outputFormat: "wav_44100",
    voiceSettings: { speed: 45, stability: 60, similarity: 55, style: 20 },
  });

  const tmp = `${outPath}.tmp.wav`;
  if (typeof clip.toFile === "function") {
    await clip.toFile(tmp);
  } else if (clip.audioUrl) {
    const res = await fetch(clip.audioUrl);
    if (!res.ok) throw new Error(`Addis audio download ${res.status}`);
    fs.writeFileSync(tmp, Buffer.from(await res.arrayBuffer()));
  } else {
    throw new Error("Addis TTS returned no file/url");
  }

  // Normalize to mono 24k WAV for consistent assemble
  try {
    execFileSync(
      "ffmpeg",
      ["-y", "-i", tmp, "-ac", "1", "-ar", "24000", outPath],
      { stdio: "ignore" }
    );
    fs.unlinkSync(tmp);
  } catch {
    fs.renameSync(tmp, outPath);
  }

  const bytes = fs.statSync(outPath).size;
  if (bytes < 20000) throw new Error(`Addis wrote suspiciously small file (${bytes}B)`);

  return {
    latencyMs: Date.now() - t0,
    model: "addis-voices-2",
    voiceId,
    bytes,
    durationSeconds: clip.durationSeconds ?? null,
  };
}

async function synthesizeGeminiEnglish(text, outPath) {
  const key = env.geminiKey();
  if (!key) throw new Error("Missing GEMINI_API_KEY");

  const style = "Speak in clear English, warm, unhurried, intimate documentary narration.";
  const spoken = `${style}\n\n${text}`;
  const t0 = Date.now();
  let lastErr = null;

  for (const model of GEMINI_TTS_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const body = {
      contents: [{ parts: [{ text: spoken }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE_EN } },
        },
      },
    };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      lastErr = new Error(`Gemini TTS ${model} ${res.status}: ${(await res.text()).slice(0, 300)}`);
      if (res.status === 401 || res.status === 403) throw lastErr;
      continue;
    }
    const json = await res.json();
    const inline = json?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData;
    if (!inline?.data) {
      lastErr = new Error(`Gemini TTS ${model} returned no audio`);
      continue;
    }
    const mime = inline.mimeType || "";
    const raw = Buffer.from(inline.data, "base64");
    if (mime.includes("pcm") || mime.includes("L16") || (!mime.includes("wav") && !mime.includes("mp3"))) {
      fs.writeFileSync(outPath, pcmToWav(raw, parseRateFromMime(mime), 1));
    } else {
      fs.writeFileSync(outPath, raw);
      toWavIfNeeded(outPath);
    }
    const bytes = fs.statSync(outPath).size;
    if (bytes < 20000) {
      lastErr = new Error(`Gemini TTS ${model} small file (${bytes}B)`);
      continue;
    }
    return { latencyMs: Date.now() - t0, model, voiceId: VOICE_EN, bytes };
  }
  throw lastErr || new Error("Gemini TTS failed");
}

export async function runNarration() {
  stageBanner("narration");
  ensureOutputDirs();
  const sb = loadStoryboard();
  const langs = filmLanguages();

  for (const lang of langs) {
    for (const shot of sb.shots) {
      const text = shot.narration[lang];
      const out = narrationPath(shot.id, lang);
      const provider = lang === "am" ? "addis" : "gemini";
      const inputs = {
        stage: "narration",
        shot: shot.id,
        lang,
        text,
        provider,
        voice: lang === "am" ? env.addisVoiceAm() : VOICE_EN,
      };
      const { skip, key } = shouldSkip("narration", inputs, out);

      if (skip && isUsableNarration(out)) {
        console.log(`skip ${shot.id}/${lang} (cache)`);
        logRun({
          stage: "narration",
          model: provider,
          parameters: { shot: shot.id, lang, cached: true },
          seed: null,
          latencyMs: 0,
          costUsd: 0,
          status: "cache-hit",
        });
        continue;
      }

      if (fs.existsSync(out) && !isUsableNarration(out)) fs.unlinkSync(out);

      if (isDryRun()) {
        const how = writeSilentWav(out, Math.max(1.5, shot.durationSec * 0.7));
        writeCacheMeta("narration", key, out, { dryRun: true, how });
        logRun({
          stage: "narration",
          model: "dry-run-silence",
          parameters: { shot: shot.id, lang },
          seed: null,
          latencyMs: 0,
          costUsd: 0,
          status: "dry-run",
        });
        console.log(`dry-run ${shot.id}/${lang}`);
        continue;
      }

      try {
        let result;
        if (lang === "am") {
          try {
            result = await synthesizeAddisAmharic(text, out);
          } catch (addisErr) {
            const msg = String(addisErr.message || addisErr);
            const credits =
              /insufficient|credits|balance_too_low|402/i.test(msg) ||
              addisErr?.code === "INSUFFICIENT_CREDITS" ||
              addisErr?.status === 402;
            if (!credits) throw addisErr;
            console.warn(
              `Addis wallet empty for ${shot.id}/am — falling back to Gemini TTS. Top up free credit at addisassistant.com`
            );
            logRun({
              stage: "narration",
              model: "addis-voices-2",
              parameters: { shot: shot.id, lang, fallback: "gemini" },
              seed: null,
              latencyMs: 0,
              costUsd: 0,
              status: "error",
              error: msg.slice(0, 300),
            });
            // Reuse English Gemini path with Amharic text (quality weaker; temporary)
            result = await synthesizeGeminiEnglish(text, out);
            result = { ...result, model: `${result.model}+am-fallback`, voiceId: `${result.voiceId}-am` };
          }
        } else {
          result = await synthesizeGeminiEnglish(text, out);
        }
        writeCacheMeta("narration", key, out, { bytes: result.bytes, voiceId: result.voiceId });
        logRun({
          stage: "narration",
          model: result.model,
          parameters: {
            shot: shot.id,
            lang,
            voice: result.voiceId,
            bytes: result.bytes,
            durationSeconds: result.durationSeconds ?? undefined,
          },
          seed: null,
          latencyMs: result.latencyMs,
          costUsd: 0,
          status: "ok",
        });
        console.log(
          `ok ${shot.id}/${lang} (${result.latencyMs}ms, ${result.bytes}B, ${result.model}, ${result.voiceId})`
        );
      } catch (err) {
        if (fs.existsSync(out)) fs.unlinkSync(out);
        logRun({
          stage: "narration",
          model: provider,
          parameters: { shot: shot.id, lang },
          seed: null,
          latencyMs: 0,
          costUsd: 0,
          status: "error",
          error: String(err.message || err),
        });
        console.warn(`FAILED ${shot.id}/${lang}: ${err.message}`);
        throw err;
      }
    }
  }
}

if (isMain(import.meta.url)) {
  runNarration().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
