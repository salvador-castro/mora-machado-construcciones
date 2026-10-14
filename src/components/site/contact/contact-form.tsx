"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { leadSchema, leadToWhatsAppText, type LeadInput } from "@/lib/validation/lead";
import { whatsappUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/cn";

type FieldErrors = Partial<Record<keyof LeadInput, string>>;

const inputClass =
  "w-full border border-ink/24 bg-paper px-4 py-3 text-ink placeholder:text-ink/40 transition-colors hover:border-ink/48 focus:border-ink focus:outline-none aria-invalid:border-red-700";

/**
 * Contact form. F4: validates and opens WhatsApp (legacy behavior).
 * TODO(F8): submit via server action (save Lead + email) before opening WhatsApp.
 */
export function ContactForm({
  budgetRanges,
  whatsappNumber,
  sourcePage = "/",
}: {
  budgetRanges: string[];
  whatsappNumber: string | null;
  sourcePage?: string;
}) {
  const uid = useId();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = leadSchema.safeParse({
      name: form.get("name"),
      phone: form.get("phone"),
      email: form.get("email") ?? "",
      budgetRange: form.get("budgetRange") || undefined,
      message: form.get("message"),
      consent: form.get("consent") === "on",
      website: form.get("website") ?? "",
      sourcePage,
    });

    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof LeadInput;
        next[key] ??= issue.message;
      }
      setErrors(next);
      const first = e.currentTarget.querySelector<HTMLElement>(`[name="${Object.keys(next)[0]}"]`);
      first?.focus();
      return;
    }

    setErrors({});
    if (whatsappNumber) {
      window.open(
        whatsappUrl(whatsappNumber, leadToWhatsAppText(parsed.data)),
        "_blank",
        "noopener",
      );
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div role="status" className="space-y-4 py-8">
        <span className="inline-flex size-12 items-center justify-center bg-accent text-accent-fg">
          <Check aria-hidden className="size-6" />
        </span>
        <p className="text-h4">¡Gracias! Recibimos tu consulta.</p>
        <p className="text-ink/64">Te respondemos por WhatsApp a la brevedad.</p>
        <Button variant="secondary" onClick={() => setSent(false)}>
          Enviar otra consulta
        </Button>
      </div>
    );
  }

  const field = (name: keyof LeadInput) => ({
    id: `${uid}-${name}`,
    name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${uid}-${name}-error` : undefined,
  });
  const error = (name: keyof LeadInput) =>
    errors[name] && (
      <p id={`${uid}-${name}-error`} className="mt-1.5 text-sm text-red-800">
        {errors[name]}
      </p>
    );
  const label = (name: keyof LeadInput, text: string, required = false) => (
    <label htmlFor={`${uid}-${name}`} className="mb-1.5 block text-sm font-medium">
      {text}
      {required ? (
        <span aria-hidden className="text-ink/48">
          {" "}
          *
        </span>
      ) : (
        <span className="text-ink/48"> (opcional)</span>
      )}
    </label>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
      {/* Honeypot — hidden from people, tempting for bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          No completar
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div>
        {label("name", "Nombre", true)}
        <input {...field("name")} autoComplete="name" required className={inputClass} />
        {error("name")}
      </div>
      <div>
        {label("phone", "Teléfono", true)}
        <input
          {...field("phone")}
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          required
          className={inputClass}
        />
        {error("phone")}
      </div>
      <div>
        {label("email", "Email")}
        <input {...field("email")} type="email" autoComplete="email" className={inputClass} />
        {error("email")}
      </div>
      {budgetRanges.length > 0 && (
        <div>
          {label("budgetRange", "Presupuesto estimado")}
          <select {...field("budgetRange")} defaultValue="" className={cn(inputClass, "h-[50px]")}>
            <option value="">Elegí una opción</option>
            {budgetRanges.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="sm:col-span-2">
        {label("message", "Contanos sobre tu proyecto", true)}
        <textarea {...field("message")} rows={5} required className={inputClass} />
        {error("message")}
      </div>
      <div className="sm:col-span-2">
        <div className="flex items-start gap-3">
          <input
            {...field("consent")}
            type="checkbox"
            required
            className="mt-0.5 size-5 shrink-0 accent-ink"
          />
          <label htmlFor={`${uid}-consent`} className="text-sm text-ink/80">
            Acepto que Mora Machado Construcciones guarde mis datos para contactarme. Ver{" "}
            <Link href="/legales/privacidad" className="underline underline-offset-2">
              política de privacidad
            </Link>
            .
          </label>
        </div>
        {error("consent")}
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" arrow className="w-full sm:w-auto">
          Enviar consulta
        </Button>
      </div>
    </form>
  );
}
