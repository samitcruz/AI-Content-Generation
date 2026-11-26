import fs from "node:fs";
import path from "node:path";
import { stageBanner, logRun } from "./lib/log.js";
import { loadStoryboard } from "./lib/validate.js";
import { ensureOutputDirs } from "./lib/fsutil.js";
import { paths, shotKeyframePath } from "./lib/paths.js";
import { shouldSkip, writeCacheMeta } from "./lib/cache.js";
import { env, isDryRun, requireEnv } from "./lib/config.js";
import { writePlaceholderPng } from "./lib/placeholder.js";
import { isMain } from "./lib/main.js";

async function generateFlux(prompt, seed, outPath) {
  requireEnv(["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_TOKEN"]);
  const model = env.imageModel();
  const url = `https://api.cloudflare.com/client/v4/accounts/${env.cfAccount()}/ai/run/${model}`;
  const t0 = Date.now();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.cfToken()}`,
      "Content-Type": "application/json",
    },
    // FLUX.1 schnell on Workers AI rejects unknown fields like `seed`.
    body: JSON.stringify({ prompt }),
  });
  const latencyMs = Date.now() - t0;
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Cloudflare Workers AI ${res.status}: ${errText.slice(0, 400)}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("image/")) {
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(outPath, buf);
    // Also write .jpg sibling when payload is JPEG (common for FLUX).
    maybeWriteJpegSibling(outPath, buf);
    return { latencyMs, model, bytes: buf.length, seed };
  }

  const json = await res.json();
  const b64 = json?.result?.image || json?.result?.images?.[0];
  if (!b64) throw new Error("Workers AI returned no image payload");
  const buf = Buffer.from(b64, "base64");
  fs.writeFileSync(outPath, buf);
  maybeWriteJpegSibling(outPath, buf);
  return { latencyMs, model, bytes: buf.length, seed };
}

function maybeWriteJpegSibling(outPath, buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    const jpg = outPath.replace(/\.png$/i, ".jpg");
    fs.writeFileSync(jpg, buf);
  }
}

function fullPrompt(sb, shotPrompt) {
  return `${shotPrompt}. Character: ${sb.character.description}. Style: ${sb.style.block}. Avoid: ${sb.style.negative}`;
}

export async function runKeyframes() {
  stageBanner("keyframes");
  ensureOutputDirs();
  const sb = loadStoryboard();

  // Character reference sheet first
  const refPath = path.join(paths.references, "character_sheet.png");
  const refInputs = {
    stage: "reference",
    prompt: sb.character.referencePrompt,
    style: sb.style.block,
  };
  const refCache = shouldSkip("reference", refInputs, refPath);
  if (refCache.skip) {
    console.log("skip character reference (cache)");
  } else if (isDryRun()) {
    writePlaceholderPng(refPath, "character_ref");
    writeCacheMeta("reference", refCache.key, refPath, { dryRun: true });
    logRun({
      stage: "keyframes",
      model: "dry-run",
      parameters: { kind: "reference" },
      seed: null,
      latencyMs: 0,
      costUsd: 0,
      status: "dry-run",
    });
  } else {
    try {
      const result = await generateFlux(
        `${sb.character.referencePrompt}. Style: ${sb.style.block}. Avoid: ${sb.style.negative}`,
        42,
        refPath
      );
      writeCacheMeta("reference", refCache.key, refPath);
      logRun({
        stage: "keyframes",
        model: result.model,
        parameters: { kind: "reference", seed: 42 },
        seed: 42,
        latencyMs: result.latencyMs,
        costUsd: 0,
        status: "ok",
      });
      console.log(`ok character reference (${result.latencyMs}ms)`);
    } catch (err) {
      writePlaceholderPng(refPath, "character_ref");
      logRun({
        stage: "keyframes",
        model: env.imageModel(),
        parameters: { kind: "reference" },
        seed: 42,
        latencyMs: 0,
        costUsd: 0,
        status: "error",
        error: String(err.message || err),
      });
      console.warn(`reference FAILED: ${err.message}`);
    }
  }

  for (const shot of sb.shots) {
    const out = shotKeyframePath(shot.id);
    const prompt = fullPrompt(sb, shot.imagePrompt);
    const inputs = { stage: "keyframe", shot: shot.id, prompt, seed: shot.seed };
    const { skip, key } = shouldSkip("keyframe", inputs, out);
    const usable = fs.existsSync(out) && fs.statSync(out).size >= 10000;
    if (skip && usable) {
      console.log(`skip ${shot.id} (cache)`);
      logRun({
        stage: "keyframes",
        model: env.imageModel(),
        parameters: { shot: shot.id, cached: true },
        seed: shot.seed,
        latencyMs: 0,
        costUsd: 0,
        status: "cache-hit",
      });
      continue;
    }

    if (isDryRun()) {
      writePlaceholderPng(out, shot.id);
      writeCacheMeta("keyframe", key, out, { dryRun: true });
      logRun({
        stage: "keyframes",
        model: "dry-run",
        parameters: { shot: shot.id, seed: shot.seed },
        seed: shot.seed,
        latencyMs: 0,
        costUsd: 0,
        status: "dry-run",
      });
      console.log(`dry-run ${shot.id}`);
      continue;
    }

    try {
      const result = await generateFlux(prompt, shot.seed, out);
      writeCacheMeta("keyframe", key, out);
      logRun({
        stage: "keyframes",
        model: result.model,
        parameters: { shot: shot.id, seed: shot.seed, bytes: result.bytes },
        seed: shot.seed,
        latencyMs: result.latencyMs,
        costUsd: 0,
        status: "ok",
      });
      console.log(`ok ${shot.id} (${result.latencyMs}ms)`);
    } catch (err) {
      writePlaceholderPng(out, shot.id);
      logRun({
        stage: "keyframes",
        model: env.imageModel(),
        parameters: { shot: shot.id },
        seed: shot.seed,
        latencyMs: 0,
        costUsd: 0,
        status: "error",
        error: String(err.message || err),
      });
      console.warn(`FAILED ${shot.id}: ${err.message} — placeholder written`);
    }
  }
}

if (isMain(import.meta.url)) {
  runKeyframes().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
