import "server-only";
import { updateTag } from "next/cache";
import { z } from "zod";

/** Uniform return shape for admin server actions (serializable, UI-oriented). */
export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function ok<T>(data?: T, message?: string): ActionResult<T> {
  return { ok: true, data, message };
}

export function fail(error: string, fieldErrors?: Record<string, string>): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

/** Flattens zod issues into { "a.b.0": "message" } for react-hook-form setError. */
export function fromZodError(err: z.ZodError): ActionResult<never> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".");
    fieldErrors[key] ??= issue.message;
  }
  return fail("Revisá los campos marcados.", fieldErrors);
}

/** Invalidates public cache tags right away (read-your-writes in the admin). */
export function invalidate(...tags: string[]) {
  for (const tag of new Set(tags)) updateTag(tag);
}

/** Prisma unique-constraint violation (e.g. duplicated slug). */
export function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && err.code === "P2002";
}
