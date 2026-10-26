import { getCurrentUser } from "@/lib/auth/session";
import { storeUpload } from "@/lib/media/upload";

/**
 * Uploads one image or video from the admin (multipart: `file`, `alt`).
 *
 * A route instead of a server action so the browser can show progress: the
 * upload itself through XHR, then the server's work streamed back as NDJSON,
 * one event per line:
 *   {"stage":"processing"}                 file received, processing started
 *   {"stage":"converting","percent":42}    video conversion (ffmpeg)
 *   {"ok":true,"item":{…},"message":"…"}   done (last line)
 *   {"ok":false,"error":"…"}               failed (last line)
 */
export async function POST(request: Request) {
  // Server actions check the origin themselves; a cookie-authenticated route must too (CSRF).
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) {
    return Response.json({ ok: false, error: "Origen no permitido." }, { status: 403 });
  }
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "No autorizado." }, { status: 401 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ ok: false, error: "No se recibió el archivo." }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: object) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      send({ stage: "processing" });
      let last = -1;
      const result = await storeUpload(form.get("file"), form.get("alt"), user.id, (percent) => {
        if (percent === last) return;
        last = percent;
        send({ stage: "converting", percent });
      });
      send(result);
      controller.close();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      // Nginx would otherwise hold the events until the end.
      "X-Accel-Buffering": "no",
    },
  });
}
