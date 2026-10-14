"use client";

import { Controller, useFormContext } from "react-hook-form";
import { MediaField } from "@/components/admin/media/media-picker";
import { Input } from "@/components/admin/ui/input";
import { Switch } from "@/components/admin/ui/switch";
import { Textarea } from "@/components/admin/ui/textarea";
import type { FieldInfo } from "@/lib/content/form-meta";
import type { MediaListItem } from "@/lib/media/admin-types";
import { errorAt } from "./entity-fields";
import { Field } from "./field";
import { RichTextEditor } from "./rich-text-editor";

/** Renders inputs for fields described by describeObject(schema). */
export function SchemaFormFields({
  fields,
  prefix = "",
  mediaPreviews = {},
}: {
  fields: FieldInfo[];
  prefix?: string;
  mediaPreviews?: Record<string, MediaListItem>;
}) {
  const { register, control, formState } = useFormContext();

  return (
    <div className="space-y-5">
      {fields.map((f) => {
        const path = prefix ? `${prefix}.${f.name}` : f.name;
        const id = `f-${path.replace(/\./g, "-")}`;
        const error = errorAt(formState.errors, path);
        const aria = {
          "aria-invalid": error ? true : undefined,
          "aria-describedby": error ? `${id}-error` : f.help ? `${id}-help` : undefined,
        };

        if (f.widget === "link") {
          return (
            <fieldset key={path} className="space-y-4 rounded-md border p-4">
              <legend className="px-1 text-sm font-medium">{f.label}</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <SchemaFormFields fields={f.children ?? []} prefix={path} />
              </div>
            </fieldset>
          );
        }

        if (f.widget === "toggle") {
          return (
            <Controller
              key={path}
              control={control}
              name={path}
              render={({ field }) => (
                <div className="flex items-start justify-between gap-4 rounded-md border p-3">
                  <div className="space-y-0.5">
                    <label htmlFor={id} className="text-sm font-medium">
                      {f.label}
                    </label>
                    {f.help && <p className="text-xs text-muted-foreground">{f.help}</p>}
                  </div>
                  <Switch id={id} checked={!!field.value} onCheckedChange={field.onChange} />
                </div>
              )}
            />
          );
        }

        return (
          <Field
            key={path}
            id={id}
            label={f.label}
            help={f.help}
            error={error}
            required={f.required}
          >
            {f.widget === "textarea" ? (
              <Textarea id={id} rows={4} maxLength={f.maxLength} {...aria} {...register(path)} />
            ) : f.widget === "richtext" ? (
              <Controller
                control={control}
                name={path}
                render={({ field }) => (
                  <RichTextEditor
                    id={id}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    invalid={!!error}
                  />
                )}
              />
            ) : f.widget === "media" ? (
              <Controller
                control={control}
                name={path}
                render={({ field }) => (
                  <MediaField
                    id={id}
                    value={field.value}
                    preview={field.value ? mediaPreviews[field.value] : null}
                    onChange={(mediaId) => field.onChange(mediaId)}
                    invalid={!!error}
                  />
                )}
              />
            ) : (
              <Input id={id} maxLength={f.maxLength} {...aria} {...register(path)} />
            )}
          </Field>
        );
      })}
    </div>
  );
}
