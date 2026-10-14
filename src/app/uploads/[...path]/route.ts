import { readFile } from "node:fs/promises";
import path from "node:path";
import { uploadDir } from "@/lib/media/process";

/**
 * Serves uploaded media. In production Nginx serves /uploads/ directly from
 * UPLOAD_DIR and this handler is never reached; it exists for local dev and
 * as a fallback. Only .webp variants are served, with traversal protection.
 */
export async function GET(_req: Request, ctx: RouteContext<"/uploads/[...path]">) {
  const { path: segments } = await ctx.params;
  const root = uploadDir();
  const abs = path.resolve(root, ...segments);

  if (!abs.startsWith(root + path.sep) || path.extname(abs) !== ".webp") {
    return new Response("Not found", { status: 404 });
  }

  try {
    const file = await readFile(abs);
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
