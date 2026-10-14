/**
 * Creates (or resets) an ADMIN user from the CLI.
 *
 *   pnpm create-admin                          → interactive prompts
 *   pnpm create-admin --email a@b.com --name "Nombre"
 *     (password read from ADMIN_PASSWORD env or prompted, never from argv)
 *
 * If the email exists, it asks before resetting the password and promoting to ADMIN.
 */
import "dotenv/config";
import { parseArgs } from "node:util";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { z } from "zod";
import { createPrismaClient } from "@/lib/db-client";
import { hashPassword, passwordProblems } from "@/lib/auth/password";

const { values } = parseArgs({
  options: { email: { type: "string" }, name: { type: "string" } },
});

const rl = createInterface({ input: stdin, output: stdout });

async function ask(question: string, fallback?: string) {
  if (fallback) return fallback;
  return (await rl.question(question)).trim();
}

/** Prompt without echoing characters. */
async function askHidden(question: string): Promise<string> {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  if (!stdin.isTTY) return (await rl.question(question)).trim();
  stdout.write(question);
  rl.pause();
  stdin.setRawMode(true);
  stdin.resume();
  let value = "";
  return new Promise((resolve) => {
    const onData = (buf: Buffer) => {
      for (const ch of buf.toString("utf8")) {
        if (ch === "\r" || ch === "\n") {
          stdin.setRawMode(false);
          stdin.off("data", onData);
          stdout.write("\n");
          rl.resume();
          return resolve(value);
        }
        if (ch === "\u0003") process.exit(130); // Ctrl+C
        if (ch === "\u007f") value = value.slice(0, -1);
        else value += ch;
      }
    };
    stdin.on("data", onData);
  });
}

async function main() {
  const db = createPrismaClient();
  try {
    const email = z
      .email("Email inválido")
      .parse((await ask("Email: ", values.email)).toLowerCase());
    const existing = await db.user.findUnique({ where: { email } });

    if (existing) {
      const answer = await ask(
        `Ya existe ${email} (${existing.role}). ¿Resetear contraseña y hacerlo ADMIN? [s/N] `,
      );
      if (answer.toLowerCase() !== "s") return console.log("Cancelado.");
    }

    const name =
      existing?.name ??
      z
        .string()
        .min(2)
        .parse(await ask("Nombre: ", values.name));

    let password = "";
    for (;;) {
      password = await askHidden("Contraseña (mín. 10 caracteres): ");
      const problem = passwordProblems(password);
      if (problem) {
        console.log(problem);
        if (process.env.ADMIN_PASSWORD) process.exit(1);
        continue;
      }
      if (process.env.ADMIN_PASSWORD) break;
      if ((await askHidden("Repetir contraseña: ")) === password) break;
      console.log("Las contraseñas no coinciden.");
    }

    const passwordHash = await hashPassword(password);
    const user = existing
      ? await db.user.update({
          where: { id: existing.id },
          data: { passwordHash, role: "ADMIN", active: true },
        })
      : await db.user.create({ data: { email, name, passwordHash, role: "ADMIN" } });

    // Resetting a password revokes existing sessions.
    if (existing) await db.session.deleteMany({ where: { userId: user.id } });
    console.log(`✓ Usuario ADMIN listo: ${user.email}`);
  } finally {
    rl.close();
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err instanceof z.ZodError ? err.issues[0]?.message : err);
  process.exit(1);
});
