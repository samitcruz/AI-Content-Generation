import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, "..", "..");

export const paths = {
  root: ROOT,
  storyboard: path.join(ROOT, "storyboard.json"),
  schema: path.join(ROOT, "schema", "storyboard.schema.json"),
  runsLog: path.join(ROOT, "runs.jsonl"),
  cache: path.join(ROOT, ".cache"),
  outputs: path.join(ROOT, "outputs"),
  keyframes: path.join(ROOT, "outputs", "keyframes"),
  references: path.join(ROOT, "outputs", "references"),
  shots: path.join(ROOT, "outputs", "shots"),
  narration: path.join(ROOT, "outputs", "narration"),
  music: path.join(ROOT, "outputs", "music"),
  assembly: path.join(ROOT, "outputs", "assembly"),
  subtitles: path.join(ROOT, "outputs", "subtitles"),
  films: path.join(ROOT, "outputs", "films"),
};

export function shotKeyframePath(shotId) {
  return path.join(paths.keyframes, `${shotId}.png`);
}

export function shotVideoPath(shotId) {
  return path.join(paths.shots, `${shotId}.mp4`);
}

export function narrationPath(shotId, lang) {
  return path.join(paths.narration, lang, `${shotId}.wav`);
}

export function subtitlePath(lang) {
  return path.join(paths.subtitles, `${lang}.srt`);
}

export function filmPath(lang, aspect) {
  const safe = aspect.replace(":", "x");
  return path.join(paths.films, `red-after-midnight_${lang}_${safe}.mp4`);
}
