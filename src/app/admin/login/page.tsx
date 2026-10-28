import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MediaImage } from "@/components/ui/media-image";
import { getMedia, getPageContent, getSettings } from "@/lib/content/queries";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Ingresar" };

export default async function LoginPage() {
  const [settings, hero] = await Promise.all([getSettings(), getPageContent("home.hero")]);
  const photo = await getMedia(hero?.backgroundId);

  return (
    <main className="grid flex-1 lg:grid-cols-2">
      {/* Brand panel: the site's hero photo, desktop only. */}
      <aside className="relative hidden overflow-hidden bg-ink text-paper lg:block">
        {photo && (
          <MediaImage
            media={photo}
            alt=""
            sizes="50vw"
            className="absolute inset-0 size-full object-cover opacity-50"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-ink via-ink/40 to-transparent" />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Brand logo={settings.logo} name={settings.brandName} />
          <p className="max-w-md text-2xl leading-snug font-medium tracking-tight text-balance">
            {settings.tagline ?? settings.brandName}
          </p>
        </div>
      </aside>

      <div className="flex flex-col p-6 sm:p-10">
        {/* No prefetch: it would preload the home hero photo on the login page. */}
        <Link
          href="/"
          prefetch={false}
          className="inline-flex items-center gap-1.5 self-start text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Volver al sitio
        </Link>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <div className="mb-8 lg:hidden">
            <Brand logo={settings.logo} name={settings.brandName} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Ingresá al panel</h1>
          <p className="mt-1.5 mb-8 text-sm text-muted-foreground">
            Usá el email y la contraseña de tu usuario.
          </p>
          <LoginForm />
          <p className="mt-8 text-sm text-muted-foreground">
            ¿Olvidaste la contraseña? Pedile a un administrador que te la restablezca.
          </p>
        </div>
      </div>
    </main>
  );
}

function Brand({
  logo,
  name,
}: {
  logo: Awaited<ReturnType<typeof getSettings>>["logo"];
  name: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {logo ? (
        // Dark chip: the logo's white M disappears on the light form side.
        <span className="bg-ink p-1.5">
          <MediaImage media={logo} alt="" sizes="96px" placeholder={false} className="h-7 w-auto" />
        </span>
      ) : (
        <span className="inline-flex size-9 items-center justify-center bg-accent text-sm font-semibold text-accent-fg">
          MM
        </span>
      )}
      <div className="leading-tight">
        <p className="text-[15px] font-medium">{name}</p>
        <p className="text-xs opacity-70">Panel de administración</p>
      </div>
    </div>
  );
}
