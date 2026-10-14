/** Fields used to prefill a WhatsApp message from a contact form submission. */
export type LeadMessageFields = {
  name: string;
  phone: string;
  email?: string;
  budgetRange?: string;
  message: string;
};

/** WhatsApp message body built from a lead (same format as the legacy site). */
export function leadToWhatsAppText(lead: LeadMessageFields) {
  const lines = [
    "Hola, les escribo desde la web. Quiero hacer una consulta.",
    "",
    `Nombre: ${lead.name}`,
    `Teléfono: ${lead.phone}`,
    lead.email ? `Email: ${lead.email}` : null,
    lead.budgetRange ? `Presupuesto: ${lead.budgetRange}` : null,
    "",
    lead.message,
  ];
  return lines.filter((l) => l !== null).join("\n");
}
