"use client";

import { useId, useState, useTransition } from "react";
import Link from "next/link";
import Script from "next/script";
import { Check } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { leadToWhatsAppText, type LeadMessageFields } from "@/lib/leads/whatsapp-text";
import { whatsappUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/cn";
import { submitLead } from "@/server/actions/contact";

type FieldName = "name" | "phone" | "email" | "budgetRange" | "message" | "consent";
type FieldErrors = Partial<Record<FieldName, string>>;

declare global {
  interface Window {
    turnstile?: { reset: (el?: string | HTMLElement) => void };
  }
}

const inputClass =
  "w-full border border-ink/24 bg-paper px-4 py-3 text-ink placeholder:text-ink/64 transition-colors hover:border-ink/48 focus:border-ink focus:outline-none aria-invalid:border-red-700";

/**
 * Contact form: the server action validates (zod stays out of the client
 * bundle), saves the lead, emails the team; then we offer to continue on WhatsApp.
 */
export function ContactForm({
  budgetRanges,
  whatsappNumber,
  sourcePage = "/",
  consentText,
  turnstileSiteKey,
}: {
  budgetRanges: string[];
  whatsappNumber: string | null;
  sourcePage?: string;
  consentText: string;
  turnstileSiteKey?: string;
}) {
  const uid = useId();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState<LeadMessageFields | null>(null);
  const [pending, startTransition] = useTransition();

  function focusField(formEl: HTMLFormElement, name: string | undefined) {
    if (name) formEl.querySelector<HTMLElement>(`[name="${name}"]`)?.focus();
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const str = (k: string) => String(form.get(k) ?? "").trim();
    const data = {
      name: str("name"),
      phone: str("phone"),
      email: str("email"),
      budgetRange: str("budgetRange") || undefined,
      message: str("message"),
      consent: form.get("consent") === "on",
      website: str("website"),
      sourcePage,
    };
    const token = form.get("cf-turnstile-response");

    setFormError(null);
    startTransition(async () => {
      try {
        const res = await submitLead(data, typeof token === "string" ? token : undefined);
        if (res.ok) {
          setErrors({});
          setSent(data);
          return;
        }
        setErrors((res.fieldErrors ?? {}) as FieldErrors);
        // Field errors speak for themselves; the generic message is for the rest.
        setFormError(res.fieldErrors ? null : res.error);
        focusField(formEl, Object.keys(res.fieldErrors ?? {})[0]);
      } catch {
        setFormError("No pudimos enviar la consulta. Probá de nuevo o escribinos por WhatsApp.");
      }
      window.turnstile?.reset();
    });
  }

  if (sent) {
    return (
      <div role="status" className="space-y-4 py-8">
        <span className="inline-flex size-12 items-center justify-center bg-accent text-accent-fg">
          <Check aria-hidden className="size-6" />
        </span>
        <p className="text-h4">¡Gracias! Recibimos tu consulta.</p>
        <p className="text-ink/64">Te respondemos a la brevedad.</p>
        <div className="flex flex-wrap gap-3">
          {whatsappNumber && (
            <ButtonLink
              href={whatsappUrl(whatsappNumber, leadToWhatsAppText(sent))}
              target="_blank"
              rel="noopener noreferrer"
              arrow
            >
              Seguir por WhatsApp
            </ButtonLink>
          )}
          <Button variant="secondary" onClick={() => setSent(null)}>
            Enviar otra consulta
          </Button>
        </div>
      </div>
    );
  }

  const field = (name: FieldName) => ({
    id: `${uid}-${name}`,
    name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${uid}-${name}-error` : undefined,
  });
  const error = (name: FieldName) =>
    errors[name] && (
      <p id={`${uid}-${name}-error`} className="mt-1.5 text-sm text-red-800">
        {errors[name]}
      </p>
    );
  const label = (name: FieldName, text: string, required = false) => (
    <label htmlFor={`${uid}-${name}`} className="mb-1.5 block text-sm font-medium">
      {text}
      {required ? (
        <span aria-hidden className="text-ink/64">
          {" "}
          *
        </span>
      ) : (
        <span className="text-ink/64"> (opcional)</span>
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
            {consentText} Ver{" "}
            <Link href="/legales/privacidad" className="underline underline-offset-2">
              política de privacidad
            </Link>
            .
          </label>
        </div>
        {error("consent")}
      </div>
      {turnstileSiteKey && (
        <div className="sm:col-span-2">
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
          <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-language="es" />
        </div>
      )}
      {formError && (
        <p role="alert" className="text-sm text-red-800 sm:col-span-2">
          {formError}
        </p>
      )}
      <div className="sm:col-span-2">
        <Button type="submit" arrow className="w-full sm:w-auto" disabled={pending}>
          {pending ? "Enviando…" : "Enviar consulta"}
        </Button>
      </div>
    </form>
  );
}
