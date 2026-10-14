"use client";

import { Controller, FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Field } from "@/components/admin/form/field";
import { useActionForm } from "@/components/admin/form/use-action-form";
import { MediaField } from "@/components/admin/media/media-picker";
import { Button } from "@/components/admin/ui/button";
import { DialogFooter } from "@/components/admin/ui/dialog";
import { Input } from "@/components/admin/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/ui/select";
import { Switch } from "@/components/admin/ui/switch";
import { Textarea } from "@/components/admin/ui/textarea";
import { listEntityConfig, type ListEntity } from "@/lib/admin/list-entities";
import type { MediaListItem } from "@/lib/media/admin-types";
import { slugify } from "@/lib/slug";
import { saveListItem } from "@/server/actions/lists";
import { IconPicker } from "./icon-picker";

export type SelectOptions = Record<string, { value: string; label: string }[]>;

const NONE = "__none__";

export function ListItemForm({
  entity,
  id,
  defaults,
  mediaPreviews,
  options,
  onSaved,
  onCancel,
}: {
  entity: ListEntity;
  id: string | null;
  defaults: Record<string, unknown>;
  mediaPreviews: Record<string, MediaListItem>;
  options: SelectOptions;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const config = listEntityConfig(entity);
  const form = useForm({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- schema varies per entity
    resolver: zodResolver(config.schema as any),
    defaultValues: defaults,
  });
  const { register, control, formState, setValue, getValues } = form;
  const { submit, pending } = useActionForm(form, (values) => saveListItem(entity, id, values), {
    onSuccess: onSaved,
  });
  const err = (name: string) =>
    (formState.errors[name]?.message as string | undefined) ?? undefined;

  return (
    <FormProvider {...form}>
      <form onSubmit={submit} className="space-y-5" noValidate>
        {config.fields.map((f) => {
          const fid = `li-${f.name}`;
          switch (f.type) {
            case "text":
            case "textarea": {
              const reg = register(f.name, {
                onChange: (e) => {
                  // Auto-fill slug from its source while the slug wasn't edited manually.
                  const slugField = config.fields.find(
                    (x) => x.type === "slug" && x.from === f.name,
                  );
                  if (slugField && !formState.dirtyFields[slugField.name] && !id) {
                    setValue(slugField.name, slugify(e.target.value));
                  }
                },
              });
              return (
                <Field
                  key={f.name}
                  id={fid}
                  label={f.label}
                  help={f.help}
                  error={err(f.name)}
                  required={f.required}
                >
                  {f.type === "textarea" ? (
                    <Textarea
                      id={fid}
                      rows={4}
                      maxLength={f.max}
                      aria-invalid={!!err(f.name) || undefined}
                      {...reg}
                    />
                  ) : (
                    <Input
                      id={fid}
                      maxLength={f.max}
                      aria-invalid={!!err(f.name) || undefined}
                      {...reg}
                    />
                  )}
                </Field>
              );
            }
            case "slug":
              return (
                <Field
                  key={f.name}
                  id={fid}
                  label={f.label}
                  help="Parte de la dirección web. Se completa sola."
                  error={err(f.name)}
                  required
                >
                  <Input
                    id={fid}
                    className="font-mono"
                    {...register(f.name, {
                      onBlur: () => setValue(f.name, slugify(String(getValues(f.name) ?? ""))),
                    })}
                  />
                </Field>
              );
            case "media":
              return (
                <Field
                  key={f.name}
                  id={fid}
                  label={f.label}
                  help={f.help}
                  error={err(f.name)}
                  required={f.required}
                >
                  <Controller
                    control={control}
                    name={f.name}
                    render={({ field }) => (
                      <MediaField
                        id={fid}
                        value={field.value as string | null}
                        preview={field.value ? mediaPreviews[field.value as string] : null}
                        onChange={(mid) => field.onChange(mid)}
                        invalid={!!err(f.name)}
                      />
                    )}
                  />
                </Field>
              );
            case "icon":
              return (
                <Field key={f.name} id={fid} label={f.label} error={err(f.name)} required>
                  <Controller
                    control={control}
                    name={f.name}
                    render={({ field }) => (
                      <IconPicker value={field.value as string} onChange={field.onChange} />
                    )}
                  />
                </Field>
              );
            case "select": {
              const opts = f.options === "projects" ? (options.projects ?? []) : f.options;
              return (
                <Field
                  key={f.name}
                  id={fid}
                  label={f.label}
                  error={err(f.name)}
                  required={f.required}
                >
                  <Controller
                    control={control}
                    name={f.name}
                    render={({ field }) => (
                      <Select
                        value={(field.value as string | null) ?? NONE}
                        onValueChange={(v) => field.onChange(v === NONE ? null : v)}
                      >
                        <SelectTrigger id={fid} className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {!f.required && <SelectItem value={NONE}>Ninguna</SelectItem>}
                          {opts.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
              );
            }
            case "toggle":
              return (
                <Controller
                  key={f.name}
                  control={control}
                  name={f.name}
                  render={({ field }) => (
                    <label className="flex items-start justify-between gap-4 rounded-md border p-3 text-sm">
                      <span>
                        <span className="font-medium">{f.label}</span>
                        {f.help && (
                          <span className="block text-xs text-muted-foreground">{f.help}</span>
                        )}
                      </span>
                      <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                    </label>
                  )}
                />
              );
          }
        })}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            {id ? "Guardar" : "Agregar"}
          </Button>
        </DialogFooter>
      </form>
    </FormProvider>
  );
}
