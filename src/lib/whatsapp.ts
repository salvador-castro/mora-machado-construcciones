import type { Phone } from "@/lib/content/schemas";

/**
 * Converts an Argentine number as written locally ("03487-656133", "11 1234-5678",
 * "+54 9 3487 656133") into the wa.me international format (5493487656133).
 * Assumes mobile numbers (WhatsApp) and that the "15" prefix is not included.
 */
export function toWhatsAppNumber(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("549")) return digits;
  if (digits.startsWith("54")) return `549${digits.slice(2)}`;
  if (digits.startsWith("0")) digits = digits.slice(1);
  return `549${digits}`;
}

export function whatsappUrl(number: string, text?: string) {
  const base = `https://wa.me/${toWhatsAppNumber(number)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** tel: href in international format. */
export function telHref(raw: string) {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("54")) return `tel:+${digits}`;
  if (digits.startsWith("0")) digits = digits.slice(1);
  return `tel:+54${digits}`;
}

export function primaryWhatsApp(phones: Phone[]): Phone | undefined {
  return phones.find((p) => p.whatsapp && p.primary) ?? phones.find((p) => p.whatsapp);
}
