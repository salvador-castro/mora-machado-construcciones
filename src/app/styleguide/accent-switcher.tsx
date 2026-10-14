"use client";

import { useState } from "react";
import { accentVars, contrastRatio, INK, PAPER } from "@/lib/color";

const PRESETS = [
  { label: "Lima (template)", value: "#e8fd53" },
  { label: "Terracota (marca actual)", value: "#c74a2e" },
  { label: "Óxido oscuro", value: "#9b2f1f" },
];

/** Dev-only preview of the runtime accent; the real value comes from SiteSettings. */
export function AccentSwitcher() {
  const [accent, setAccent] = useState(PRESETS[0].value);

  function apply(value: string) {
    setAccent(value);
    const vars = accentVars(value) as Record<string, string> | undefined;
    if (!vars) return;
    for (const [k, v] of Object.entries(vars)) document.documentElement.style.setProperty(k, v);
  }

  const onInk = contrastRatio(accent, INK).toFixed(2);
  const onPaper = contrastRatio(accent, PAPER).toFixed(2);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {PRESETS.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => apply(p.value)}
          aria-pressed={accent === p.value}
          className="inline-flex h-10 items-center gap-2 border border-current/20 px-3 text-sm aria-pressed:border-current"
        >
          <span className="size-4" style={{ background: p.value }} />
          {p.label}
        </button>
      ))}
      <label className="inline-flex h-10 items-center gap-2 border border-current/20 px-3 text-sm">
        Personalizado
        <input type="color" value={accent} onChange={(e) => apply(e.target.value)} />
      </label>
      <p className="text-sm text-current/64">
        Contraste con ink: {onInk}:1 · con paper: {onPaper}:1
      </p>
    </div>
  );
}
