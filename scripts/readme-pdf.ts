/**
 * Renders a Markdown file to an A4 PDF (printable, clickable index).
 *   pnpm docs:pdf                       → deploy/README.md → docs/guia-deploy-vps.pdf
 *                                         docs/Donweb-VPS-rodo.md → docs/Donweb-VPS-rodo.pdf
 *   pnpm docs:pdf <in.md> <out.pdf>     → a single file
 * Needs Playwright's Chromium: `pnpm exec playwright install chromium`.
 */
import { readFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { Marked } from "marked";
import { gfmHeadingId } from "marked-gfm-heading-id";

const JOBS: [string, string][] = process.argv[3]
  ? [[process.argv[2]!, process.argv[3]]]
  : [
      ["deploy/README.md", "docs/guia-deploy-vps.pdf"],
      ["docs/Donweb-VPS-rodo.md", "docs/Donweb-VPS-rodo.pdf"],
    ];

const css = `
  @page { size: A4; margin: 18mm 16mm 20mm; }
  * { box-sizing: border-box; }
  body { font: 10.5pt/1.55 -apple-system, "Helvetica Neue", Arial, sans-serif; color: #111a0d; }
  h1 { font-size: 22pt; line-height: 1.2; margin: 0 0 12pt; }
  h2 { font-size: 15pt; margin: 22pt 0 8pt; padding-top: 6pt; border-top: 2px solid #111a0d; break-after: avoid; }
  h3 { font-size: 12pt; margin: 16pt 0 6pt; break-after: avoid; }
  h2 + *, h3 + * { break-before: avoid; }
  p, li { orphans: 3; widows: 3; }
  a { color: #8f1d1f; text-decoration: none; }
  code { font: 9pt/1.4 "SF Mono", Menlo, Consolas, monospace; background: #f1efe9; padding: 1pt 3pt; border-radius: 3px; }
  pre { background: #111a0d; color: #f4f3f0; padding: 9pt 11pt; border-radius: 5px; overflow-wrap: anywhere; white-space: pre-wrap; break-inside: avoid; }
  pre code { background: none; color: inherit; padding: 0; font-size: 8.6pt; }
  table { width: 100%; border-collapse: collapse; margin: 8pt 0 12pt; font-size: 9pt; break-inside: auto; }
  tr { break-inside: avoid; }
  th, td { border: 1px solid #cfc9be; padding: 4pt 6pt; text-align: left; vertical-align: top; }
  th { background: #f1efe9; }
  blockquote { margin: 10pt 0; padding: 6pt 10pt; border-left: 4px solid #cfc9be; background: #faf9f6; break-inside: avoid; }
  blockquote p { margin: 4pt 0; }
  hr { border: 0; border-top: 1px solid #cfc9be; margin: 16pt 0; }
  ul { padding-left: 16pt; }
  li:has(> input[type=checkbox]) { list-style: none; margin-left: -14pt; }
  input[type=checkbox] { margin-right: 5pt; }
`;

const browser = await chromium.launch();
for (const [SRC, OUT] of JOBS) {
  const marked = new Marked(gfmHeadingId());
  const md = await readFile(SRC, "utf8");
  const body = await marked.parse(md);
  const title = /^# (.+)$/m.exec(md)?.[1] ?? SRC;
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>${title}</title><style>${css}</style></head><body>${body}</body></html>`;

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.pdf({
    path: OUT,
    format: "A4",
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate: `<div style="width:100%;font:8pt Helvetica,Arial,sans-serif;color:#5e5a53;padding:0 16mm;display:flex;justify-content:space-between">
    <span>${title.replace(/[<>&]/g, "")}</span>
    <span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
    margin: { top: "18mm", bottom: "20mm", left: "16mm", right: "16mm" },
    outline: true,
    tagged: true,
  });
  await page.close();
  console.log(`✓ ${SRC} → ${OUT}`);
}
await browser.close();
