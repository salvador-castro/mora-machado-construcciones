import type { z } from "zod";

export type Widget = "text" | "textarea" | "richtext" | "media" | "link" | "toggle" | "color";
export type FieldInfo = {
  name: string;
  label: string;
  widget: Widget;
  help?: string;
  required: boolean;
  maxLength?: number;
  /** Nested fields for `link` objects. */
  children?: FieldInfo[];
};

type AnySchema = z.ZodType & {
  meta: () => Record<string, unknown> | undefined;
  shape?: Record<string, AnySchema>;
  unwrap?: () => AnySchema;
  def?: { type?: string; innerType?: AnySchema; checks?: unknown[] };
  maxLength?: number | null;
};

function unwrap(schema: AnySchema): AnySchema {
  let s = schema;
  // optional / nullable / default wrappers
  while (s.def?.innerType) s = s.def.innerType;
  return s;
}

/** Field descriptors from a z.object built with the helpers in schemas.ts. */
export function describeObject(schema: z.ZodType): FieldInfo[] {
  const shape = (unwrap(schema as AnySchema).shape ?? {}) as Record<string, AnySchema>;
  return Object.entries(shape).map(([name, field]) => describeField(name, field));
}

function describeField(name: string, field: AnySchema): FieldInfo {
  const meta = (field.meta?.() ?? unwrap(field).meta?.() ?? {}) as {
    label?: string;
    widget?: Widget;
    help?: string;
  };
  const inner = unwrap(field);
  const type = inner.def?.type;
  const widget: Widget =
    meta.widget ?? (type === "boolean" ? "toggle" : type === "object" ? "link" : "text");
  const required = !field.safeParse(undefined).success && widget !== "toggle";

  return {
    name,
    label: meta.label ?? (name === "href" ? "Enlace" : name),
    widget,
    help: meta.help,
    required,
    maxLength: inner.maxLength ?? undefined,
    children: widget === "link" ? describeObject(inner) : undefined,
  };
}

/** Names of rich text fields (sanitized server-side on save). */
export function richTextFields(schema: z.ZodType) {
  return describeObject(schema)
    .filter((f) => f.widget === "richtext")
    .map((f) => f.name);
}

/** Names of media id fields (for preview loading). */
export function mediaFields(schema: z.ZodType) {
  return describeObject(schema)
    .filter((f) => f.widget === "media")
    .map((f) => f.name);
}
