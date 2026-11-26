import storyboard from "../../../storyboard.json";

export { storyboard };

export const links = {
  drive: "https://drive.google.com/drive/folders/1Xatyvm5bmQ2fJDovh3T2HrSjtuFrVHNh",
  repo: "https://github.com/samitcruz/AI-Content-Generation",
};

export const media = {
  film: "/media/film_en_16x9.mp4",
  poster: "/media/keyframes/shot_01.jpg",
  keyframe: (shotId) => `/media/keyframes/${shotId}.jpg`,
};

/** Emotional arc from DESIGN.md: ritual → discovery → peak → loyalty. */
export const arc = [
  {
    id: "ritual",
    label: "Ritual",
    time: "5–6pm, dusk",
    summary: "Home was the whole world. An old TV glowing as the daylight went.",
    shots: ["shot_01", "shot_02", "shot_03"],
  },
  {
    id: "discovery",
    label: "Discovery",
    time: "The counter-attack",
    summary: "Many clubs passed through that screen. One played fast and ruthless, and it stuck.",
    shots: ["shot_04", "shot_05", "shot_06"],
  },
  {
    id: "peak",
    label: "Peak",
    time: "8–2, the overhead kick",
    summary: "The happiest matches, kept as memory rather than branding.",
    shots: ["shot_07", "shot_08"],
  },
  {
    id: "loyalty",
    label: "Loyalty",
    time: "After the glory",
    summary: "The form faded. The love didn't. Support became identity.",
    shots: ["shot_09", "shot_10"],
  },
];

export const pipeline = [
  { stage: "Validate", tool: "JSON Schema (Ajv)", detail: "storyboard.json is the single contract" },
  { stage: "Narration", tool: "Addis Voices 2 · Gemini TTS", detail: "Amharic (Yohanes Calm) and English" },
  { stage: "Keyframes", tool: "FLUX.1 schnell", detail: "Cloudflare Workers AI, locked style block" },
  { stage: "Shots", tool: "Ken Burns v2", detail: "FFmpeg pan and zoom per shot camera note" },
  { stage: "Music", tool: "Lyria → FFmpeg pad", detail: "Instrumental dusk underscore under the voice" },
  { stage: "Assemble", tool: "FFmpeg", detail: "Mix, burned-in subtitles, 9:16 and 16:9" },
];

export function shotById(id) {
  return storyboard.shots.find((s) => s.id === id);
}
