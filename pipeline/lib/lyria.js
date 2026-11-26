/**
 * Gemini Lyria music generation (Interactions API + generateContent fallback).
 * Free tier often returns 429/403 — callers must fall back to local FFmpeg pads.
 */
import fs from "node:fs";

const INTERACTIONS_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";

/** Prefer full-song, then clip (free-tier friendlier / shorter). */
export const LYRIA_MODELS = [
  process.env.LYRIA_MODEL,
  "lyria-3.5",
  "lyria-3-pro-preview",
  "lyria-3-clip-preview",
].filter(Boolean);

export function buildLyriaPrompt(sb) {
  const duration = sb.music?.durationSec || 82;
  const bpm = sb.music?.tempoBpm || 78;
  const caption = sb.music?.caption || "cinematic instrumental underscore";
  const cues = (sb.music?.cues || [])
    .map((c) => `- ${c.atSec}s: ${c.purpose}`)
    .join("\n");

  return [
    `Create one continuous INSTRUMENTAL underscore for a short film (~${duration} seconds).`,
    `Tempo about ${bpm} BPM. Soft cinematic pad under narration — not a lead song.`,
    `Style: ${caption}`,
    "",
    "STRICT RULES:",
    "- Instrumental only. No vocals, no choir, no humming, no lyrics.",
    "- Sparse piano and soft strings; optional quiet low pad.",
    "- No football chants, stadium anthems, club themes, or recognizable melodies.",
    "- Gentle dynamics so spoken voice stays readable.",
    "",
    "STRUCTURE:",
    cues ||
      [
        `- 0:00–0:28 quiet dusk atmosphere`,
        `- 0:28–0:48 gentle rise / discovery`,
        `- 0:48–1:04 brief hopeful peak then ease`,
        `- 1:04–end settle into warm quiet loyalty; soft fade`,
      ].join("\n"),
    "",
    `Target length: about ${duration} seconds. Instrumental only.`,
  ].join("\n");
}

function extractAudioFromInteraction(json) {
  const texts = [];
  let audioB64 = null;
  let mime = "audio/mpeg";

  const consider = (block) => {
    if (!block || typeof block !== "object") return;
    if (block.type === "text" && block.text) texts.push(block.text);
    if (block.text && !block.type) texts.push(block.text);
    if (block.type === "audio" && block.data) {
      audioB64 = block.data;
      if (block.mime_type) mime = block.mime_type;
    }
    if (block.inline_data?.data || block.inlineData?.data) {
      const inline = block.inline_data || block.inlineData;
      audioB64 = inline.data;
      mime = inline.mime_type || inline.mimeType || mime;
    }
  };

  if (json.output_audio?.data) {
    audioB64 = json.output_audio.data;
    mime = json.output_audio.mime_type || mime;
  }

  for (const step of json.steps || []) {
    for (const block of step.content || []) consider(block);
  }
  for (const out of json.outputs || []) consider(out);

  if (!audioB64) return null;
  return { buffer: Buffer.from(audioB64, "base64"), mime, text: texts.join("\n") };
}

function extractAudioFromGenerateContent(json) {
  const texts = [];
  let audioB64 = null;
  let mime = "audio/mpeg";
  for (const cand of json.candidates || []) {
    for (const part of cand.content?.parts || []) {
      if (part.text) texts.push(part.text);
      const inline = part.inlineData || part.inline_data;
      if (inline?.data) {
        audioB64 = inline.data;
        mime = inline.mimeType || inline.mime_type || mime;
      }
    }
  }
  if (!audioB64) return null;
  return { buffer: Buffer.from(audioB64, "base64"), mime, text: texts.join("\n") };
}

async function viaInteractions(apiKey, model, prompt) {
  const res = await fetch(INTERACTIONS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      model,
      input: prompt,
    }),
  });
  const raw = await res.text();
  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error(`Lyria interactions non-JSON (${res.status}): ${raw.slice(0, 200)}`);
  }
  if (!res.ok) {
    const msg = json.error?.message || raw.slice(0, 300);
    const err = new Error(`Lyria interactions ${res.status}: ${msg}`);
    err.status = res.status;
    throw err;
  }
  const audio = extractAudioFromInteraction(json);
  if (!audio) throw new Error("Lyria interactions: no audio in response");
  return { ...audio, model, via: "interactions" };
}

async function viaGenerateContent(apiKey, model, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });
  const raw = await res.text();
  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error(`Lyria generateContent non-JSON (${res.status}): ${raw.slice(0, 200)}`);
  }
  if (!res.ok) {
    const msg = json.error?.message || raw.slice(0, 300);
    const err = new Error(`Lyria generateContent ${res.status}: ${msg}`);
    err.status = res.status;
    throw err;
  }
  const audio = extractAudioFromGenerateContent(json);
  if (!audio) throw new Error("Lyria generateContent: no audio in response");
  return { ...audio, model, via: "generateContent" };
}

/**
 * Try Lyria models until one returns audio bytes.
 * @returns {{ buffer: Buffer, mime: string, text: string, model: string, via: string }}
 */
function isFreeTierBlocked(message) {
  const m = String(message || "");
  return (
    /limit:\s*0/i.test(m) ||
    /free_tier.*limit:\s*0/i.test(m) ||
    /not available.*free tier/i.test(m)
  );
}

export async function generateLyriaMusic(apiKey, prompt, models = LYRIA_MODELS) {
  const errors = [];
  const unique = [...new Set(models)];
  for (const model of unique) {
    for (const fn of [viaInteractions, viaGenerateContent]) {
      try {
        console.log(`Lyria try ${model} via ${fn.name}...`);
        return await fn(apiKey, model, prompt);
      } catch (e) {
        const msg = e.message || String(e);
        console.warn(`  failed: ${msg}`);
        errors.push(`${model}/${fn.name}: ${msg}`);
        // Free tier often has Lyria quota = 0 — stop hammering models.
        if (isFreeTierBlocked(msg)) {
          const err = new Error(
            `Lyria blocked on free tier (quota limit 0). Use paid Gemini billing or FFmpeg fallback.\n${errors.join("\n")}`
          );
          err.lyriaErrors = errors;
          err.freeTierBlocked = true;
          throw err;
        }
      }
    }
  }
  const err = new Error(`All Lyria attempts failed.\n${errors.join("\n")}`);
  err.lyriaErrors = errors;
  throw err;
}

export function writeLyriaAudio(result, outPathNoExt) {
  const isWav = (result.mime || "").includes("wav");
  const outPath = isWav ? `${outPathNoExt}.wav` : `${outPathNoExt}.mp3`;
  fs.writeFileSync(outPath, result.buffer);
  return outPath;
}
