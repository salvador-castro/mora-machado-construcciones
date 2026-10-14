// Color helpers for the runtime-editable accent (SiteSettings.accentColor).

export const INK = "#111a0d";
export const PAPER = "#f4f3f0";

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isHexColor(value: string): boolean {
  return HEX_RE.test(value.trim());
}

function toRgb(hex: string): [number, number, number] {
  let h = hex.trim().replace("#", "");
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** WCAG relative luminance. */
export function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two colors (1–21). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Ink or paper, whichever reads better on top of `accent`. */
export function accentForeground(accent: string): string {
  return contrastRatio(accent, INK) >= contrastRatio(accent, PAPER) ? INK : PAPER;
}

/** CSS custom properties to inject on <html> for a given accent. */
export function accentVars(accent: string | null | undefined): React.CSSProperties | undefined {
  if (!accent || !isHexColor(accent)) return undefined;
  const hex = accent.startsWith("#") ? accent : `#${accent}`;
  return { "--accent": hex, "--accent-fg": accentForeground(hex) } as React.CSSProperties;
}
