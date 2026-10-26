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
pnpm docs:pdf            # regenera docs/Donweb-VPS-rodo.md (partes 2–3) y los PDFs de docs/
pnpm content:client-answers # aplica las respuestas del cuestionario del cliente a una base existente (una sola vez)
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
- Texto marcado `// DRAFT` en `prisma/seed.ts` y `prisma/content/client-answers.ts` fue redactado por nosotros; pendiente de revisión del cliente (ver `SiteSettings.pendingTodos`).
- Contenido que llega del cliente en bloque: módulo en `prisma/content/` con una función idempotente que llama el seed (base vacía) y un script `pnpm content:*` para la base del VPS, que se corre **una vez** (pisa los campos que toca) y **después `pm2 reload mora`**: escribe directo en la base sin `updateTag`, y la caché de `'use cache'` vive en memoria del proceso. Ej.: `client-answers.ts` (cuestionario del 26/10/2026).
- Blog: el link del menú/footer sale de `navLinks({ blog })` y solo aparece si hay notas publicadas; `/blog` vacío lleva `noindex`. Hoy el cliente lo quiere oculto (sin notas).
- HTML de editor rico siempre sanitizado antes de renderizar.
- Commit por fase en `develop`. `main` conserva el sitio estático viejo (HTML + 11 imágenes en `public/img/`) hasta el lanzamiento.

## Despliegue

VPS DonWeb Ubuntu 24.04 (4 vCPU / 8 GB / 30 GB), IP `201.32.131.60` (`vps-6520179-x.dattaweb.com`), SSH puerto **5460**, alias **`ssh vps-rodo`** (Mac y notebook Ubuntu, llave `~/.ssh/id_ed25519` de cada una: `salva-mac` / `salva-ubuntu`; en Linux sin `UseKeychain`; no confundir con `vps-personal`, otro VPS DonWeb en 201.32.130.19:5086); DonWeb entrega `root` → se crea `salva` (sudo **con** contraseña: la imagen trae `NOPASSWD`), se desactivan los accesos de DonWeb (`80-step.conf` con CA, `custom.conf`, llaves en `/root/.ssh/authorized_keys`), se apaga el puerto 22 (`ssh.socket`), `01-hardening.conf` solo llave y `AllowUsers salva`, Postfix `loopback-only`, fail2ban y swap 2 GB (guía, pasos 2–3). La web nueva **no** se publica en Vercel: hoy el sitio viejo sigue en Vercel y se migra al VPS **cuando el cliente dé el OK** (antes, prueba en `nuevo.moramachadoconstrucciones.com` con `SITE_NOINDEX=true`). Guía paso a paso (nivel junior) en `deploy/README.md`.

- Dominio registrado en **GoDaddy**; **el DNS está en Vercel** (nameservers `ns*.vercel-dns.com`): los registros se editan en Vercel → Domains. Al lanzar, quitar el dominio del **proyecto** viejo, nunca de la cuenta (se borraría la zona DNS). **Destino final (decidido 20/10/2026): DNS en DonWeb** (GoDaddy → NS DonWeb; web → VPS, solo los registros de mail → Webempresa). Se muda unos días después del lanzamiento (guía 16.8): zona completa en DonWeb, comparar contra Vercel con `dig`, recién ahí cambiar NS en GoDaddy, y quitar el dominio de Vercel tras 48 h.
- Casillas info@/sofia@/rodo@ en **Webempresa**. Registros de correo cargados en el DNS de Vercel el 20/10/2026 (paso 12): A `mail`/`webmail` → 198.27.88.204, MX 0 `mail.`, SPF `v=spf1 +mx +ip4:15.235.53.80 include:_spf.webempresa.eu ~all` (sin `+a`: la raíz no manda mail), DKIM `default._domainkey` y DMARC `p=none`, copiados de la zona de Webempresa (`ns2011.webempresa.eu`). Si se mueven los NS, replicarlos en la zona nueva. Resend (región sa-east-1, cargado 20/10/2026) usa `resend._domainkey` (TXT) y `send`/`rsend` (CNAME a `*.forge.rmta.net`); no toca la raíz.
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

- Formulario público (`ContactForm`): si `SiteSettings.budgetRanges` está vacío no pregunta presupuesto (así lo pidió el cliente). → server action `submitLead` (`src/server/actions/contact.ts`): honeypot `website` (responde ok sin guardar), rate limit por IP hasheada (5 / 15 min en prod), Turnstile opcional (solo si están `TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY`), >3 links → status `SPAM`. Tras guardar ofrece seguir por WhatsApp (no se abre solo: el popup se bloquea después de un await).
- Email por **Resend** (no SMTP/nodemailer): módulo único `src/lib/email.ts` (`sendLeadNotification`, `sendTestEmail`), plantillas React Email en `src/emails/` (HTML + texto plano). Destinatarios: `SiteSettings.notificationEmails`, fallback `MAIL_TO_DEFAULT`; `replyTo` = email del cliente; asunto «Nueva consulta web – {nombre} – {teléfono}». Se envía con `after()`; el resultado queda en `Lead.emailStatus` (SENT/FAILED) + `emailInfo` (id de Resend o error) y el detalle de la consulta ofrece «Reintentar envío». Sin `RESEND_API_KEY` en dev el email se imprime en consola; en prod sin key → FAILED. Acuse al cliente con `LEAD_CONFIRMATION_EMAIL=true` (el cliente lo quiere). `pnpm db:cleanup` borra las consultas de más de `LEAD_RETENTION_DAYS` (730 = 2 años, lo que promete la política de privacidad). Alta del dominio/DNS en `deploy/README.md`.
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

## Estado actual y próximos pasos (26/10/2026)

- Código terminado (F1–F10) y **`develop` en GitHub**. Sitio viejo sigue en Vercel; `main` = sitio viejo hasta el lanzamiento.
- Documentación para el deploy en `docs/`: `guia-deploy-vps.pdf` (= `deploy/README.md`), `Donweb-VPS-rodo.md` / `.pdf` (contexto completo + copias de `deploy/`, para el proyecto "Donweb-VPS-rodo" de Claude online). Regenerar PDFs: `pnpm docs:pdf`. `docs/Donweb-VPS-rodo.md`: la parte 1 (contexto) se edita a mano; las partes 2–3 (guía + archivos de `deploy/`) las regenera `pnpm docs:pdf`.
- VPS configurado (pasos 2–11, 17/10/2026): el sitio de prueba funciona en `https://nuevo.moramachadoconstrucciones.com` (rama `develop`). En el VPS la infraestructura se llama **mora** (`/var/www/mora`, PM2 `mora`, `mora_prod`, `mora.conf`, `github_mora`, `gdrive:mora-backups`); el único nombre «rodo» es el alias SSH `vps-rodo`.
- Correo de las casillas verificado 20/10/2026: entra a info@ y lo que sale pasa SPF/DKIM/DMARC en Gmail. Resend verificado 20/10/2026 (key en `shared/.env`, email de prueba OK). Backups a Google Drive activos desde 21/10/2026 (`gdrive:mora-backups`, backup de prueba subido). Monitoreo UptimeRobot activo (verificado 26/10/2026: `HEAD /healthz` cada 5 min → 200; al lanzar, cambiar la URL al dominio principal). Próximo: lanzamiento con OK del cliente (paso 16).
- Probado en el VPS: segundo deploy con `pm2 reload` (20/10/2026). Cron de backup local OK desde 18/10. CI de GitHub Actions verde (21/10). No probado aún: rollback de `deploy.sh`, restore de un backup en el VPS.
- Cuestionario del cliente respondido (26/10/2026) → `prisma/content/client-answers.ts`: ubicación Tali Puerto (Camino de la Costa Brava km 6,5), horario (campo nuevo `SiteSettings.openingHours`), cobertura todo el país, Instagram/TikTok, barra de aviso activa, sin rangos de presupuesto, diferencial «Llave en mano», servicios nuevos «Plateas y pisos de hormigón» (el que más quieren vender, primero) y «Pulido de pisos», obra industrial nueva (oculta hasta tener fotos), historia en Nosotros, responsable en la política de privacidad (Rodolfo Daniel Machado, CUIT 20-25661207-1; se publica el domicilio comercial, **no** el particular), blog oculto. Datos para una futura sección de preguntas frecuentes: garantía de 1 año por fallas de la empresa; cotización con visita (o planos/fotos/videos si es lejos), sin costo según distancia; pago 50/50 en obras chicas, ~20 % de anticipo y certificados de avance en grandes. Referencia de diseño que les gusta: Grupo Irizar.
- Pendientes de contenido del cliente: fotos en alta, logo original, logos de clientes y testimonios, fotos de la obra nueva, alts de galería, Google Business, color de acento, y OK de los textos nuevos (ver `pendingTodos`).

## Entorno: iCloud

El proyecto vive en `~/Desktop/proyects/...` con "Escritorio y Documentos" de iCloud **desactivado**. Si aparecen archivos/carpetas con sufijo " 2" (`README 2.md`, `models 2`, `node_modules/x 2`), son copias de conflicto de iCloud: reinstalar deps (`rm -rf node_modules src/generated && pnpm install`) y borrar las copias.
