"use client";

import { useRouter } from "next/navigation";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DeleteEntityButton,
  EditorHeader,
  PreviewButton,
  RichTextField,
  SeoSection,
  TitleSlugFields,
  ToggleField,
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
import { projectFormSchema, type ProjectFormInput } from "@/lib/admin/schemas";
import type { MediaListItem } from "@/lib/media/admin-types";
import { deleteProject, saveProject } from "@/server/actions/projects";
import { GalleryField } from "./gallery-field";

type Option = { value: string; label: string };
const NONE = "__none__";

export function ProjectForm({
  id,
  initial,
  options,
  mediaPreviews,
}: {
  id: string | null;
  initial: ProjectFormInput;
  options: { categories: Option[]; services: Option[] };
  mediaPreviews: Record<string, MediaListItem>;
}) {
  const router = useRouter();
  const form = useForm<ProjectFormInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- input/output types differ (transforms)
    resolver: zodResolver(projectFormSchema as any),
    defaultValues: initial,
  });
  const { register, control, formState } = form;
  const errors = formState.errors;
  const { submit, pending } = useActionForm(form, (values) => saveProject(id, values), {
    onSuccess: (data) => {
      if (!id && data) router.replace(`/admin/obras/${data.id}`);
      else router.refresh();
    },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <EditorHeader
        backHref="/admin/obras"
        backLabel="Obras"
        title={id ? initial.title : "Nueva obra"}
      >
        {id && <PreviewButton type="project" id={id} />}
        {id && (
          <DeleteEntityButton
            title="¿Eliminar obra?"
            description={`«${initial.title}» se elimina del sitio junto con su galería (las fotos quedan en Medios). Si solo querés ocultarla, desactivá «Publicada».`}
            action={() => deleteProject(id)}
            redirectTo="/admin/obras"
          />
        )}
      </EditorHeader>

      <FormProvider {...form}>
        <form onSubmit={submit} className="space-y-6" noValidate>
          <FormSection title="Datos principales">
            <TitleSlugFields isNew={!id} basePath="/obras/" />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                id="f-categoryId"
                label="Categoría"
                required
                error={errors.categoryId?.message}
              >
                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="f-categoryId"
                        className="w-full"
                        aria-invalid={errors.categoryId ? true : undefined}
                      >
                        <SelectValue placeholder="Elegí una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {options.categories.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field
                id="f-serviceId"
                label="Servicio"
                help="Muestra la obra en la página del servicio."
                error={errors.serviceId?.message}
              >
                <Controller
                  control={control}
                  name="serviceId"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? NONE}
                      onValueChange={(v) => field.onChange(v === NONE ? null : v)}
                    >
                      <SelectTrigger id="f-serviceId" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>Ninguno</SelectItem>
                        {options.services.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <Field id="f-location" label="Ubicación" required error={errors.location?.message}>
                <Input id="f-location" placeholder="Zárate, Bs. As." {...register("location")} />
              </Field>
              <Field id="f-year" label="Año" error={errors.year?.message}>
                <Input id="f-year" inputMode="numeric" maxLength={4} {...register("year")} />
              </Field>
              <Field id="f-area" label="Superficie" help="Ej.: 450 m²" error={errors.area?.message}>
                <Input id="f-area" maxLength={40} {...register("area")} />
              </Field>
            </div>
            <Field
              id="f-excerpt"
              label="Resumen"
              help="Se ve en la tarjeta del listado."
              required
              error={errors.excerpt?.message}
            >
              <Textarea id="f-excerpt" rows={3} maxLength={300} {...register("excerpt")} />
            </Field>
            <Field id="f-coverId" label="Foto de portada" error={errors.coverId?.message}>
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
            <div className="grid gap-3 sm:grid-cols-2">
              <ToggleField
                name="published"
                label="Publicada"
                help="Si está apagado, la obra no aparece en el sitio."
              />
              <ToggleField name="featured" label="Destacada" help="Aparece en el inicio." />
            </div>
          </FormSection>

          <GalleryField name="images" initialPreviews={mediaPreviews} />

          <FormSection title="Descripción" description="Texto de la página de la obra.">
            <RichTextField name="content" label="Texto" />
          </FormSection>

          <SeoSection />

          <SaveBar
            pending={pending}
            dirty={formState.isDirty || !id}
            onDiscard={() => form.reset()}
            label={id ? "Guardar" : "Crear obra"}
          />
        </form>
      </FormProvider>
    </div>
  );
}
