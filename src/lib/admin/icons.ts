/** Icon names selectable in the admin; must match ICONS in components/ui/dynamic-icon. */
export const ICON_NAMES = [
  "Building2",
  "Factory",
  "Hammer",
  "Handshake",
  "HardHat",
  "Landmark",
  "Layers",
  "Ruler",
  "ShieldCheck",
  "Trees",
  "Trophy",
  "Wrench",
] as const;

export const ICON_LABELS: Record<(typeof ICON_NAMES)[number], string> = {
  Building2: "Edificio",
  Factory: "Industria",
  Hammer: "Martillo",
  Handshake: "Apretón de manos",
  HardHat: "Casco",
  Landmark: "Estructura",
  Layers: "Capas",
  Ruler: "Regla",
  ShieldCheck: "Garantía",
  Trees: "Exterior",
  Trophy: "Deporte",
  Wrench: "Llave",
};
