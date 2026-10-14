/** Cache tags shared by public reads (cacheTag) and admin writes (updateTag). */
export const TAGS = {
  settings: "settings",
  page: (key: string) => `page:${key}`,
  media: "media",
  services: "services",
  projects: "projects",
  categories: "project-categories",
  homeLists: "home-lists",
  gallery: "gallery",
  testimonials: "testimonials",
  clientLogos: "client-logos",
  blog: "blog",
} as const;
