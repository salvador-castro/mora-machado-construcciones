# Mora Machado Construcciones — sitio + admin

Sitio público + panel `/admin` para una constructora familiar de Zárate (Bs. As.). Todo el contenido visible sale de la base de datos; no hardcodear texto de negocio en componentes.

@AGENTS.md

## Stack

- Next.js 16 (App Router, `cacheComponents` + `partialPrefetching`, Turbopack) · React 19 · TypeScript strict
- Tailwind CSS v4 (tokens en CSS variables, ver `DESIGN.md`)
- Prisma 7 (`prisma-client` generator → `src/generated/prisma`, driver adapter `@prisma/adapter-pg`) + PostgreSQL 16
- zod v4 (schemas compartidos entre formularios y server actions)
- Auth propia: argon2 + JWT (`jose`) en cookie httpOnly + tabla `Session` (revocable). Roles `ADMIN` / `EDITOR`.
- pnpm 12, Node 22 (`.nvmrc`), ESM (`"type": "module"`)

## Comandos

```bash
pnpm dev                 # http://localhost:3000
pnpm build && pnpm start
pnpm lint | pnpm typecheck | pnpm format
pnpm db:migrate          # prisma migrate dev
pnpm db:seed             # contenido inicial (solo en DB vacía; `pnpm prisma db seed -- --force` reinicia contenido, conserva users y leads)
pnpm media:import-legacy # importa las 11 fotos del sitio viejo (desde git 39b8b90 o el sitio en vivo)
pnpm db:studio
pnpm db:check            # verifica conexión a Postgres
pnpm create-admin        # crea/resetea un usuario ADMIN (interactivo)
pnpm db:cleanup          # borra sesiones y rate limits vencidos (cron diario en prod)
pnpm brand:build         # regenera logo/favicon WebP desde assets/brand/logo-original.png
pnpm brand:import        # los sube a Medios y los asigna en Configuración si están vacíos
pnpm test:e2e            # Playwright (projects: public, public-mobile, admin)
pnpm docs:pdf            # regenera docs/guia-deploy-vps.pdf y docs/Donweb-VPS-rodo.pdf
```

## Entorno local

- Postgres 16 vía Homebrew en **puerto 5433** (`brew services start postgresql@16`); el Postgres 14 del sistema queda en 5432 sin tocar.
- DB `mora_dev`, usuario `mora` / `mora_dev`. Variables en `.env` (documentadas en `.env.example`). `UPLOAD_DIR` debe ser **absoluto** (el server standalone corre desde otra carpeta). `.env.local` solo tiene el token OIDC de Vercel del sitio viejo — no usar.

## Convenciones

- Código, nombres y comentarios en inglés. **Toda la UI (sitio y admin) en español rioplatense.**
- Lecturas públicas en `src/lib/content/queries.ts` con `'use cache'` + `cacheLife("max")` + `cacheTag` (tags en `src/lib/content/tags.ts`). Las server actions del admin llaman `updateTag(tag)` (read-your-writes inmediato). Todo lo que embebe media lleva también `TAGS.media`.
- Imágenes públicas: `<MediaImage>` (srcset desde variantes). `/uploads/*` lo sirve Nginx en prod y `src/app/uploads/[...path]/route.ts` en dev.
- No usar `new Date()`/`Math.random()` en render: Next 16 lo prohíbe en el shell estático (ver `CurrentYear`, cacheado con `cacheLife("days")`).
- Rutas `[slug]`: `generateStaticParams` debe devolver ≥1 param (si no hay, `{ slug: "_" }` → 404). Se hace `await params` + `notFound()` antes de cualquier Suspense, por eso `export const instant = false`. **En producción eso no alcanza para un 404 real** (el layout ya empezó a streamear con 200 → soft 404): `src/proxy.ts` chequea el slug de `/servicios|obras|blog/:slug` contra la DB (`publicSlugExists`) y reescribe a `/404` antes de renderizar; con Draft Mode deja pasar. Si se agrega otra ruta de detalle, sumarla ahí. En dev el 404 sale igual, así que esto solo se ve con build de producción.
- Rich text: `<RichText>` sanitiza con `src/lib/sanitize.ts` (solo imágenes de `/uploads/`). Estilos en `.rich-text` (globals.css).
- Textos de títulos de secciones en páginas de detalle: `PageContent` key `details`. `pnpm db:seed` sin `--force` crea las keys de `PageContent` que falten **y completa campos nuevos** de keys existentes (sin pisar ediciones): al agregar un campo a un schema de `PageContent`, poner su default en `prisma/seed.ts` y correr `pnpm db:seed`.
- Admin (`src/app/admin`): `proxy.ts` hace chequeo optimista del JWT; la autorización real es `requireUser(role?)` (`src/lib/auth/session.ts`) en **cada** página y server action. El layout `(panel)` lee la sesión dentro de `<Suspense>`. **Toda página del admin exporta `export const instant = false`** (Next valida cada page por separado).
- Sesión: JWT HS256 (`jose`, `AUTH_SECRET`) en cookie `mm_session` + fila `Session` revocable. Resetear contraseña o desactivar usuario invalida sesiones. `getCurrentUser` llama `connection()` (jose usa la hora actual).
- shadcn/ui: componentes en `src/components/admin/ui` (alias en `components.json`), importan `cn` de `@/lib/cn`. Tokens shadcn en `:root` (globals.css; los portales de Radix quedan fuera de `.admin-theme`). No usar `bg-accent` de shadcn: `accent` es el color de marca del sitio; para hovers usar `bg-muted`.
- Admin de prueba local: `DEV_ADMIN_EMAIL` / `DEV_ADMIN_PASSWORD` en `.env`. Crear/resetear admin: `pnpm create-admin`.
- Si el CSS no refleja un cambio en dev, puede ser caché de Turbopack: reiniciar `pnpm dev`.
- El hero no usa `<Reveal>` (es el LCP; debe pintarse sin JS).
- Al revisar en Chrome automatizado la pestaña está `hidden`: smooth scroll y animaciones no avanzan — no es un bug.
- Server actions en `src/server/actions/*`, siempre `requireRole()` + validación zod.
- Contenido de secciones en `PageContent` (key → JSON) validado por un schema zod por key (`src/lib/content/schemas.ts`); el admin genera el formulario desde ese schema.
- Entidades listables tienen `order` (drag & drop) y `published`.
- Imágenes: `src/lib/media/process.ts` (sharp, valida formato real, variantes WebP en `UPLOAD_DIR/yyyy/mm/<uuid>-<w>.webp`, sin upscaling). Media referenciada desde JSON de `PageContent` (`*Id`) no tiene FK: el chequeo de uso debe escanear esos JSON.
- Scripts CLI importan `@/lib/db-client` (no `@/lib/db`, que es `server-only`).
- Texto marcado `// DRAFT` en `prisma/seed.ts` fue redactado por nosotros; pendiente de revisión del cliente (ver `SiteSettings.pendingTodos`).
- HTML de editor rico siempre sanitizado antes de renderizar.
- Commit por fase en `develop`. `main` conserva el sitio estático viejo (HTML + 11 imágenes en `public/img/`) hasta el lanzamiento.

## Despliegue

VPS DonWeb Ubuntu 24.04, SSH puerto 5086, usuario `salva`. La web nueva **no** se publica en Vercel: hoy el sitio viejo sigue en Vercel y se migra al VPS **cuando el cliente dé el OK** (antes, prueba en `nuevo.moramachadoconstrucciones.com` con `SITE_NOINDEX=true`). Guía paso a paso (nivel junior) en `deploy/README.md`.

- Dominio registrado en **GoDaddy**; **el DNS está en Vercel** (nameservers `ns*.vercel-dns.com`): los registros se editan en Vercel → Domains. Al lanzar, quitar el dominio del **proyecto** viejo, nunca de la cuenta (se borraría la zona DNS).
- Casillas info@/sofia@/rodo@ en **Webempresa**. A oct-2026 el dominio **no tiene MX**: hay que cargar los MX/SPF/DKIM de Webempresa en el DNS de Vercel (paso 12 de la guía). Resend usa `send` y `resend._domainkey` (no toca la raíz).
- El repo es público hoy y pasa a **privado** con el VPS: el VPS clona por SSH con una deploy key de solo lectura.
- Backups externos a Google Drive con rclone (`gdrive:mora-backups`, scope `drive.file`, retención 90 días).

- Releases como git worktrees en `/var/www/mora/releases`, `current` → activa, `shared/.env`, `uploads/`, `backups/`. `deploy/deploy.sh [rama]`: fetch → worktree → install → `migrate deploy` → `db:seed` (idempotente; en DB vacía carga todo) → build → copia `public` y `.next/static` al standalone → `pm2 reload` → `/healthz`, con rollback.
- PM2: **una sola instancia fork** (la caché de `'use cache'`/`updateTag` vive en el proceso). `node --env-file=shared/.env`, `HOSTNAME=127.0.0.1`.
- Nginx: `X-Real-IP` obligatorio (rate limiting). **Sin `X-Forwarded-Proto`**: con `https` Next 16 trata el rewrite a `/404` de `proxy.ts` como fetch externo y da 500. `/uploads/` lo sirve Nginx (solo `.webp`). Next manda `X-Accel-Buffering: no` (streaming).
- `SITE_URL` y `SITE_NOINDEX` se leen en el build. Staging en subdominio con `SITE_NOINDEX=true`.
- Cron: backup 03:15 (`deploy/backup.sh`, copia externa con rclone si `BACKUP_RCLONE_REMOTE`), `db:cleanup` 03:45.
- CI (`.github/workflows/ci.yml`): format, lint, typecheck, seed, build y e2e contra el server standalone. Para correr e2e contra un Nginx local con certificado propio: `E2E_BASE_URL=https://… E2E_IGNORE_HTTPS=true`.
- Logo: `assets/brand/` (fuente + WebP generados). El header/footer muestran el «MM» (`logo-mark`) + el nombre en texto (la palabra del logo completo no se lee sobre el footer `stone`). Favicon con fondo ink (la M blanca desaparece sobre blanco a 32 px); `/site-icon` lo sirve y `public/favicon.ico` es el fallback.

## Decisiones

- Next 16 en vez de 15 (estable actual). Middleware → `src/proxy.ts`.
- Prisma 7.10 (8 todavía en RC).
- Auth propia en vez de Auth.js v5 (beta).
- Imágenes: variantes WebP pre-generadas con sharp (480/960/1600/2400) + `srcset` propio; sin optimizador de Next en el VPS.
- Rate limiting en tabla Postgres (sin Redis).
- Emails con Resend + React Email (decisión del cliente; reemplazó a SMTP/nodemailer). Resend solo envía: las casillas info@, sofia@ y rodo@ siguen en su proveedor y el MX raíz no se toca.
- WhatsApp principal (confirmado por el cliente): 03487-656133 (= +54 9 3487 65-6133); es el **único** número publicado: el 03487-514196 no se muestra en ningún lado (pedido del cliente). Email principal: info@moramachadoconstrucciones.com (público y destinatario de las consultas). Colores: se queda el acento actual por ahora. Todo link de WhatsApp del sitio lleva texto que dice que escriben **desde la web** (`SiteSettings.whatsappMessage` en header/footer/contacto/botón flotante; textos fijos en la página de servicio y tras enviar el formulario). Los emails de consultas no llevan copia a nadie.

## Fases

F1 setup ✅ · F2 design system ✅ · F3 schema + seed ✅ · F4 home ✅ · F5 páginas internas ✅ · F6 auth + admin layout ✅ · F7 CRUDs/medios/settings ✅ · F8 contacto + leads ✅ · F9 SEO/a11y/perf/seguridad ✅ · F10 tests + deploy ✅ (código; falta ejecutarlo en el VPS, ver `deploy/README.md`)

## Admin: editores de entidades

- Servicios, obras y notas tienen editor de página completa (`src/components/admin/entities/*-form.tsx`) con piezas compartidas en `src/components/admin/form/entity-fields.tsx` (título+slug, SEO, rich text, ítems título/descripción, vista previa, borrar). Al crear, `router.replace` al `[id]`; la página remonta el form con `key={updatedAt}`.
- Listados ordenables de servicios/obras: `SortableEntityList`. Blog: tabs notas/categorías (`/admin/blog?tab=categorias`).
- Usuarios (`/admin/usuarios`, solo ADMIN): no se puede quitar el rol/desactivar/borrar a uno mismo ni al último admin activo; cambiar rol, desactivar o resetear contraseña cierra sus sesiones. Política de contraseñas client-safe en `src/lib/auth/password-policy.ts` (`password.ts` usa argon2, solo server).
- Testing interactivo del admin: Playwright (`pnpm test:e2e --project=admin`); la pestaña de Chrome automatizada queda `hidden` y React no revela el contenido streameado.

## Contacto y consultas

- Formulario público (`ContactForm`) → server action `submitLead` (`src/server/actions/contact.ts`): honeypot `website` (responde ok sin guardar), rate limit por IP hasheada (5 / 15 min en prod), Turnstile opcional (solo si están `TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY`), >3 links → status `SPAM`. Tras guardar ofrece seguir por WhatsApp (no se abre solo: el popup se bloquea después de un await).
- Email por **Resend** (no SMTP/nodemailer): módulo único `src/lib/email.ts` (`sendLeadNotification`, `sendTestEmail`), plantillas React Email en `src/emails/` (HTML + texto plano). Destinatarios: `SiteSettings.notificationEmails`, fallback `MAIL_TO_DEFAULT`; `replyTo` = email del cliente; asunto «Nueva consulta web – {nombre} – {teléfono}». Se envía con `after()`; el resultado queda en `Lead.emailStatus` (SENT/FAILED) + `emailInfo` (id de Resend o error) y el detalle de la consulta ofrece «Reintentar envío». Sin `RESEND_API_KEY` en dev el email se imprime en consola; en prod sin key → FAILED. Acuse al cliente opcional con `LEAD_CONFIRMATION_EMAIL=true`. Alta del dominio/DNS en `deploy/README.md`.
- `src/lib/email.ts` usa `createElement` (no JSX) para mantener la extensión `.ts`. React Email (`react-dom/server`) funciona en server actions/`after()` de Next, pero **no** en scripts con `--conditions=react-server`.
- Admin: `/admin/consultas` (filtro por estado en `?estado=`, búsqueda `?q=`, paginado), detalle con estado/notas/borrar, export CSV en `/admin/consultas-export` (mismos filtros, BOM UTF-8, anti CSV-injection).
- e2e: Next 16 deja la página anterior oculta en el DOM (Activity) → en Playwright preferir `getByRole` (ignora lo oculto) sobre `getByLabel`/`getByText`.

## SEO, seguridad y rendimiento (F9)

- `sitemap.xml` y `robots.txt` (`src/app/sitemap.ts`, `robots.ts`); el sitemap sale de `getSitemapData()` (cacheado, se invalida con los tags de contenido).
- JSON-LD con `<JsonLd>` (`src/components/seo/json-ld.tsx`): `GeneralContractor` en `SiteChrome` (desde Settings), `BreadcrumbList` en `<Breadcrumbs>`, `BlogPosting` en notas.
- Favicon/apple-touch: `/site-icon?s=32|180|192|512` (favicon de Settings recortado con sharp, o monograma sobre el acento). La URL lleva `?v=` para cache largo.
- Cabeceras de seguridad + CSP en `next.config.ts` (sin nonces: las páginas se prerenderizan → `'unsafe-inline'` en scripts). Permitidos: Google Maps y Turnstile en `frame-src`. HSTS y `upgrade-insecure-requests` solo si `SITE_URL` es https. Si se agrega un servicio externo (script/iframe/fetch), sumarlo a la CSP.
- Bundle público sin zod ni librerías de animación: el formulario de contacto valida en la server action. No importar `@/lib/validation/*` (zod) desde componentes cliente del sitio.
- Textos de negocio editables agregados en F9: `home.contact.consentText` (casilla de consentimiento) y `SiteSettings.whatsappMessage` (botón flotante).
- Tests: `public.a11y` / `admin.a11y` (axe WCAG A/AA) y `public.seo`. Lighthouse (móvil, build de prod): a11y/best-practices/SEO 100; perf 92–99.

## Estado actual y próximos pasos (16/10/2026)

- Código terminado (F1–F10) y **`develop` en GitHub**. Sitio viejo sigue en Vercel; `main` = sitio viejo hasta el lanzamiento.
- Documentación para el deploy en `docs/`: `guia-deploy-vps.pdf` (= `deploy/README.md`), `Donweb-VPS-rodo.md` / `.pdf` (contexto completo + copias de `deploy/`, para el proyecto "Donweb-VPS-rodo" de Claude online). Regenerar PDFs: `pnpm docs:pdf`. Si cambia algo de `deploy/` o del estado, actualizar también `docs/Donweb-VPS-rodo.md` (es una copia, no se genera sola).
- Próximo: configurar el VPS siguiendo `deploy/README.md` (pasos 3–11, rama `develop`, en `nuevo.moramachadoconstrucciones.com`); cargar MX/SPF/DKIM de Webempresa en el DNS de Vercel (hoy **no hay MX**); Resend; backups a Google Drive; lanzamiento con OK del cliente (paso 16).
- No probado aún en servidor real: reload/rollback con PM2, workflow de CI, certbot/DNS.
- Pendientes de contenido del cliente: fotos en alta, revisar textos `// DRAFT`, rangos de presupuesto, alts de galería, color de acento (por ahora queda el actual).

## Entorno: iCloud

El proyecto vive en `~/Desktop/proyects/...` con "Escritorio y Documentos" de iCloud **desactivado**. Si aparecen archivos/carpetas con sufijo " 2" (`README 2.md`, `models 2`, `node_modules/x 2`), son copias de conflicto de iCloud: reinstalar deps (`rm -rf node_modules src/generated && pnpm install`) y borrar las copias.
