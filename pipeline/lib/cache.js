import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { paths } from "./paths.js";

function ensureCacheDir() {
  fs.mkdirSync(paths.cache, { recursive: true });
}

export function hashInputs(obj) {
  return crypto.createHash("sha256").update(JSON.stringify(obj)).digest("hex").slice(0, 16);
}

export function cacheMetaPath(stage, key) {
  ensureCacheDir();
  return path.join(paths.cache, `${stage}_${key}.json`);
}

/**
 * Skip regeneration when inputs hash matches and output file exists.
 */
export function shouldSkip(stage, inputs, outputPath) {
  const key = hashInputs(inputs);
  const metaPath = cacheMetaPath(stage, key);
  if (!fs.existsSync(outputPath)) return { skip: false, key };
  if (!fs.existsSync(metaPath)) return { skip: false, key };
  try {
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    if (meta.key === key && meta.outputPath === outputPath) {
      return { skip: true, key };
    }
  } catch {
    return { skip: false, key };
  }
  return { skip: false, key };
}

export function writeCacheMeta(stage, key, outputPath, extra = {}) {
  const metaPath = cacheMetaPath(stage, key);
  fs.writeFileSync(
    metaPath,
    JSON.stringify({ key, stage, outputPath, savedAt: new Date().toISOString(), ...extra }, null, 2),
    "utf8"
  );
}
