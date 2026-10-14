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
  TitledItemsField,
  TitleSlugFields,
  ToggleField,
} from "@/components/admin/form/entity-fields";
import { Field, FormSection } from "@/components/admin/form/field";
import { SaveBar } from "@/components/admin/form/save-bar";
import { useActionForm } from "@/components/admin/form/use-action-form";
import { IconPicker } from "@/components/admin/lists/icon-picker";
import { MediaField } from "@/components/admin/media/media-picker";
import { Textarea } from "@/components/admin/ui/textarea";
import { serviceFormSchema, type ServiceFormInput } from "@/lib/admin/schemas";
import type { MediaListItem } from "@/lib/media/admin-types";
import { deleteService, saveService } from "@/server/actions/services";

export function ServiceForm({
  id,
  initial,
  mediaPreviews,
  canDelete,
}: {
  id: string | null;
  initial: ServiceFormInput;
  mediaPreviews: Record<string, MediaListItem>;
  canDelete: boolean;
}) {
  const router = useRouter();
  const form = useForm<ServiceFormInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- input/output types differ (transforms)
    resolver: zodResolver(serviceFormSchema as any),
    defaultValues: initial,
  });
  const { register, control, formState } = form;
  const { submit, pending } = useActionForm(form, (values) => saveService(id, values), {
    onSuccess: (data) => {
      if (!id && data) router.replace(`/admin/servicios/${data.id}`);
      else router.refresh();
    },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <EditorHeader
        backHref="/admin/servicios"
        backLabel="Servicios"
        title={id ? initial.title : "Nuevo servicio"}
      >
        {id && <PreviewButton type="service" id={id} />}
        {id && canDelete && (
          <DeleteEntityButton
            title="¿Eliminar servicio?"
            description={`«${initial.title}» se elimina del sitio. Las obras asociadas quedan sin servicio. Si solo querés ocultarlo, desactivá «Publicado».`}
            action={() => deleteService(id)}
            redirectTo="/admin/servicios"
          />
        )}
      </EditorHeader>

      <FormProvider {...form}>
        <form onSubmit={submit} className="space-y-6" noValidate>
          <FormSection title="Datos principales">
            <TitleSlugFields isNew={!id} basePath="/servicios/" />
            <Field
              id="f-shortDescription"
              label="Descripción corta"
              help="Se ve en la tarjeta del listado y en el inicio."
              error={formState.errors.shortDescription?.message}
              required
            >
              <Textarea
                id="f-shortDescription"
                rows={3}
                maxLength={300}
                {...register("shortDescription")}
              />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="f-icon" label="Ícono" required error={formState.errors.icon?.message}>
                <Controller
                  control={control}
                  name="icon"
                  render={({ field }) => (
                    <IconPicker value={field.value} onChange={field.onChange} />
                  )}
                />
              </Field>
              <Field
                id="f-coverId"
                label="Imagen de portada"
                error={formState.errors.coverId?.message}
              >
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
            <ToggleField
              name="published"
              label="Publicado"
              help="Si está apagado, el servicio no aparece en el sitio."
            />
          </FormSection>

          <FormSection title="Contenido" description="Texto principal de la página del servicio.">
            <RichTextField name="content" label="Texto" />
          </FormSection>

          <TitledItemsField
            name="whyItems"
            title="Por qué elegirnos"
            description="Hasta 8 motivos. Idealmente 4."
            itemLabel="Motivo"
            max={8}
          />
          <TitledItemsField
            name="steps"
            title="Etapas del servicio"
            description="Cómo se trabaja, paso a paso."
            itemLabel="Etapa"
            max={10}
          />

          <SeoSection />

          <SaveBar
            pending={pending}
            dirty={formState.isDirty || !id}
            onDiscard={() => form.reset()}
            label={id ? "Guardar" : "Crear servicio"}
          />
        </form>
      </FormProvider>
    </div>
  );
}
