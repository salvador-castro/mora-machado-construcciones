import {
  Building2,
  Factory,
  Hammer,
  Handshake,
  HardHat,
  Landmark,
  Layers,
  Ruler,
  ShieldCheck,
  Trees,
  Trophy,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/**
 * Whitelist of icons selectable from the admin (stored by name in the DB).
 * Keep in sync with the admin icon picker; unknown names fall back to Layers.
 */
export const ICONS = {
  Building2,
  Factory,
  Hammer,
  Handshake,
  HardHat,
  Landmark,
  Layers,
  Ruler,
  ShieldCheck,
  Trees,
  Trophy,
  Wrench,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export function iconByName(name: string | null | undefined): LucideIcon {
  return (name && ICONS[name as IconName]) || Layers;
}
