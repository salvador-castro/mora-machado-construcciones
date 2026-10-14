"use client";

import { useState } from "react";
import { Textarea } from "@/components/admin/ui/textarea";

/** Edits string[] as one item per line (mobile-friendly). */
export function LinesField({
  id,
  value,
  onChange,
  placeholder,
  invalid,
}: {
  id: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  invalid?: boolean;
}) {
  const [text, setText] = useState(value.join("\n"));
  return (
    <Textarea
      id={id}
      rows={Math.max(3, value.length + 1)}
      value={text}
      placeholder={placeholder}
      aria-invalid={invalid || undefined}
      onChange={(e) => {
        setText(e.target.value);
        onChange(
          e.target.value
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean),
        );
      }}
    />
  );
}
