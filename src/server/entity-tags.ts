import "server-only";
import { TAGS } from "@/lib/content/tags";

/** Public cache tags affected by writes to each model. */
export const ENTITY_TAGS = {
  service: [TAGS.services, TAGS.projects],
  project: [TAGS.projects, TAGS.services],
  projectCategory: [TAGS.categories, TAGS.projects],
  processStep: [TAGS.homeLists],
  valueItem: [TAGS.homeLists],
  highlight: [TAGS.homeLists],
  marqueeItem: [TAGS.homeLists],
  clientLogo: [TAGS.clientLogos],
  testimonial: [TAGS.testimonials, TAGS.projects],
  galleryImage: [TAGS.gallery],
  blogCategory: [TAGS.blog],
  blogPost: [TAGS.blog],
} as const;
