// Verifies the DATABASE_URL connection: `pnpm db:check`
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const [row] = await db.$queryRaw<{ version: string }[]>`select version()`;
console.log("OK:", row.version);
await db.$disconnect();
