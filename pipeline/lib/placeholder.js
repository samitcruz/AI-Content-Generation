import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/**
 * Create a simple PNG without external deps (minimal valid 1x1 expanded via ffmpeg if available).
 * Falls back to a tiny handwritten PNG buffer.
 */
export function writePlaceholderPng(filePath, label = "placeholder") {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  try {
    execFileSync(
      "ffmpeg",
      [
        "-y",
        "-f",
        "lavfi",
        "-i",
        `color=c=0x1a0a0a:s=768x1280:d=1`,
        "-frames:v",
        "1",
        "-vf",
        `drawtext=text='${label.replace(/'/g, "\\'")}':fontcolor=0xcc4444:fontsize=36:x=(w-text_w)/2:y=(h-text_h)/2`,
        filePath,
      ],
      { stdio: "ignore" }
    );
    return "ffmpeg";
  } catch {
    // Minimal solid dark-red-ish PNG (768x1280 is large as raw; use tiny 2x2 and let assemble scale)
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR4nGP8z8DAwMDAwAjEDAwACekB/V0mZ+AAAAABJRU5ErkJggg==",
      "base64"
    );
    fs.writeFileSync(filePath, png);
    return "tiny-png";
  }
}

export function writeSilentWav(filePath, durationSec = 2) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  try {
    execFileSync(
      "ffmpeg",
      ["-y", "-f", "lavfi", "-i", `anullsrc=r=24000:cl=mono`, "-t", String(durationSec), filePath],
      { stdio: "ignore" }
    );
    return "ffmpeg";
  } catch {
    // Minimal WAV header + silence (0.1s) so path exists for dry-run without ffmpeg
    const samples = 2400;
    const dataSize = samples * 2;
    const buffer = Buffer.alloc(44 + dataSize);
    buffer.write("RIFF", 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write("WAVE", 8);
    buffer.write("fmt ", 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(1, 22);
    buffer.writeUInt32LE(24000, 24);
    buffer.writeUInt32LE(48000, 28);
    buffer.writeUInt16LE(2, 32);
    buffer.writeUInt16LE(16, 34);
    buffer.write("data", 36);
    buffer.writeUInt32LE(dataSize, 40);
    fs.writeFileSync(filePath, buffer);
    return "tiny-wav";
  }
}

export function writePlaceholderMp4(filePath, durationSec, fromImage) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  try {
    const args = fromImage
      ? [
          "-y",
          "-loop",
          "1",
          "-i",
          fromImage,
          "-t",
          String(durationSec),
          "-vf",
          "scale=768:1280:force_original_aspect_ratio=decrease,pad=768:1280:(ow-iw)/2:(oh-ih)/2",
          "-pix_fmt",
          "yuv420p",
          "-r",
          "24",
          filePath,
        ]
      : [
          "-y",
          "-f",
          "lavfi",
          "-i",
          `color=c=0x1a0a0a:s=768x1280:d=${durationSec}`,
          "-pix_fmt",
          "yuv420p",
          "-r",
          "24",
          filePath,
        ];
    execFileSync("ffmpeg", args, { stdio: "ignore" });
    return "ffmpeg";
  } catch {
    fs.writeFileSync(filePath, Buffer.from("placeholder-mp4"));
    return "stub-file";
  }
}

export function hasFfmpeg() {
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
