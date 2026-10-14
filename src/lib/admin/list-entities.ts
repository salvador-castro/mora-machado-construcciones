import { z } from "zod";
import { ICON_NAMES } from "@/lib/admin/icons";
import { galleryShapes } from "@/lib/content/schemas";
import { SLUG_RE } from "@/lib/slug";

/**
 * Declarative config for simple sortable lists edited in a dialog.
 * Shared by the generic ListManager (client) and list actions (server).
 */

export type ListField =
  | {
      name: string;
      label: string;
      type: "text" | "textarea";
      required?: boolean;
      help?: string;
      max?: number;
    }
  | { name: string; label: string; type: "slug"; from: string }
  | { name: string; label: string; type: "media"; required?: boolean; help?: string }
  | { name: string; label: string; type: "icon" }
  | {
      name: string;
      label: string;
      type: "select";
      options: { value: string; label: string }[] | "projects";
      required?: boolean;
    }
  | { name: string; label: string; type: "toggle"; help?: string };

type EntityConfig = {
  label: string;
  plural: string;
  empty: string;
  fields: ListField[];
  schema: z.ZodObject;
  /** Field shown as row title / subtitle. */
  title: string;
  subtitle?: string;
  /** Row thumbnail from a media field. */
  thumb?: string;
  hasPublished: boolean;
  layout?: "list" | "grid";
};

const str = (max: number, msg = "Campo obligatorio") => z.string().trim().min(1, msg).max(max);
const optStr = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();
const slug = z.string().trim().regex(SLUG_RE, "Solo minúsculas, números y guiones").max(80);

export const LIST_ENTITIES = {
  highlight: {
    label: "Highlight",
    plural: "Highlights",
    empty: "No hay highlights.",
    title: "title",
    subtitle: "description",
    hasPublished: true,
    fields: [
      { name: "number", label: "Número", type: "text", required: true, max: 6, help: "Ej.: 01" },
      { name: "title", label: "Título", type: "text", required: true, max: 80 },
      { name: "description", label: "Descripción", type: "textarea", required: true, max: 200 },
    ],
    schema: z.object({ number: str(6), title: str(80), description: str(200) }),
  },
  marqueeItem: {
    label: "Texto",
    plural: "Marquee",
    empty: "No hay textos en el marquee.",
    title: "text",
    hasPublished: true,
    fields: [{ name: "text", label: "Texto", type: "text", required: true, max: 60 }],
    schema: z.object({ text: str(60) }),
  },
  processStep: {
    label: "Paso",
    plural: "Pasos del proceso",
    empty: "No hay pasos.",
    title: "title",
    subtitle: "description",
    hasPublished: true,
    fields: [
      { name: "title", label: "Título", type: "text", required: true, max: 80 },
      { name: "description", label: "Descripción", type: "textarea", required: true, max: 300 },
    ],
    schema: z.object({ title: str(80), description: str(300) }),
  },
  valueItem: {
    label: "Diferencial",
    plural: "Diferenciales",
    empty: "No hay diferenciales.",
    title: "title",
    subtitle: "description",
    hasPublished: true,
    fields: [
      { name: "icon", label: "Ícono", type: "icon" },
      { name: "title", label: "Título", type: "text", required: true, max: 80 },
      { name: "description", label: "Descripción", type: "textarea", required: true, max: 300 },
    ],
    schema: z.object({ icon: z.enum(ICON_NAMES), title: str(80), description: str(300) }),
  },
  projectCategory: {
    label: "Categoría",
    plural: "Categorías de obra",
    empty: "No hay categorías.",
    title: "name",
    subtitle: "slug",
    hasPublished: false,
    fields: [
      { name: "name", label: "Nombre", type: "text", required: true, max: 60 },
      { name: "slug", label: "Slug", type: "slug", from: "name" },
    ],
    schema: z.object({ name: str(60), slug }),
  },
  blogCategory: {
    label: "Categoría",
    plural: "Categorías del blog",
    empty: "No hay categorías.",
    title: "name",
    subtitle: "slug",
    hasPublished: false,
    fields: [
      { name: "name", label: "Nombre", type: "text", required: true, max: 60 },
      { name: "slug", label: "Slug", type: "slug", from: "name" },
    ],
    schema: z.object({ name: str(60), slug }),
  },
  testimonial: {
    label: "Testimonio",
    plural: "Testimonios",
    empty: "Todavía no hay testimonios. Cargá los que te pase el cliente.",
    title: "author",
    subtitle: "quote",
    thumb: "photoId",
    hasPublished: true,
    fields: [
      { name: "quote", label: "Testimonio", type: "textarea", required: true, max: 600 },
      { name: "author", label: "Autor", type: "text", required: true, max: 80 },
      {
        name: "role",
        label: "Rol o ubicación",
        type: "text",
        max: 80,
        help: "Ej.: Cliente en Zárate",
      },
      { name: "photoId", label: "Foto", type: "media" },
      { name: "projectId", label: "Obra relacionada", type: "select", options: "projects" },
      {
        name: "featured",
        label: "Destacado",
        type: "toggle",
        help: "Se muestra en el llamado a la acción de inicio.",
      },
    ],
    schema: z.object({
      quote: str(600),
      author: str(80),
      role: optStr(80),
      photoId: z.string().nullable().optional(),
      projectId: z.string().nullable().optional(),
      featured: z.boolean(),
    }),
  },
  clientLogo: {
    label: "Logo",
    plural: "Logos de clientes",
    empty: "No hay logos cargados. La fila de logos no se muestra hasta que cargues alguno.",
    title: "name",
    subtitle: "url",
    thumb: "mediaId",
    hasPublished: true,
    layout: "grid",
    fields: [
      { name: "name", label: "Nombre del cliente", type: "text", required: true, max: 80 },
      {
        name: "mediaId",
        label: "Logo",
        type: "media",
        required: true,
        help: "PNG con fondo transparente, idealmente.",
      },
      { name: "url", label: "Sitio web", type: "text", max: 300 },
    ],
    schema: z.object({
      name: str(80),
      mediaId: z.string({ error: "Elegí el logo" }).min(1, "Elegí el logo"),
      url: z
        .union([z.literal(""), z.url("URL inválida")])
        .transform((v) => v || null)
        .nullable()
        .optional(),
    }),
  },
  galleryImage: {
    label: "Imagen",
    plural: "Galería",
    empty: "La galería está vacía.",
    title: "caption",
    thumb: "mediaId",
    hasPublished: true,
    layout: "grid",
    fields: [
      { name: "mediaId", label: "Imagen", type: "media", required: true },
      { name: "caption", label: "Epígrafe", type: "text", max: 160 },
      {
        name: "shape",
        label: "Formato",
        type: "select",
        required: true,
        options: [
          { value: "normal", label: "Normal" },
          { value: "tall", label: "Vertical" },
          { value: "wide", label: "Panorámica" },
        ],
      },
    ],
    schema: z.object({
      mediaId: z.string({ error: "Elegí una imagen" }).min(1, "Elegí una imagen"),
      caption: optStr(160),
      shape: z.enum(galleryShapes),
    }),
  },
} satisfies Record<string, EntityConfig>;

export type ListEntity = keyof typeof LIST_ENTITIES;
export const LIST_ENTITY_NAMES = Object.keys(LIST_ENTITIES) as ListEntity[];
export function listEntityConfig(entity: ListEntity): EntityConfig {
  return LIST_ENTITIES[entity];
}
