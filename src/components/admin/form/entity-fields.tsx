"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Controller,
  useFieldArray,
  useFormContext,
  useWatch,
  type FieldErrors,
} from "react-hook-form";
import { ArrowDown, ArrowLeft, ArrowUp, ExternalLink, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/admin/ui/alert-dialog";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Switch } from "@/components/admin/ui/switch";
import { Textarea } from "@/components/admin/ui/textarea";
import { slugify } from "@/lib/slug";
import { Field, FormSection } from "./field";
import { RichTextEditor } from "./rich-text-editor";

/** Reads a nested error message ("steps.0.title"). */
export function errorAt(errors: FieldErrors, path: string): string | undefined {
  let node: unknown = errors;
  for (const part of path.split(".")) node = (node as Record<string, unknown> | undefined)?.[part];
  return (node as { message?: string } | undefined)?.message;
}

/** Back link + title + header actions for full-page entity editors. */
export function EditorHeader({
  backHref,
  backLabel,
  title,
  children,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 lg:mb-8">
      <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
        <Link href={backHref}>
          <ArrowLeft />
          {backLabel}
        </Link>
      </Button>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-medium tracking-tight">{title}</h1>
        {children && <div className="flex flex-wrap gap-2">{children}</div>}
      </div>
    </div>
  );
}

/** Opens the public page through /admin/preview (Draft Mode shows unpublished items). */
export function PreviewButton({ type, id }: { type: "post" | "project" | "service"; id: string }) {
  return (
    <Button variant="outline" size="sm" asChild>
      <a href={`/admin/preview?type=${type}&id=${id}`} target="_blank" rel="noopener">
        <ExternalLink />
        Vista previa
      </a>
    </Button>
  );
}

/** Confirmed delete that navigates back to the list on success. */
export function DeleteEntityButton({
  title,
  description,
  action,
  redirectTo,
}: {
  title: string;
  description: string;
  action: () => Promise<{ ok: true; message?: string } | { ok: false; error: string }>;
  redirectTo: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={pending}>
          <Trash2 />
          Eliminar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              startTransition(async () => {
                const res = await action();
                if (res.ok) {
                  toast.success(res.message ?? "Eliminado.");
                  router.push(redirectTo);
                } else toast.error(res.error);
              })
            }
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Title + slug inputs. While creating, the slug follows the title until the
 * user edits it by hand.
 */
export function TitleSlugFields({
  isNew,
  titleLabel = "Título",
  basePath,
}: {
  isNew: boolean;
  titleLabel?: string;
  /** Public path prefix shown as help, e.g. "/servicios/". */
  basePath: string;
}) {
  const { register, formState, setValue, getValues } = useFormContext();
  const slug = useWatch({ name: "slug" }) as string;
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field id="f-title" label={titleLabel} error={errorAt(formState.errors, "title")} required>
        <Input
          id="f-title"
          aria-invalid={formState.errors.title ? true : undefined}
          {...register("title", {
            onChange: (e) => {
              if (isNew && !formState.dirtyFields.slug) {
                setValue("slug", slugify(e.target.value));
              }
            },
          })}
        />
      </Field>
      <Field
        id="f-slug"
        label="Dirección (slug)"
        help={`${basePath}${slug || "…"}${isNew ? "" : " · Cambiarlo rompe los enlaces viejos."}`}
        error={errorAt(formState.errors, "slug")}
        required
      >
        <Input
          id="f-slug"
          className="font-mono"
          aria-invalid={formState.errors.slug ? true : undefined}
          {...register("slug", {
            onBlur: () =>
              setValue("slug", slugify(String(getValues("slug") ?? "")), { shouldDirty: true }),
          })}
        />
      </Field>
    </div>
  );
}

export function RichTextField({
  name,
  label,
  help,
}: {
  name: string;
  label: string;
  help?: string;
}) {
  const { control, formState } = useFormContext();
  const error = errorAt(formState.errors, name);
  return (
    <Field id={`f-${name}`} label={label} help={help} error={error} required={false}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <RichTextEditor
            id={`f-${name}`}
            value={field.value ?? ""}
            onChange={field.onChange}
            invalid={!!error}
            minHeight={320}
          />
        )}
      />
    </Field>
  );
}

/** Labeled switch row bound to a boolean field. */
export function ToggleField({ name, label, help }: { name: string; label: string; help?: string }) {
  const { control } = useFormContext();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <label className="flex items-start justify-between gap-4 rounded-md border p-3 text-sm">
          <span>
            <span className="font-medium">{label}</span>
            {help && <span className="block text-xs text-muted-foreground">{help}</span>}
          </span>
          <Switch checked={!!field.value} onCheckedChange={field.onChange} />
        </label>
      )}
    />
  );
}

/**
 * Optional SEO overrides. The placeholders show what is used when they stay empty
 * (the entity's title and `summaryField`), so nobody fills them in by accident.
 */
export function SeoSection({ summaryField = "excerpt" }: { summaryField?: string }) {
  const { register, formState } = useFormContext();
  const title = (useWatch({ name: "seoTitle" }) as string | null) ?? "";
  const desc = (useWatch({ name: "seoDescription" }) as string | null) ?? "";
  const fallbackTitle = (useWatch({ name: "title" }) as string | null) ?? "";
  const fallbackDesc = (useWatch({ name: summaryField }) as string | null) ?? "";
  return (
    <FormSection
      title="SEO"
      description="Opcional: dejalo vacío salvo que quieras otro texto en Google y en la pestaña del navegador. Vacío, se usan el título y el resumen (los ves en gris)."
    >
      <Field
        id="f-seoTitle"
        label={`Título para Google (${title.length}/90)`}
        error={errorAt(formState.errors, "seoTitle")}
      >
        <Input
          id="f-seoTitle"
          maxLength={90}
          autoComplete="off"
          placeholder={fallbackTitle}
          {...register("seoTitle")}
        />
      </Field>
      <Field
        id="f-seoDescription"
        label={`Descripción para Google (${desc.length}/170)`}
        error={errorAt(formState.errors, "seoDescription")}
      >
        <Textarea
          id="f-seoDescription"
          rows={3}
          maxLength={170}
          autoComplete="off"
          placeholder={fallbackDesc}
          {...register("seoDescription")}
        />
      </Field>
    </FormSection>
  );
}

/** Editable list of { title, description } (e.g. service stages). */
export function TitledItemsField({
  name,
  title,
  description,
  itemLabel,
  max,
}: {
  name: string;
  title: string;
  description?: string;
  itemLabel: string;
  max: number;
}) {
  const { control, register, formState } = useFormContext();
  const { fields, append, remove, move } = useFieldArray({ control, name });
  return (
    <FormSection title={title} description={description}>
      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Sin elementos. Si queda vacío no se muestra.
        </p>
      )}
      <ol className="space-y-3">
        {fields.map((f, i) => {
          const base = `${name}.${i}`;
          return (
            <li key={f.id} className="space-y-3 rounded-md border p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">
                  {itemLabel} {i + 1}
                </span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Subir"
                    disabled={i === 0}
                    onClick={() => move(i, i - 1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Bajar"
                    disabled={i === fields.length - 1}
                    onClick={() => move(i, i + 1)}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Quitar ${itemLabel.toLowerCase()} ${i + 1}`}
                    onClick={() => remove(i)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
              <Field
                id={`f-${name}-${i}-title`}
                label="Título"
                required
                error={errorAt(formState.errors, `${base}.title`)}
              >
                <Input id={`f-${name}-${i}-title`} {...register(`${base}.title`)} />
              </Field>
              <Field
                id={`f-${name}-${i}-description`}
                label="Descripción"
                required
                error={errorAt(formState.errors, `${base}.description`)}
              >
                <Textarea
                  id={`f-${name}-${i}-description`}
                  rows={2}
                  {...register(`${base}.description`)}
                />
              </Field>
            </li>
          );
        })}
      </ol>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={fields.length >= max}
        onClick={() => append({ title: "", description: "" })}
      >
        <Plus /> Agregar {itemLabel.toLowerCase()}
      </Button>
    </FormSection>
  );
}
