import argon2 from "argon2";

// argon2id with library defaults (m=64MiB, t=3, p=4) — OWASP-compliant.
export function hashPassword(plain: string) {
  return argon2.hash(plain, { type: argon2.argon2id });
}

export async function verifyPassword(hash: string, plain: string) {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

/** Shared password policy (login form, create-admin, user admin). */
export const PASSWORD_MIN = 10;
export function passwordProblems(plain: string): string | null {
  if (plain.length < PASSWORD_MIN)
    return `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`;
  if (plain.length > 200) return "La contraseña es demasiado larga.";
  return null;
}
