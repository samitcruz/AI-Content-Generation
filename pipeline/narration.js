import fs from "node:fs";
import { stageBanner, logRun } from "./lib/log.js";
import { loadStoryboard } from "./lib/validate.js";
import { ensureOutputDirs } from "./lib/fsutil.js";
import { narrationPath } from "./lib/paths.js";
import { shouldSkip, writeCacheMeta } from "./lib/cache.js";
import { env, filmLanguages, isDryRun, requireEnv } from "./lib/config.js";
import { writeSilentWav } from "./lib/placeholder.js";
import { isMain } from "./lib/main.js";

const TTS_MODELS = [
  "gemini-3.8-flash-tts",
  "gemini-3.1-flash-tts-preview",
  "gemini-2.5-flash-preview-tts",
];
const VOICE_AM = "Kore";
const VOICE_EN = "Puck";

function parseRateFromMime(mime) {
  const m = /rate=(\d+)/i.exec(mime || "");
  return m ? Number(m[1]) : 24000;
}

async function synthesizeGemini(text, lang, outPath) {
  requireEnv(["GEMINI_API_KEY"]);
  const style =
    lang === "am"
      ? "Speak in clear Amharic, warm, unhurried, intimate documentary narration."
      : "Speak in clear English, warm, unhurried, intimate documentary narration.";

  const spoken = `${style}\n\n${text}`;
  const t0 = Date.now();
  let lastErr = null;

  for (const model of TTS_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.geminiKey()}`;
    const body = {
      contents: [{ parts: [{ text: spoken }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: lang === "am" ? VOICE_AM : VOICE_EN },
          },
        },
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text();
      lastErr = new Error(`Gemini TTS ${model} ${res.status}: ${errText.slice(0, 300)}`);
      // Retry other models on 404/503; fail fast on auth errors
      if (res.status === 401 || res.status === 403) throw lastErr;
      continue;
    }

    const json = await res.json();
    const inline = json?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData;
    if (!inline?.data) {
      lastErr = new Error(`Gemini TTS ${model} returned no audio data`);
      continue;
    }

    const mime = inline.mimeType || "";
    const raw = Buffer.from(inline.data, "base64");
    if (mime.includes("pcm") || mime.includes("L16") || (!mime.includes("wav") && !mime.includes("mp3"))) {
      const rate = parseRateFromMime(mime);
      fs.writeFileSync(outPath, pcmToWav(raw, rate, 1));
    } else {
      fs.writeFileSync(outPath, raw);
    }

    // Reject empty / near-silent stubs so we don't cache bad audio
    const st = fs.statSync(outPath);
    if (st.size < 20000) {
      lastErr = new Error(`Gemini TTS ${model} wrote suspiciously small file (${st.size} bytes)`);
      continue;
    }

    return { latencyMs: Date.now() - t0, model, mime, bytes: st.size };
  }

  throw lastErr || new Error("Gemini TTS failed for all models");
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

/** Treat tiny silent placeholders as missing so live runs regenerate them. */
function isUsableNarration(filePath) {
  try {
    if (!fs.existsSync(filePath)) return false;
    return fs.statSync(filePath).size >= 20000;
  } catch {
    return false;
  }
}

export async function runNarration() {
  stageBanner("narration");
  ensureOutputDirs();
  const sb = loadStoryboard();
  const langs = filmLanguages();
  const primaryModel = TTS_MODELS[0];

  for (const lang of langs) {
    for (const shot of sb.shots) {
      const text = shot.narration[lang];
      const out = narrationPath(shot.id, lang);
      const inputs = { stage: "narration", shot: shot.id, lang, text, model: primaryModel };
      const { skip, key } = shouldSkip("narration", inputs, out);

      if (skip && isUsableNarration(out)) {
        console.log(`skip ${shot.id}/${lang} (cache)`);
        logRun({
          stage: "narration",
          model: primaryModel,
          parameters: { shot: shot.id, lang, cached: true },
          seed: null,
          latencyMs: 0,
          costUsd: 0,
          status: "cache-hit",
        });
        continue;
      }

      // Drop tiny stubs so we never assemble silence by accident
      if (fs.existsSync(out) && !isUsableNarration(out)) {
        fs.unlinkSync(out);
      }

      if (isDryRun()) {
        const how = writeSilentWav(out, Math.max(1.5, shot.durationSec * 0.7));
        writeCacheMeta("narration", key, out, { dryRun: true, how });
        logRun({
          stage: "narration",
          model: "dry-run-silence",
          parameters: { shot: shot.id, lang, textChars: text.length },
          seed: null,
          latencyMs: 0,
          costUsd: 0,
          status: "dry-run",
        });
        console.log(`dry-run ${shot.id}/${lang}`);
        continue;
      }

      try {
        const result = await synthesizeGemini(text, lang, out);
        writeCacheMeta("narration", key, out, { mime: result.mime, bytes: result.bytes });
        logRun({
          stage: "narration",
          model: result.model,
          parameters: {
            shot: shot.id,
            lang,
            voice: lang === "am" ? VOICE_AM : VOICE_EN,
            bytes: result.bytes,
          },
          seed: null,
          latencyMs: result.latencyMs,
          costUsd: 0,
          status: "ok",
        });
        console.log(`ok ${shot.id}/${lang} (${result.latencyMs}ms, ${result.bytes}B, ${result.model})`);
      } catch (err) {
        // Do not leave a silent file that looks like success
        if (fs.existsSync(out)) fs.unlinkSync(out);
        logRun({
          stage: "narration",
          model: primaryModel,
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
