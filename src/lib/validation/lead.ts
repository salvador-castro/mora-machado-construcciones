import { z } from "zod";

/** Contact form schema, validated in the server action (kept out of the client bundle). */
export const leadSchema = z.object({
  name: z.string().trim().min(2, "Ingresá tu nombre").max(120),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d][\d\s()-]{5,24}$/, "Ingresá un teléfono válido"),
  email: z.union([z.literal(""), z.email("Ingresá un email válido").max(200)]).optional(),
  budgetRange: z.string().max(80).optional(),
  message: z.string().trim().min(10, "Contanos un poco más (mínimo 10 caracteres)").max(3000),
  consent: z.literal(true, { error: "Necesitamos tu consentimiento para responderte" }),
  /** Honeypot: must stay empty. */
  website: z.string().max(0).optional(),
  sourcePage: z.string().max(200).optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;
