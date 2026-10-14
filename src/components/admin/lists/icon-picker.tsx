"use client";

import { ICONS } from "@/components/ui/dynamic-icon";
import { ICON_LABELS, ICON_NAMES } from "@/lib/admin/icons";
import { cn } from "@/lib/cn";

export function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div role="radiogroup" aria-label="Ícono" className="grid grid-cols-6 gap-2">
      {ICON_NAMES.map((name) => {
        const Icon = ICONS[name];
        const selected = value === name;
        return (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={selected}
            title={ICON_LABELS[name]}
            onClick={() => onChange(name)}
            className={cn(
              "flex aspect-square items-center justify-center rounded-md border transition-colors",
              selected ? "border-ink bg-accent text-accent-fg" : "hover:bg-muted",
            )}
          >
            <Icon className="size-5" aria-hidden />
            <span className="sr-only">{ICON_LABELS[name]}</span>
          </button>
        );
      })}
    </div>
  );
}
