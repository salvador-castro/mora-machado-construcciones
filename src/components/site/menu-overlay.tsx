"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "./nav-links";
import { cn } from "@/lib/cn";

type ContactLine = { label: string; value: string; href?: string };

/** Hamburger button + full-screen navigation overlay with focus trap and Esc to close. */
export function MenuOverlay({ contact }: { contact: ContactLine[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  // Close on route change.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel?.querySelector<HTMLElement>("a, button")?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls="site-menu"
        onClick={() => setOpen(true)}
        className="inline-flex size-10 items-center justify-center border border-paper/24 transition-colors hover:border-paper"
      >
        <Menu aria-hidden className="size-5" />
        <span className="sr-only">Abrir menú</span>
      </button>

      <div
        id="site-menu"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menú principal"
        hidden={!open}
        className="fixed inset-0 z-50 overflow-y-auto tone-dark"
      >
        <div className="container-site flex min-h-full flex-col">
          <div className="flex h-14 items-center justify-end">
            <button
              type="button"
              onClick={close}
              className="inline-flex size-10 items-center justify-center border border-paper/24 transition-colors hover:border-paper"
            >
              <X aria-hidden className="size-5" />
              <span className="sr-only">Cerrar menú</span>
            </button>
          </div>

          <div className="grid flex-1 content-center gap-12 py-12 lg:grid-cols-12">
            <nav aria-label="Principal" className="lg:col-span-8">
              <ul className="space-y-1">
                {NAV_LINKS.map((link, i) => {
                  const active =
                    link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group inline-flex items-baseline gap-4 py-1 text-h2 transition-colors",
                          active ? "text-accent" : "hover:text-accent",
                        )}
                      >
                        <span className="text-eyebrow text-paper/48">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="space-y-6 border-t border-paper/16 pt-8 lg:col-span-4 lg:self-end lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
              {contact.map((c) => (
                <div key={c.label}>
                  <p className="text-eyebrow text-paper/48">{c.label}</p>
                  {c.href ? (
                    <a href={c.href} className="text-h4 hover:text-accent">
                      {c.value}
                    </a>
                  ) : (
                    <p className="text-h4">{c.value}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
