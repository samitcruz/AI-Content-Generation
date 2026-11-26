import fs from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { paths } from "./paths.js";
import { readJson } from "./fsutil.js";

export function loadStoryboard() {
  const schema = readJson(paths.schema);
  const storyboard = readJson(paths.storyboard);
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const ok = validate(storyboard);
  if (!ok) {
    const details = (validate.errors || [])
      .map((e) => `${e.instancePath || "/"} ${e.message}`)
      .join("\n");
    throw new Error(`storyboard.json failed schema validation:\n${details}`);
  }

  const sum = storyboard.shots.reduce((a, s) => a + s.durationSec, 0) + storyboard.endCard.durationSec;
  if (sum < 60 || sum > 95) {
    console.warn(`Warning: total timed length ~${sum}s (target 60–90s + end card).`);
  }

  return storyboard;
}

export function assertStoryboardFile() {
  if (!fs.existsSync(paths.storyboard)) {
    throw new Error(`Missing ${paths.storyboard}`);
  }
  if (!fs.existsSync(paths.schema)) {
    throw new Error(`Missing ${paths.schema}`);
  }
}
