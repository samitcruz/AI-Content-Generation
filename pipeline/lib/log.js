import fs from "node:fs";
import { paths } from "./paths.js";

/**
 * Append one JSON line per model / stage call.
 * Graders read this file; keep it complete and honest.
 */
export function logRun(entry) {
  const line = {
    ts: new Date().toISOString(),
    ...entry,
  };
  fs.appendFileSync(paths.runsLog, `${JSON.stringify(line)}\n`, "utf8");
  return line;
}

export function stageBanner(name) {
  console.log(`\n=== ${name} ===`);
}
