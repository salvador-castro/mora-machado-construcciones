/** Primary navigation (structural, not business content). */
const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/servicios", label: "Servicios" },
  { href: "/obras", label: "Obras" },
  { href: "/blog", label: "Blog" },
  { href: "/contacto", label: "Contacto" },
] as const;

export type NavLink = (typeof LINKS)[number];

/** The blog link only shows while there is at least one published post. */
export function navLinks({ blog }: { blog: boolean }): NavLink[] {
  return LINKS.filter((l) => blog || l.href !== "/blog");
}
