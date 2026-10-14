"use client";

import { useFieldArray, useForm, useWatch, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { Field, FormSection } from "@/components/admin/form/field";
import { SaveBar } from "@/components/admin/form/save-bar";
import { useActionForm } from "@/components/admin/form/use-action-form";
import { MediaField } from "@/components/admin/media/media-picker";
import { Button } from "@/components/admin/ui/button";
import { Checkbox } from "@/components/admin/ui/checkbox";
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
import { accentForeground, contrastRatio, INK, isHexColor, PAPER } from "@/lib/color";
import { settingsSchema, socialNetworks, type SettingsInput } from "@/lib/content/schemas";
import type { MediaListItem } from "@/lib/media/admin-types";
import { saveSettings } from "@/server/actions/settings";
import { LinesField } from "./lines-field";
import { TestEmailButton } from "./test-email-button";

const NETWORK_LABEL: Record<(typeof socialNetworks)[number], string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  tiktok: "TikTok",
};

const ACCENT_PRESETS = [
  { label: "Lima", value: "#E8FD53" },
  { label: "Terracota", value: "#C74A2E" },
  { label: "Óxido", value: "#9B2F1F" },
];

export function SettingsForm({
  initial,
  mediaPreviews,
}: {
  initial: SettingsInput;
  mediaPreviews: Record<string, MediaListItem>;
}) {
  const form = useForm<SettingsInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- input/output types differ (transforms)
    resolver: zodResolver(settingsSchema as any),
    defaultValues: initial,
  });
  const { register, control, formState } = form;
  const errors = formState.errors;
  const phones = useFieldArray({ control, name: "phones" });
  const socials = useFieldArray({ control, name: "socials" });
  const todos = useFieldArray({ control, name: "pendingTodos" });
  const { submit, pending } = useActionForm(form, saveSettings);

  const accent = useWatch({ control, name: "accentColor" });
  const validAccent = isHexColor(accent) ? accent : "#E8FD53";
  const fg = accentForeground(validAccent);
  const ratio = contrastRatio(validAccent, fg);
  const onInk = contrastRatio(validAccent, INK);
  const seoTitle = useWatch({ control, name: "defaultSeoTitle" }) ?? "";
  const seoDesc = useWatch({ control, name: "defaultSeoDescription" }) ?? "";

  const media = (
    name: "logoId" | "faviconId" | "defaultOgImageId",
    label: string,
    help?: string,
  ) => (
    <Field id={`f-${name}`} label={label} help={help} error={errors[name]?.message}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <MediaField
            id={`f-${name}`}
            value={field.value}
            preview={field.value ? mediaPreviews[field.value] : null}
            onChange={(id) => field.onChange(id)}
          />
        )}
      />
    </Field>
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={submit} className="space-y-6" noValidate>
        <FormSection title="Empresa">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="f-brandName" label="Nombre" error={errors.brandName?.message} required>
              <Input id="f-brandName" {...register("brandName")} />
            </Field>
            <Field id="f-tagline" label="Bajada" error={errors.tagline?.message} required>
              <Input id="f-tagline" {...register("tagline")} />
            </Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {media("logoId", "Logo", "Si no hay logo se muestra el monograma con las iniciales.")}
            {media("faviconId", "Favicon", "Imagen cuadrada (se recorta a 512×512).")}
          </div>
        </FormSection>

        <FormSection
          title="Color de acento"
          description="Se usa en botones, íconos y resaltados. El cambio se ve en todo el sitio al guardar."
        >
          <div className="flex flex-wrap items-center gap-3">
            <Controller
              control={control}
              name="accentColor"
              render={({ field }) => (
                <>
                  <input
                    type="color"
                    aria-label="Elegir color"
                    value={validAccent}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    className="size-10 cursor-pointer rounded border bg-card p-1"
                  />
                  <Input
                    id="f-accentColor"
                    aria-label="Color en hexadecimal"
                    className="w-32 font-mono uppercase"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    aria-invalid={errors.accentColor ? true : undefined}
                  />
                </>
              )}
            />
            {ACCENT_PRESETS.map((p) => (
              <Button
                key={p.value}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => form.setValue("accentColor", p.value, { shouldDirty: true })}
              >
                <span className="size-3 rounded-sm" style={{ background: p.value }} />
                {p.label}
              </Button>
            ))}
          </div>
          {errors.accentColor && (
            <p className="text-xs text-destructive">{errors.accentColor.message}</p>
          )}
          <div
            className="flex flex-wrap items-center gap-4 rounded-md border p-4"
            style={{ background: INK }}
          >
            <span
              className="inline-flex h-11 items-center px-5 text-sm font-medium"
              style={{ background: validAccent, color: fg }}
            >
              Pedir presupuesto
            </span>
            <span className="text-xl font-medium" style={{ color: validAccent }}>
              soluciones concretas
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Texto sobre el acento: {fg === INK ? "oscuro" : "claro"} · contraste {ratio.toFixed(1)}
            :1 · acento sobre fondo oscuro {onInk.toFixed(1)}:1
          </p>
          {ratio < 4.5 && (
            <p className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              El contraste del texto de los botones es menor a 4.5:1 (recomendación de accesibilidad
              AA). Se lee bien en textos grandes, pero conviene un tono{" "}
              {fg === PAPER ? "más oscuro" : "más claro"}.
            </p>
          )}
        </FormSection>

        <FormSection
          title="Teléfonos"
          description="El principal de WhatsApp se usa en el botón flotante y en el formulario."
        >
          <ul className="space-y-3">
            {phones.fields.map((f, i) => (
              <li
                key={f.id}
                className="grid gap-3 rounded-md border p-3 sm:grid-cols-[1fr_1fr_auto_auto_auto] sm:items-end"
              >
                <Field
                  id={`f-phone-label-${i}`}
                  label="Etiqueta"
                  required
                  error={errors.phones?.[i]?.label?.message}
                >
                  <Input id={`f-phone-label-${i}`} {...register(`phones.${i}.label`)} />
                </Field>
                <Field
                  id={`f-phone-number-${i}`}
                  label="Número"
                  required
                  error={errors.phones?.[i]?.number?.message}
                >
                  <Input
                    id={`f-phone-number-${i}`}
                    inputMode="tel"
                    placeholder="03487-656133"
                    {...register(`phones.${i}.number`)}
                  />
                </Field>
                <Controller
                  control={control}
                  name={`phones.${i}.whatsapp`}
                  render={({ field }) => (
                    <label className="flex h-9 items-center gap-2 text-sm">
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                      WhatsApp
                    </label>
                  )}
                />
                <Controller
                  control={control}
                  name={`phones.${i}.primary`}
                  render={({ field }) => (
                    <label className="flex h-9 items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="primary-phone"
                        checked={field.value}
                        onChange={() =>
                          phones.fields.forEach((_, j) =>
                            form.setValue(`phones.${j}.primary`, j === i, { shouldDirty: true }),
                          )
                        }
                        className="size-4 accent-ink"
                      />
                      Principal
                    </label>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => phones.remove(i)}
                  aria-label="Quitar teléfono"
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
          {errors.phones?.root?.message && (
            <p className="text-xs text-destructive">{errors.phones.root.message}</p>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              phones.append({
                label: "Teléfono",
                number: "",
                whatsapp: true,
                primary: phones.fields.length === 0,
              })
            }
          >
            <Plus /> Agregar teléfono
          </Button>
          <Field
            id="f-whatsappMessage"
            label="Mensaje del botón flotante de WhatsApp"
            help="Texto que aparece escrito al abrir WhatsApp desde el botón verde."
            required
            error={errors.whatsappMessage?.message}
          >
            <Textarea id="f-whatsappMessage" rows={2} {...register("whatsappMessage")} />
          </Field>
        </FormSection>

        <FormSection title="Contacto y ubicación">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="f-email" label="Email público" error={errors.email?.message}>
              <Input id="f-email" type="email" {...register("email")} />
            </Field>
            <Field id="f-address" label="Ubicación" error={errors.address?.message}>
              <Input id="f-address" {...register("address")} />
            </Field>
            <Field id="f-coverage" label="Cobertura" error={errors.coverage?.message}>
              <Input id="f-coverage" {...register("coverage")} />
            </Field>
            <Field
              id="f-mapEmbedUrl"
              label="Mapa (Google Maps)"
              help="En Google Maps: Compartir → Insertar un mapa → copiá solo la URL del src."
              error={errors.mapEmbedUrl?.message}
            >
              <Input id="f-mapEmbedUrl" {...register("mapEmbedUrl")} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Redes sociales">
          <ul className="space-y-3">
            {socials.fields.map((f, i) => (
              <li key={f.id} className="flex flex-wrap items-end gap-3">
                <Controller
                  control={control}
                  name={`socials.${i}.network`}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-40" aria-label="Red social">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {socialNetworks.map((n) => (
                          <SelectItem key={n} value={n}>
                            {NETWORK_LABEL[n]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <div className="min-w-60 flex-1">
                  <Input
                    aria-label="URL del perfil"
                    placeholder="https://instagram.com/…"
                    aria-invalid={errors.socials?.[i]?.url ? true : undefined}
                    {...register(`socials.${i}.url`)}
                  />
                  {errors.socials?.[i]?.url && (
                    <p className="mt-1 text-xs text-destructive">
                      {errors.socials[i]?.url?.message}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => socials.remove(i)}
                  aria-label="Quitar red"
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => socials.append({ network: "instagram", url: "" })}
          >
            <Plus /> Agregar red
          </Button>
        </FormSection>

        <FormSection title="Barra de anuncio" description="Franja arriba de todo el sitio.">
          <Controller
            control={control}
            name="announcementEnabled"
            render={({ field }) => (
              <label className="flex items-center gap-3 text-sm">
                <Switch checked={field.value} onCheckedChange={field.onChange} />
                Mostrar barra de anuncio
              </label>
            )}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="f-announcementText" label="Texto" error={errors.announcementText?.message}>
              <Input id="f-announcementText" {...register("announcementText")} />
            </Field>
            <Field
              id="f-announcementUrl"
              label="Enlace"
              help="Ej.: #contacto o /obras"
              error={errors.announcementUrl?.message}
            >
              <Input id="f-announcementUrl" {...register("announcementUrl")} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Pie de página">
          <Field id="f-footerText" label="Frase del footer" error={errors.footerText?.message}>
            <Textarea id="f-footerText" rows={2} {...register("footerText")} />
          </Field>
        </FormSection>

        <FormSection
          title="SEO por defecto"
          description="Se usa cuando una página no tiene su propio título o descripción."
        >
          <Field
            id="f-defaultSeoTitle"
            label={`Título (${seoTitle.length} caracteres)`}
            help="Google suele mostrar unos 60 caracteres; el resto se corta."
            required
            error={errors.defaultSeoTitle?.message}
          >
            <Input id="f-defaultSeoTitle" {...register("defaultSeoTitle")} />
          </Field>
          <Field
            id="f-defaultSeoDescription"
            label={`Descripción (${seoDesc.length}/170)`}
            required
            error={errors.defaultSeoDescription?.message}
          >
            <Textarea
              id="f-defaultSeoDescription"
              rows={3}
              {...register("defaultSeoDescription")}
            />
          </Field>
          {media(
            "defaultOgImageId",
            "Imagen para redes",
            "Se ve al compartir el sitio en WhatsApp, Facebook, etc.",
          )}
        </FormSection>

        <FormSection title="Formulario de contacto">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              id="f-notificationEmails"
              label="Emails que reciben las consultas"
              help="Uno por línea."
              error={
                errors.notificationEmails?.message ??
                errors.notificationEmails?.find?.((e) => e)?.message
              }
            >
              <Controller
                control={control}
                name="notificationEmails"
                render={({ field }) => (
                  <LinesField
                    id="f-notificationEmails"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="consultas@…"
                    invalid={!!errors.notificationEmails}
                  />
                )}
              />
            </Field>
            <Field
              id="f-budgetRanges"
              label="Rangos de presupuesto"
              help="Uno por línea. Vacío oculta el campo."
              error={errors.budgetRanges?.message}
            >
              <Controller
                control={control}
                name="budgetRanges"
                render={({ field }) => (
                  <LinesField id="f-budgetRanges" value={field.value} onChange={field.onChange} />
                )}
              />
            </Field>
          </div>
          <TestEmailButton dirty={formState.isDirty} />
        </FormSection>

        <FormSection
          title="Pendientes del cliente"
          description="Se muestran en el inicio del panel."
        >
          <ul className="space-y-2">
            {todos.fields.map((f, i) => (
              <li key={f.id} className="flex items-start gap-3">
                <Controller
                  control={control}
                  name={`pendingTodos.${i}.done`}
                  render={({ field }) => (
                    <Checkbox
                      className="mt-2.5"
                      checked={field.value}
                      onCheckedChange={(v) => field.onChange(v === true)}
                      aria-label="Resuelto"
                    />
                  )}
                />
                <Textarea
                  rows={1}
                  className="min-h-9 flex-1"
                  {...register(`pendingTodos.${i}.text`)}
                  aria-label="Pendiente"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => todos.remove(i)}
                  aria-label="Quitar pendiente"
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => todos.append({ id: `todo-${Date.now()}`, text: "", done: false })}
          >
            <Plus /> Agregar pendiente
          </Button>
        </FormSection>

        <SaveBar pending={pending} dirty={formState.isDirty} onDiscard={() => form.reset()} />
      </form>
    </FormProvider>
  );
}
