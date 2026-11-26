import { stageBanner, logRun } from "./lib/log.js";
import { assertStoryboardFile, loadStoryboard } from "./lib/validate.js";
import { ensureOutputDirs } from "./lib/fsutil.js";

stageBanner("validate");
const t0 = Date.now();
assertStoryboardFile();
ensureOutputDirs();
const sb = loadStoryboard();
const latencyMs = Date.now() - t0;

logRun({
  stage: "validate",
  model: "ajv+json-schema",
  parameters: { shots: sb.shots.length, title: sb.title },
  seed: null,
  latencyMs,
  costUsd: 0,
  status: "ok",
});

console.log(`OK — "${sb.title}" · ${sb.shots.length} shots · target ${sb.durationTargetSec}s`);
