import type { ICON_NAMES } from "@/lib/admin/icons";
import {
  Building2,
  Factory,
  Grid3x3,
  Hammer,
  Handshake,
  HardHat,
  KeyRound,
  Landmark,
  Layers,
  Ruler,
  ShieldCheck,
  Sparkles,
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
  Grid3x3,
  Hammer,
  Handshake,
  HardHat,
  KeyRound,
  Landmark,
  Layers,
  Ruler,
  ShieldCheck,
  Sparkles,
  Trees,
  Trophy,
  Wrench,
} satisfies Record<IconNameFromList, LucideIcon>;

type IconNameFromList = (typeof ICON_NAMES)[number];
export type IconName = keyof typeof ICONS;

export function iconByName(name: string | null | undefined): LucideIcon {
  return (name && ICONS[name as IconName]) || Layers;
}
