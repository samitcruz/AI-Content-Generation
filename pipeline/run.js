import { stageBanner, logRun } from "./lib/log.js";
import { isMain } from "./lib/main.js";
import { getMode, filmLanguages } from "./lib/config.js";
import { runNarration } from "./narration.js";
import { runKeyframes } from "./keyframes.js";
import { runShots } from "./shots.js";
import { runMusic } from "./music.js";
import { runAssemble } from "./assemble.js";
import { assertStoryboardFile, loadStoryboard } from "./lib/validate.js";
import { ensureOutputDirs } from "./lib/fsutil.js";

async function runValidate() {
  stageBanner("validate");
  const t0 = Date.now();
  assertStoryboardFile();
  ensureOutputDirs();
  const sb = loadStoryboard();
  logRun({
    stage: "validate",
    model: "ajv+json-schema",
    parameters: { shots: sb.shots.length, title: sb.title },
    seed: null,
    latencyMs: Date.now() - t0,
    costUsd: 0,
    status: "ok",
  });
  console.log(`OK — "${sb.title}" · ${sb.shots.length} shots`);
  return sb;
}

async function main() {
  const t0 = Date.now();
  console.log(`Heritage Short pipeline · mode=${getMode()} · languages=${filmLanguages().join(",")}`);
  await runValidate();
  await runNarration();
  await runKeyframes();
  await runShots();
  await runMusic();
  await runAssemble();
  logRun({
    stage: "pipeline",
    model: "orchestrator",
    parameters: { mode: getMode(), languages: filmLanguages() },
    seed: null,
    latencyMs: Date.now() - t0,
    costUsd: 0,
    status: "ok",
  });
  console.log(`\nDone in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  console.log("Films → outputs/films/");
}

if (isMain(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
