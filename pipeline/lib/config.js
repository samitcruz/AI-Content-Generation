import dotenv from "dotenv";
import path from "node:path";
import { ROOT } from "./paths.js";

dotenv.config({ path: path.join(ROOT, ".env") });

export function getMode() {
  return (process.env.PIPELINE_MODE || "dry-run").toLowerCase();
}

export function isDryRun() {
  return getMode() === "dry-run";
}

export function filmLanguages() {
  const v = (process.env.FILM_LANGUAGE || "both").toLowerCase();
  if (v === "am") return ["am"];
  if (v === "en") return ["en"];
  return ["am", "en"];
}

export function requireEnv(keys) {
  const missing = keys.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing env vars: ${missing.join(", ")}. Copy .env.example → .env`);
  }
}

export const env = {
  geminiKey: () => process.env.GEMINI_API_KEY,
  /** Accept project name ADDIS_AI_API_KEY or SDK default ADDIS_API_KEY */
  addisKey: () => process.env.ADDIS_AI_API_KEY || process.env.ADDIS_API_KEY,
  addisVoiceAm: () => process.env.ADDIS_VOICE_AM || "am-yohanes-calm",
  cfAccount: () => process.env.CLOUDFLARE_ACCOUNT_ID,
  cfToken: () => process.env.CLOUDFLARE_API_TOKEN,
  imageModel: () =>
    process.env.CLOUDFLARE_IMAGE_MODEL || "@cf/black-forest-labs/flux-1-schnell",
};
