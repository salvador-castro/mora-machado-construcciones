"use client";

import { useId, useState, useTransition } from "react";
import Link from "next/link";
import Script from "next/script";
import { Check } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { leadSchema, leadToWhatsAppText, type LeadInput } from "@/lib/validation/lead";
import { whatsappUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/cn";
import { submitLead } from "@/server/actions/contact";

type FieldErrors = Partial<Record<keyof LeadInput, string>>;

declare global {
  interface Window {
    turnstile?: { reset: (el?: string | HTMLElement) => void };
  }
}

const inputClass =
  "w-full border border-ink/24 bg-paper px-4 py-3 text-ink placeholder:text-ink/40 transition-colors hover:border-ink/48 focus:border-ink focus:outline-none aria-invalid:border-red-700";

/**
 * Contact form: validates on the client, saves the lead via server action
 * (which emails the team) and then offers to continue on WhatsApp.
 */
export function ContactForm({
  budgetRanges,
  whatsappNumber,
  sourcePage = "/",
  turnstileSiteKey,
}: {
  budgetRanges: string[];
  whatsappNumber: string | null;
  sourcePage?: string;
  turnstileSiteKey?: string;
}) {
  const uid = useId();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState<LeadInput | null>(null);
  const [pending, startTransition] = useTransition();

  function focusField(formEl: HTMLFormElement, name: string | undefined) {
    if (name) formEl.querySelector<HTMLElement>(`[name="${name}"]`)?.focus();
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const raw = {
      name: form.get("name"),
      phone: form.get("phone"),
      email: form.get("email") ?? "",
      budgetRange: form.get("budgetRange") || undefined,
      message: form.get("message"),
      consent: form.get("consent") === "on",
      website: form.get("website") ?? "",
      sourcePage,
    };
    // Honeypot filled: let the server swallow it and show the normal success state.
    if (raw.website) {
      startTransition(async () => {
        await submitLead(raw);
        setSent(raw as LeadInput);
      });
      return;
    }
    const parsed = leadSchema.safeParse(raw);

    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof LeadInput;
        next[key] ??= issue.message;
      }
      setErrors(next);
      focusField(formEl, Object.keys(next)[0]);
      return;
    }

    setErrors({});
    setFormError(null);
    const token = form.get("cf-turnstile-response");
    startTransition(async () => {
      try {
        const res = await submitLead(parsed.data, typeof token === "string" ? token : undefined);
        if (res.ok) {
          setSent(parsed.data);
          return;
        }
        setErrors((res.fieldErrors ?? {}) as FieldErrors);
        setFormError(res.error);
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
