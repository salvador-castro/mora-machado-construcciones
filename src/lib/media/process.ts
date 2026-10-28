import { execFile, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { chmod, copyFile, mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import sharp, { type Metadata } from "sharp";

/** Target widths for responsive variants. Never upscaled. */
export const VARIANT_WIDTHS = [480, 960, 1600, 2400] as const;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp", "avif"]);
const MIME_BY_FORMAT: Record<string, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

export type MediaVariant = { width: number; height: number; path: string; size: number };

export type ProcessedMedia = {
  path: string;
  originalName: string;
  mime: string;
  size: number;
  width: number;
  height: number;
  variants: MediaVariant[];
  blurDataUrl: string;
  /** Videos only (see processVideo). */
  videoPath?: string;
  duration?: number;
};

export class MediaError extends Error {}

export function uploadDir() {
  const dir = process.env.UPLOAD_DIR;
  if (!dir) throw new Error("UPLOAD_DIR is not set");
  return path.resolve(dir);
}

/**
 * Validates the real image format (not the client-provided mime), auto-rotates,
 * strips metadata and writes WebP variants to UPLOAD_DIR/<yyyy>/<mm>/<uuid>-<w>.webp.
 * Returned paths are relative to UPLOAD_DIR and served at /uploads/<path>.
 */
export async function processImage(input: Buffer, originalName: string): Promise<ProcessedMedia> {
  if (input.byteLength > MAX_UPLOAD_BYTES) {
    throw new MediaError("La imagen supera los 10 MB.");
  }

  let meta: Metadata;
  try {
    meta = await sharp(input).metadata();
  } catch {
    throw new MediaError("El archivo no es una imagen válida.");
  }
  if (!meta.format || !ALLOWED_FORMATS.has(meta.format)) {
    throw new MediaError("Formato no permitido. Usá JPG, PNG, WebP o AVIF.");
  }

  // Normalize orientation once; all variants derive from this buffer.
  const base = sharp(input, { failOn: "error" }).rotate();
  const { data: oriented, info } = await base.toBuffer({ resolveWithObject: true });
  const width = info.width;
  const height = info.height;

  const now = new Date();
  const relDir = path.posix.join(
    String(now.getFullYear()),
    String(now.getMonth() + 1).padStart(2, "0"),
  );
  const absDir = path.join(uploadDir(), relDir);
  await mkdir(absDir, { recursive: true });

  const id = randomUUID();
  const widths = [...new Set([...VARIANT_WIDTHS.filter((w) => w < width), width])].sort(
    (a, b) => a - b,
  );

  const variants: MediaVariant[] = [];
  try {
    for (const w of widths) {
      const { data, info: out } = await sharp(oriented)
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 80, effort: 5 })
        .toBuffer({ resolveWithObject: true });
      const rel = path.posix.join(relDir, `${id}-${w}.webp`);
      await writeFile(path.join(uploadDir(), rel), data, { mode: 0o644 });
      variants.push({ width: out.width, height: out.height, path: rel, size: out.size });
    }
  } catch (err) {
    await removeMediaFiles(variants.map((v) => v.path));
    throw err;
  }

  const blur = await sharp(oriented).resize(16).webp({ quality: 40 }).toBuffer();
  const largest = variants[variants.length - 1];

  return {
    path: largest.path,
    originalName: originalName.slice(0, 255),
    mime: MIME_BY_FORMAT[meta.format],
    size: input.byteLength,
    width,
    height,
    variants,
    blurDataUrl: `data:image/webp;base64,${blur.toString("base64")}`,
  };
}

/** Deletes variant files; ignores missing ones. Paths are relative to UPLOAD_DIR. */
export async function removeMediaFiles(relPaths: string[]) {
  const root = uploadDir();
  await Promise.all(
    relPaths.map(async (rel) => {
      const abs = path.resolve(root, rel);
      if (!abs.startsWith(root + path.sep)) return; // path traversal guard
      await rm(abs, { force: true });
    }),
  );
}

// ─── Video ─────────────────────────────────────────────────────

export const MAX_VIDEO_BYTES = 30 * 1024 * 1024;
export const MAX_VIDEO_SECONDS = 180;
/** Longest side of the web version (720p for landscape and portrait). */
const VIDEO_MAX_SIDE = 1280;
const run = promisify(execFile);

/** Uploads treated as video: by mime or extension; ffprobe checks the real content. */
export function isVideoUpload(file: { type: string; name: string }) {
  return file.type.startsWith("video/") || /\.(mp4|mov|m4v|webm|3gp)$/i.test(file.name);
}

async function ffmpeg(bin: "ffmpeg" | "ffprobe", args: string[]) {
  const cmd = (bin === "ffmpeg" ? process.env.FFMPEG_PATH : process.env.FFPROBE_PATH) || bin;
  try {
    return await run(cmd, args, { timeout: 180_000, maxBuffer: 10 * 1024 * 1024 });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      throw new MediaError("El servidor no puede procesar videos: falta instalar ffmpeg.");
    }
    throw err;
  }
}

/**
 * Runs ffmpeg with `-progress pipe:1` and reports how much of `duration` it has
 * encoded (0–100). Same error handling as ffmpeg() above.
 */
function ffmpegWithProgress(args: string[], duration: number, onPercent: (p: number) => void) {
  const cmd = process.env.FFMPEG_PATH || "ffmpeg";
  return new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, ["-progress", "pipe:1", "-nostats", ...args]);
    const timer = setTimeout(() => child.kill("SIGKILL"), 180_000);
    let stderr = "";
    let buffered = "";
    child.stdout.on("data", (chunk: Buffer) => {
      buffered += chunk.toString();
      const lines = buffered.split("\n");
      buffered = lines.pop() ?? "";
      for (const line of lines) {
        // out_time_us is in microseconds (out_time_ms too, despite its name).
        const m = /^out_time_us=(\d+)$/.exec(line.trim());
        if (m) onPercent(Math.min(99, Math.round((Number(m[1]) / 1e6 / duration) * 100)));
      }
    });
    child.stderr.on("data", (chunk: Buffer) => (stderr = (stderr + chunk.toString()).slice(-2000)));
    child.on("error", (err: NodeJS.ErrnoException) => {
      clearTimeout(timer);
      reject(
        err.code === "ENOENT"
          ? new MediaError("El servidor no puede procesar videos: falta instalar ffmpeg.")
          : err,
      );
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with ${signal ?? code}: ${stderr}`));
    });
  });
}

/**
 * Validates a video with ffprobe, converts it to an H.264/AAC MP4 that every
 * browser plays (phones record HEVC, which Chrome/Firefox often can't), at most
 * 1280 px on the long side, with the moov atom first so it starts streaming
 * right away. A frame becomes the poster through processImage, so the media
 * keeps image variants (thumbnails, srcset) and gains `videoPath`.
 */
export async function processVideo(
  input: Buffer,
  originalName: string,
  /** Conversion progress, 0–100 (the slow part: seconds to a couple of minutes). */
  onProgress?: (percent: number) => void,
): Promise<ProcessedMedia> {
  if (input.byteLength > MAX_VIDEO_BYTES) {
    throw new MediaError(`El video supera los ${MAX_VIDEO_BYTES / 1024 / 1024} MB.`);
  }
  const work = await mkdtemp(path.join(tmpdir(), "mm-video-"));
  const src = path.join(work, "in");
  const out = path.join(work, "out.mp4");
  const posterFile = path.join(work, "poster.jpg");
  let poster: ProcessedMedia | undefined;
  let videoPath: string | undefined;
  try {
    await writeFile(src, input);

    let duration: number;
    try {
      const { stdout } = await ffmpeg("ffprobe", [
        ...["-v", "error", "-print_format", "json", "-show_streams", "-show_format", src],
      ]);
      const info = JSON.parse(stdout) as {
        streams?: { codec_type?: string }[];
        format?: { duration?: string };
      };
      if (!info.streams?.some((st) => st.codec_type === "video")) throw new Error("no video");
      duration = Number(info.format?.duration);
      if (!Number.isFinite(duration) || duration <= 0) throw new Error("no duration");
    } catch (err) {
      if (err instanceof MediaError) throw err;
      throw new MediaError("El archivo no es un video válido.");
    }
    if (duration > MAX_VIDEO_SECONDS) {
      throw new MediaError(`El video dura más de ${MAX_VIDEO_SECONDS / 60} minutos.`);
    }

    const side = VIDEO_MAX_SIDE;
    await ffmpegWithProgress(
      [
        ...["-v", "error", "-y", "-i", src, "-map", "0:v:0", "-map", "0:a:0?"],
        ...[
          "-vf",
          `scale=${side}:${side}:force_original_aspect_ratio=decrease:force_divisible_by=2`,
        ],
        ...["-c:v", "libx264", "-preset", "medium", "-crf", "26", "-pix_fmt", "yuv420p"],
        ...["-c:a", "aac", "-b:a", "96k", "-ac", "2", "-movflags", "+faststart", out],
      ],
      duration,
      (p) => onProgress?.(p),
    );
    await ffmpeg("ffmpeg", [
      ...["-v", "error", "-y", "-ss", String(Math.min(1, duration / 3)), "-i", out],
      ...["-frames:v", "1", "-q:v", "2", posterFile],
    ]);

    poster = await processImage(await readFile(posterFile), originalName);
    // Same folder and id as the poster variants: <uuid>-<w>.webp → <uuid>.mp4
    videoPath = poster.path.replace(/-\d+\.webp$/, ".mp4");
    const dest = path.join(uploadDir(), videoPath);
    await copyFile(out, dest);
    await chmod(dest, 0o644); // same as the image variants: Nginx reads them
    return {
      ...poster,
      mime: "video/mp4",
      size: (await stat(out)).size,
      videoPath,
      duration: Math.round(duration * 10) / 10,
    };
  } catch (err) {
    if (poster) {
      await removeMediaFiles([
        ...poster.variants.map((v) => v.path),
        ...(videoPath ? [videoPath] : []),
      ]);
    }
    if (err instanceof MediaError) throw err;
    console.error("[media] video processing failed", err);
    throw new MediaError("No se pudo procesar el video.");
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}
