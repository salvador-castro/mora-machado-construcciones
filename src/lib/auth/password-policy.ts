/** Shared password policy (login form, create-admin, user admin). Client-safe. */
export const PASSWORD_MIN = 10;
export function passwordProblems(plain: string): string | null {
  if (plain.length < PASSWORD_MIN)
    return `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`;
  if (plain.length > 200) return "La contraseña es demasiado larga.";
  return null;
}
