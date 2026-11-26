import { stageBanner, logRun } from "./lib/log.js";
import { env, isDryRun } from "./lib/config.js";
import { ensureOutputDirs } from "./lib/fsutil.js";
import { hasFfmpeg } from "./lib/placeholder.js";
import { isMain } from "./lib/main.js";

/**
 * One cheap call per provider (or dry-run skip) to prove accounts work.
 */
async function smokeGemini() {
  const key = env.geminiKey();
  if (!key) return { provider: "gemini", status: "skipped", reason: "no GEMINI_API_KEY" };
  if (isDryRun()) return { provider: "gemini", status: "skipped", reason: "PIPELINE_MODE=dry-run" };
  const t0 = Date.now();
  // Prefer challenge default; fall back when free tier returns 503/404.
  const models = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.1-flash-lite"];
  let last = null;
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Reply with exactly: ok" }] }],
      }),
    });
    const latencyMs = Date.now() - t0;
    const text = await res.text();
    last = {
      provider: "gemini",
      status: res.ok ? "ok" : "error",
      latencyMs,
      detail: text.slice(0, 240),
      model,
    };
    if (res.ok) return last;
  }
  return last;
}

async function smokeCloudflare() {
  const account = env.cfAccount();
  const token = env.cfToken();
  if (!account || !token) {
    return { provider: "cloudflare", status: "skipped", reason: "missing CF credentials" };
  }
  if (isDryRun()) return { provider: "cloudflare", status: "skipped", reason: "PIPELINE_MODE=dry-run" };
  const t0 = Date.now();
  const model = env.imageModel();
  const url = `https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${model}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: "a warm desk lamp glowing in a quiet dark room, soft grain, cinematic still",
    }),
  });
  const latencyMs = Date.now() - t0;
  const body = await res.text();
  let ok = res.ok;
  if (ok) {
    try {
      const json = JSON.parse(body);
      ok = Boolean(json?.result?.image || json?.result?.images?.[0] || json?.success);
    } catch {
      ok = body.length > 100;
    }
  }
  return {
    provider: "cloudflare",
    status: ok ? "ok" : "error",
    latencyMs,
    detail: ok ? `HTTP ${res.status}` : `HTTP ${res.status}: ${body.slice(0, 200)}`,
    model,
  };
}

async function main() {
  stageBanner("smoke");
  ensureOutputDirs();
  const results = [];
  results.push({ provider: "ffmpeg", status: hasFfmpeg() ? "ok" : "missing" });
  results.push(await smokeGemini());
  results.push(await smokeCloudflare());
  for (const r of results) {
    logRun({
      stage: "smoke",
      model: r.provider,
      parameters: r,
      seed: null,
      latencyMs: r.latencyMs || 0,
      costUsd: 0,
      status: r.status,
    });
    console.log(`${r.provider}: ${r.status}${r.reason ? ` (${r.reason})` : ""}${r.latencyMs ? ` ${r.latencyMs}ms` : ""}`);
  }
}

if (isMain(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
