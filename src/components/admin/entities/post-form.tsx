"use client";

import { useRouter } from "next/navigation";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DeleteEntityButton,
  EditorHeader,
  PreviewButton,
  RichTextField,
  SeoSection,
  TitleSlugFields,
} from "@/components/admin/form/entity-fields";
import { Field, FormSection } from "@/components/admin/form/field";
import { SaveBar } from "@/components/admin/form/save-bar";
import { useActionForm } from "@/components/admin/form/use-action-form";
import { MediaField } from "@/components/admin/media/media-picker";
import { Input } from "@/components/admin/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/ui/select";
import { Textarea } from "@/components/admin/ui/textarea";
import { postFormSchema, type PostFormInput } from "@/lib/admin/schemas";
import type { MediaListItem } from "@/lib/media/admin-types";
import { deletePost, savePost } from "@/server/actions/posts";

const NONE = "__none__";

export function PostForm({
  id,
  initial,
  categories,
  mediaPreviews,
}: {
  id: string | null;
  initial: PostFormInput;
  categories: { value: string; label: string }[];
  mediaPreviews: Record<string, MediaListItem>;
}) {
  const router = useRouter();
  const form = useForm<PostFormInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- input/output types differ (transforms)
    resolver: zodResolver(postFormSchema as any),
    defaultValues: initial,
  });
  const { register, control, formState } = form;
  const errors = formState.errors;
  const status = useWatch({ control, name: "status" });
  const { submit, pending } = useActionForm(form, (values) => savePost(id, values), {
    onSuccess: (data) => {
      if (!id && data) router.replace(`/admin/blog/${data.id}`);
      else router.refresh();
    },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <EditorHeader
        backHref="/admin/blog"
        backLabel="Blog"
        title={id ? initial.title : "Nueva nota"}
      >
        {id && <PreviewButton type="post" id={id} />}
        {id && (
          <DeleteEntityButton
            title="¿Eliminar nota?"
            description={`«${initial.title}» se elimina definitivamente. Si solo querés sacarla del sitio, pasala a borrador.`}
            action={() => deletePost(id)}
            redirectTo="/admin/blog"
          />
        )}
      </EditorHeader>

      <FormProvider {...form}>
        <form onSubmit={submit} className="space-y-6" noValidate>
          <FormSection title="Datos principales">
            <TitleSlugFields isNew={!id} basePath="/blog/" />
            <Field
              id="f-excerpt"
              label="Bajada"
              help="Resumen corto que se ve en el listado del blog."
              required
              error={errors.excerpt?.message}
            >
              <Textarea id="f-excerpt" rows={3} maxLength={300} {...register("excerpt")} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="f-categoryId" label="Categoría" error={errors.categoryId?.message}>
                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? NONE}
                      onValueChange={(v) => field.onChange(v === NONE ? null : v)}
                    >
                      <SelectTrigger id="f-categoryId" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>Sin categoría</SelectItem>
                        {categories.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field id="f-coverId" label="Imagen principal" error={errors.coverId?.message}>
                <Controller
                  control={control}
                  name="coverId"
                  render={({ field }) => (
                    <MediaField
                      id="f-coverId"
                      value={field.value}
                      preview={field.value ? mediaPreviews[field.value] : null}
                      onChange={(mid) => field.onChange(mid)}
                    />
                  )}
                />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Contenido">
            <RichTextField name="content" label="Texto de la nota" />
          </FormSection>

          <FormSection title="Publicación">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="f-status" label="Estado" required error={errors.status?.message}>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="f-status" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Borrador (no se ve en el sitio)</SelectItem>
                        <SelectItem value="PUBLISHED">Publicada</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field
                id="f-publishedAt"
                label="Fecha de publicación"
                help="Vacío: se usa la fecha del día en que se publica."
                error={errors.publishedAt?.message}
              >
                <Input id="f-publishedAt" type="date" {...register("publishedAt")} />
              </Field>
            </div>
          </FormSection>

          <SeoSection />

          <SaveBar
            pending={pending}
            dirty={formState.isDirty || !id}
            onDiscard={() => form.reset()}
            label={
              status === "PUBLISHED"
                ? initial.status === "PUBLISHED"
                  ? "Guardar"
                  : "Publicar"
                : "Guardar borrador"
            }
          />
        </form>
      </FormProvider>
    </div>
  );
}
