import { z } from "zod";

/**
 * Per-key schemas for `PageContent.data` plus JSON columns of other models.
 * Field `.meta({ label, widget, help })` drives the admin form generator (F7).
 * UI strings are Spanish; keys and code are English.
 */

// ─── Field helpers ─────────────────────────────────────────────

type Widget = "text" | "textarea" | "richtext" | "media" | "link" | "toggle" | "color";
type FieldMeta = { label: string; widget?: Widget; help?: string };

const text = (label: string, opts: { max?: number; help?: string } = {}) =>
  z
    .string()
    .trim()
    .min(1, "Campo obligatorio")
    .max(opts.max ?? 200)
    .meta({ label, widget: "text", help: opts.help } satisfies FieldMeta);

const optText = (label: string, opts: { max?: number; help?: string } = {}) =>
  z
    .string()
    .trim()
    .max(opts.max ?? 200)
    .optional()
    .meta({ label, widget: "text", help: opts.help } satisfies FieldMeta);

const longText = (label: string, max = 600) =>
  z
    .string()
    .trim()
    .min(1, "Campo obligatorio")
    .max(max)
    .meta({ label, widget: "textarea" } satisfies FieldMeta);

const richText = (label: string) =>
  z
    .string()
    .max(100_000)
    .meta({ label, widget: "richtext" } satisfies FieldMeta);

/** Media id (cuid). Usage is tracked by scanning PageContent in the media library. */
const mediaRef = (label: string) =>
  z
    .string()
    .min(1)
    .nullable()
    .optional()
    .meta({ label, widget: "media" } satisfies FieldMeta);

const toggle = (label: string, help?: string) =>
  z.boolean().meta({ label, widget: "toggle", help } satisfies FieldMeta);

/** Internal path, anchor or absolute URL. */
const href = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .regex(/^(\/|#|https?:\/\/|mailto:|tel:)/, "Debe empezar con /, #, http(s)://, mailto: o tel:");

const link = (label: string) =>
  z
    .object({ label: text("Texto del botón", { max: 40 }), href })
    .meta({ label, widget: "link" } satisfies FieldMeta);

const highlight = optText("Fragmento resaltado", {
  help: "Parte exacta del título que se muestra destacada.",
});

/** Common section header: eyebrow + title (+ highlight) + subtitle. */
const header = {
  eyebrow: optText("Etiqueta superior", { max: 60 }),
  title: text("Título", { max: 160 }),
  highlight,
  subtitle: z
    .string()
    .trim()
    .max(600)
    .optional()
    .meta({ label: "Bajada", widget: "textarea" } satisfies FieldMeta),
};

// ─── PageContent schemas ───────────────────────────────────────

export const pageContentSchemas = {
  "home.hero": z.object({
    ...header,
    primaryCta: link("Botón principal"),
    secondaryCta: link("Botón secundario"),
    backgroundId: mediaRef("Imagen de fondo"),
  }),
  "home.intro": z.object({
    eyebrow: optText("Etiqueta superior", { max: 60 }),
    text: longText("Texto principal"),
    showClientLogos: toggle("Mostrar logos de clientes", "Solo si hay logos cargados."),
  }),
  "home.services": z.object({ ...header, cta: link("Botón") }),
  "home.projects": z.object({ ...header, cta: link("Botón") }),
  "home.process": z.object({ ...header }),
  "home.values": z.object({ ...header, imageId: mediaRef("Imagen") }),
  "home.featured": z.object({ ...header }),
  "home.gallery": z.object({ ...header }),
  "home.cta": z.object({
    title: text("Título", { max: 120 }),
    text: longText("Texto"),
    cta: link("Botón"),
    showTestimonial: toggle("Mostrar testimonio destacado"),
  }),
  "home.contact": z.object({
    eyebrow: optText("Etiqueta superior", { max: 60 }),
    title: text("Título datos de contacto", { max: 120 }),
    text: longText("Texto datos de contacto"),
    formEyebrow: optText("Etiqueta del formulario", { max: 60 }),
    formTitle: text("Título del formulario", { max: 120 }),
    formText: longText("Texto del formulario"),
    consentText: longText("Texto de consentimiento (casilla del formulario)", 300),
  }),
  about: z.object({
    ...header,
    imageId: mediaRef("Imagen principal"),
    body: richText("Historia"),
    showValues: toggle("Mostrar diferenciales"),
    showProcess: toggle("Mostrar proceso"),
    cta: link("Botón final"),
  }),
  contact: z.object({ ...header, showMap: toggle("Mostrar mapa") }),
  "services.index": z.object({ ...header }),
  "projects.index": z.object({ ...header }),
  "blog.index": z.object({ ...header }),
  details: z.object({
    serviceWhyEyebrow: optText("Servicio · etiqueta «por qué»", { max: 60 }),
    serviceWhyTitle: text("Servicio · título «por qué elegirnos»", { max: 160 }),
    serviceStepsEyebrow: optText("Servicio · etiqueta etapas", { max: 60 }),
    serviceStepsTitle: text("Servicio · título etapas", { max: 160 }),
    serviceAsideText: longText("Servicio · texto de la caja de contacto", 300),
    projectGalleryTitle: text("Obra · título de galería", { max: 160 }),
    projectRelatedTitle: text("Obra · título de obras relacionadas", { max: 160 }),
    blogRelatedTitle: text("Blog · título de notas relacionadas", { max: 160 }),
  }),
  "legal.privacy": z.object({
    title: text("Título", { max: 120 }),
    body: richText("Contenido"),
    lastUpdated: text("Fecha de última actualización", { max: 40 }),
  }),
} as const;

export type PageContentKey = keyof typeof pageContentSchemas;
export type PageContentData<K extends PageContentKey> = z.infer<(typeof pageContentSchemas)[K]>;

export const pageContentKeys = Object.keys(pageContentSchemas) as PageContentKey[];

/** Admin labels for each editable block. */
export const pageContentLabels: Record<PageContentKey, string> = {
  "home.hero": "Inicio · Portada",
  "home.intro": "Inicio · Intro",
  "home.services": "Inicio · Encabezado de servicios",
  "home.projects": "Inicio · Encabezado de obras",
  "home.process": "Inicio · Encabezado de proceso",
  "home.values": "Inicio · Diferenciales",
  "home.featured": "Inicio · Slider de obras",
  "home.gallery": "Inicio · Encabezado de galería",
  "home.cta": "Inicio · Llamado a la acción",
  "home.contact": "Inicio · Contacto",
  about: "Página Nosotros",
  contact: "Página Contacto",
  "services.index": "Listado de servicios",
  "projects.index": "Listado de obras",
  "blog.index": "Listado del blog",
  details: "Textos de páginas de detalle",
  "legal.privacy": "Política de privacidad",
};

export function parsePageContent<K extends PageContentKey>(key: K, data: unknown) {
  return pageContentSchemas[key].parse(data) as PageContentData<K>;
}

// ─── JSON columns ──────────────────────────────────────────────

/** Digits only, Argentine local or international format, e.g. "03487-656133". */
const phoneNumber = z
  .string()
  .trim()
  .regex(/^[+\d][\d\s()-]{5,24}$/, "Número inválido");

export const phoneSchema = z.object({
  label: text("Etiqueta", { max: 40 }),
  number: phoneNumber,
  whatsapp: z.boolean(),
  primary: z.boolean(),
});
export const phonesSchema = z
  .array(phoneSchema)
  .max(6)
  .refine((list) => list.filter((p) => p.primary).length <= 1, "Solo un teléfono principal");
export type Phone = z.infer<typeof phoneSchema>;

export const socialNetworks = ["instagram", "facebook", "linkedin", "youtube", "tiktok"] as const;
export const socialSchema = z.object({
  network: z.enum(socialNetworks),
  url: z.url(),
});
export const socialsSchema = z.array(socialSchema).max(10);

export const todoSchema = z.object({ id: z.string(), text: z.string(), done: z.boolean() });
export const todosSchema = z.array(todoSchema);

export const titledItemSchema = z.object({
  title: text("Título", { max: 120 }),
  description: longText("Descripción", 400),
});
export const titledItemsSchema = z.array(titledItemSchema).max(12);

export const galleryShapes = ["normal", "tall", "wide"] as const;

// ─── Site settings form ────────────────────────────────────────

const optionalString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable();

export const settingsSchema = z
  .object({
    brandName: z.string().trim().min(2, "Campo obligatorio").max(120),
    tagline: z.string().trim().min(2, "Campo obligatorio").max(160),
    logoId: z.string().nullable(),
    faviconId: z.string().nullable(),
    accentColor: z
      .string()
      .trim()
      .regex(/^#[0-9a-fA-F]{6}$/, "Usá un color hexadecimal, ej. #E8FD53"),
    phones: phonesSchema,
    email: z
      .union([z.literal(""), z.email("Email inválido")])
      .transform((v) => v || null)
      .nullable(),
    address: optionalString(200),
    coverage: optionalString(200),
    mapEmbedUrl: z
      .union([
        z.literal(""),
        z
          .url()
          .regex(
            /^https:\/\/(www\.)?google\.[a-z.]+\/maps/,
            "Pegá un enlace de Google Maps (embed).",
          ),
      ])
      .transform((v) => v || null)
      .nullable(),
    socials: socialsSchema,
    announcementText: optionalString(160),
    announcementUrl: z
      .union([z.literal(""), href])
      .transform((v) => v || null)
      .nullable(),
    announcementEnabled: z.boolean(),
    footerText: optionalString(300),
    whatsappMessage: z.string().trim().min(2, "Campo obligatorio").max(300),
    defaultSeoTitle: z
      .string()
      .trim()
      .min(10, "Mínimo 10 caracteres")
      .max(90, "Máximo 90 caracteres"),
    defaultSeoDescription: z
      .string()
      .trim()
      .min(50, "Mínimo 50 caracteres")
      .max(170, "Máximo 170 caracteres"),
    defaultOgImageId: z.string().nullable(),
    notificationEmails: z.array(z.email("Email inválido")).max(10),
    budgetRanges: z.array(z.string().trim().min(1).max(80)).max(12),
    pendingTodos: todosSchema,
  })
  .refine((s) => !s.announcementEnabled || !!s.announcementText, {
    message: "Escribí el texto del anuncio o desactivalo.",
    path: ["announcementText"],
  });

export type SettingsInput = z.input<typeof settingsSchema>;
