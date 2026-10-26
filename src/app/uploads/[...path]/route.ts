import { open, stat } from "node:fs/promises";
import path from "node:path";
import { uploadDir } from "@/lib/media/process";

const TYPES: Record<string, string> = { ".webp": "image/webp", ".mp4": "video/mp4" };

/**
 * Serves uploaded media. In production Nginx serves /uploads/ directly from
 * UPLOAD_DIR and this handler is never reached; it exists for local dev and
 * as a fallback. Only .webp variants and .mp4 videos are served, with traversal
 * protection. Byte ranges are supported: Safari won't play a video without them.
 */
export async function GET(req: Request, ctx: RouteContext<"/uploads/[...path]">) {
  const { path: segments } = await ctx.params;
  const root = uploadDir();
  const abs = path.resolve(root, ...segments);
  const type = TYPES[path.extname(abs)];

  if (!abs.startsWith(root + path.sep) || !type) {
    return new Response("Not found", { status: 404 });
  }

  let size: number;
  try {
    size = (await stat(abs)).size;
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const headers: Record<string, string> = {
    "Content-Type": type,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  };

  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") ?? "");
  let start = 0;
  let end = size - 1;
  if (range) {
    start = range[1] ? Number(range[1]) : size - Number(range[2]);
    end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (!(start >= 0 && start <= end)) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
  }

  const file = await open(abs);
  try {
    const buf = Buffer.alloc(end - start + 1);
    await file.read(buf, 0, buf.length, start);
    return new Response(new Uint8Array(buf), {
      status: range ? 206 : 200,
      headers: {
        ...headers,
        "Content-Length": String(buf.length),
        ...(range ? { "Content-Range": `bytes ${start}-${end}/${size}` } : {}),
      },
    });
  } finally {
    await file.close();
  }
}
