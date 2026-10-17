/**
 * Rebuilds docs/Donweb-VPS-rodo.md: keeps the hand-written context (everything
 * before "# PARTE 2") and regenerates the guide copy and the deploy/ file copies.
 * Run by `pnpm docs:pdf` before rendering the PDFs.
 */
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";

const OUT = "docs/Donweb-VPS-rodo.md";
const MARK = "# PARTE 2";

const current = await readFile(OUT, "utf8");
const cut = current.indexOf(MARK);
if (cut < 0) throw new Error(`${OUT}: missing "${MARK}" marker`);
const commit = execFileSync("git", ["log", "-1", "--format=%h %s"], { encoding: "utf8" }).trim();
const header = current
  .slice(0, cut)
  .replace(/último commit en `develop`: `[^`]*`/, `último commit en \`develop\`: \`${commit}\``);

const readme = (await readFile("deploy/README.md", "utf8")).split("\n").slice(1).join("\n");

const FILES: [string, string][] = [
  ["deploy/deploy.sh", "bash"],
  ["deploy/ecosystem.config.cjs", "js"],
  ["deploy/nginx/mora-http.conf", "nginx"],
  ["deploy/nginx/mora.conf", "nginx"],
  ["deploy/backup.sh", "bash"],
  ["deploy/crontab", "bash"],
  [".env.example", "bash"],
  ["src/proxy.ts", "ts"],
  ["src/app/healthz/route.ts", "ts"],
];
const blocks = await Promise.all(
  FILES.map(async ([path, lang]) => {
    const body = (await readFile(path, "utf8")).trimEnd();
    return `\n### \`${path}\`\n\n\`\`\`${lang}\n${body}\n\`\`\`\n`;
  }),
);

await writeFile(
  OUT,
  `${header}${MARK} — Guía de despliegue paso a paso (copia de \`deploy/README.md\`)\n\n## Guía de despliegue en el VPS\n${readme}\n---\n\n# PARTE 3 — Archivos de \`deploy/\` y configuración (copias exactas)\n${blocks.join("")}`,
);
console.log(`✓ ${OUT}`);
