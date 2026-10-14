import { z } from "zod";
import { ICON_NAMES } from "@/lib/admin/icons";
import { titledItemSchema } from "@/lib/content/schemas";
import { SLUG_RE } from "@/lib/slug";

/** Admin form schemas for entities with dedicated editors (shared client/server). */

const req = (max: number) => z.string().trim().min(1, "Campo obligatorio").max(max);
const opt = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable();
const slug = z
  .string()
  .trim()
  .min(1, "Campo obligatorio")
  .max(80)
  .regex(SLUG_RE, "Solo minúsculas, números y guiones");
const seo = {
  seoTitle: opt(90),
  seoDescription: opt(170),
};

export const serviceFormSchema = z.object({
  title: req(80),
  slug,
  shortDescription: req(300),
  icon: z.enum(ICON_NAMES),
  coverId: z.string().nullable(),
  content: z.string().max(100_000),
  whyItems: z.array(titledItemSchema).max(8),
  steps: z.array(titledItemSchema).max(10),
  published: z.boolean(),
  ...seo,
});
export type ServiceFormInput = z.input<typeof serviceFormSchema>;

export const projectFormSchema = z.object({
  title: req(120),
  slug,
  categoryId: z.string({ error: "Elegí una categoría" }).min(1, "Elegí una categoría"),
  serviceId: z.string().nullable(),
  location: req(120),
  year: z
    .union([z.literal(""), z.coerce.number().int().min(1950).max(2100)])
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  area: opt(40),
  excerpt: req(300),
  content: z.string().max(100_000),
  coverId: z.string().nullable(),
  images: z.array(z.object({ mediaId: z.string().min(1), caption: opt(160) })).max(60),
  featured: z.boolean(),
  published: z.boolean(),
  ...seo,
});
export type ProjectFormInput = z.input<typeof projectFormSchema>;

export const postFormSchema = z
  .object({
    title: req(160),
    slug,
    excerpt: req(300),
    content: z.string().max(200_000),
    coverId: z.string().nullable(),
    categoryId: z.string().nullable(),
    status: z.enum(["DRAFT", "PUBLISHED"]),
    /** yyyy-mm-dd (local date input) */
    publishedAt: z
      .union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)])
      .transform((v) => (v === "" ? null : v))
      .nullable(),
    ...seo,
  })
  .refine((p) => p.status === "DRAFT" || p.content.replace(/<[^>]+>/g, "").trim().length > 0, {
    message: "Para publicar, la nota necesita contenido.",
    path: ["content"],
  });
export type PostFormInput = z.input<typeof postFormSchema>;
