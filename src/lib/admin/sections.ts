import type { PageContentKey } from "@/lib/content/schemas";

/** Public URL where each content block can be seen. */
export const SECTION_PREVIEW: Record<PageContentKey, string> = {
  "home.hero": "/#inicio",
  "home.intro": "/",
  "home.services": "/#servicios",
  "home.projects": "/#obras",
  "home.process": "/#proceso",
  "home.values": "/",
  "home.featured": "/",
  "home.gallery": "/#galeria",
  "home.cta": "/",
  "home.contact": "/#contacto",
  about: "/nosotros",
  contact: "/contacto",
  "services.index": "/servicios",
  "projects.index": "/obras",
  "blog.index": "/blog",
  details: "/servicios",
  "legal.privacy": "/legales/privacidad",
};

export const HOME_SECTION_KEYS: PageContentKey[] = [
  "home.hero",
  "home.intro",
  "home.projects",
  "home.services",
  "home.process",
  "home.values",
  "home.featured",
  "home.gallery",
  "home.cta",
  "home.contact",
];

export const PAGE_KEYS: PageContentKey[] = [
  "about",
  "contact",
  "services.index",
  "projects.index",
  "blog.index",
  "details",
  "legal.privacy",
];

/** Where list-type content of a home block is edited (beyond its header). */
export const SECTION_RELATED: Partial<Record<PageContentKey, { label: string; href: string }[]>> = {
  "home.intro": [
    { label: "Highlights y marquee", href: "/admin/listas" },
    { label: "Logos de clientes", href: "/admin/logos" },
  ],
  "home.projects": [{ label: "Obras destacadas", href: "/admin/obras" }],
  "home.services": [{ label: "Servicios", href: "/admin/servicios" }],
  "home.process": [{ label: "Pasos del proceso", href: "/admin/listas" }],
  "home.values": [{ label: "Diferenciales", href: "/admin/listas" }],
  "home.featured": [{ label: "Obras destacadas", href: "/admin/obras" }],
  "home.gallery": [{ label: "Imágenes de la galería", href: "/admin/galeria" }],
  "home.cta": [{ label: "Testimonios", href: "/admin/testimonios" }],
  "home.contact": [{ label: "Teléfonos y datos", href: "/admin/configuracion" }],
};
