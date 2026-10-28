/**
 * One-off: applies the client's questionnaire answers to an existing database.
 * See prisma/content/client-answers.ts. Usage: `pnpm content:client-answers`
 */
import "dotenv/config";
import { createPrismaClient } from "@/lib/db-client";
import { applyClientAnswers } from "../prisma/content/client-answers";

const db = createPrismaClient();
try {
  const log = await applyClientAnswers(db);
  console.log(log.length ? `Aplicado:\n- ${log.join("\n- ")}` : "Nada para aplicar.");
} finally {
  await db.$disconnect();
}
