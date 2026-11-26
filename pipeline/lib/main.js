import path from "node:path";
import { fileURLToPath } from "node:url";

/** True when this module was executed directly with `node file.js`. */
export function isMain(metaUrl) {
  const thisFile = fileURLToPath(metaUrl);
  const invoked = process.argv[1] ? path.resolve(process.argv[1]) : "";
  return path.resolve(thisFile) === invoked;
}
