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

export { PASSWORD_MIN, passwordProblems } from "./password-policy";
