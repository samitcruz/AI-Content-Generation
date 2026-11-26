import fs from "node:fs";
import path from "node:path";
import { paths } from "./paths.js";

export function ensureOutputDirs() {
  const dirs = [
    paths.outputs,
    paths.keyframes,
    paths.references,
    paths.shots,
    paths.narration,
    path.join(paths.narration, "am"),
    path.join(paths.narration, "en"),
    paths.music,
    paths.assembly,
    paths.subtitles,
    paths.films,
    paths.cache,
  ];
  for (const d of dirs) {
    fs.mkdirSync(d, { recursive: true });
    if (d !== paths.cache) {
      const keep = path.join(d, ".gitkeep");
      if (!fs.existsSync(keep)) fs.writeFileSync(keep, "", "utf8");
    }
  }
}

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export function fileExists(p) {
  return fs.existsSync(p);
}
