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
```

## Entorno local

- Postgres 16 vía Homebrew en **puerto 5433** (`brew services start postgresql@16`); el Postgres 14 del sistema queda en 5432 sin tocar.
- DB `mora_dev`, usuario `mora` / `mora_dev`. Variables en `.env` (documentadas en `.env.example`). `.env.local` solo tiene el token OIDC de Vercel del sitio viejo — no usar.

## Convenciones

- Código, nombres y comentarios en inglés. **Toda la UI (sitio y admin) en español rioplatense.**
- Lecturas públicas en `src/lib/content/queries.ts` con `'use cache'` + `cacheLife("max")` + `cacheTag` (tags en `src/lib/content/tags.ts`). Las server actions del admin llaman `updateTag(tag)` (read-your-writes inmediato). Todo lo que embebe media lleva también `TAGS.media`.
- Imágenes públicas: `<MediaImage>` (srcset desde variantes). `/uploads/*` lo sirve Nginx en prod y `src/app/uploads/[...path]/route.ts` en dev.
- No usar `new Date()`/`Math.random()` en render: Next 16 lo prohíbe en el shell estático (ver `CurrentYear`, cacheado con `cacheLife("days")`).
- Rutas `[slug]`: `generateStaticParams` debe devolver ≥1 param (si no hay, `{ slug: "_" }` → 404). Se hace `await params` + `notFound()` antes de cualquier Suspense para tener 404 real, por eso `export const instant = false`.
- Rich text: `<RichText>` sanitiza con `src/lib/sanitize.ts` (solo imágenes de `/uploads/`). Estilos en `.rich-text` (globals.css).
- Textos de títulos de secciones en páginas de detalle: `PageContent` key `details`. `pnpm db:seed` sin `--force` crea las keys de `PageContent` que falten (sin pisar ediciones).
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

VPS DonWeb Ubuntu 24.04, SSH puerto 5086, usuario `salva`. Nginx → PM2 (`output: "standalone"`, puerto 3000). Uploads en `UPLOAD_DIR` (`/var/www/mora/uploads`), servidos por Nginx en `/uploads/`. Ver `deploy/README.md`. El proyecto de Vercel vinculado (`.vercel/`) es del sitio viejo; se desvincula tras el cambio de DNS.

## Decisiones

- Next 16 en vez de 15 (estable actual). Middleware → `src/proxy.ts`.
- Prisma 7.10 (8 todavía en RC).
- Auth propia en vez de Auth.js v5 (beta).
- Imágenes: variantes WebP pre-generadas con sharp (480/960/1600/2400) + `srcset` propio; sin optimizador de Next en el VPS.
- Rate limiting en tabla Postgres (sin Redis).
- WhatsApp principal por defecto: 03487-656133 (más usado en el sitio viejo); 03487-514196 como teléfono. Pendiente de confirmar por el cliente.

## Fases

F1 setup ✅ · F2 design system ✅ · F3 schema + seed ✅ · F4 home ✅ · F5 páginas internas ✅ · F6 auth + admin layout ✅ · F7 CRUDs/medios/settings (en curso) · F8 contacto + leads · F9 SEO/a11y/perf/seguridad · F10 tests + deploy

## Estado de F7 (para retomar)

Hecho: medios (biblioteca, picker, uso), drag & drop, editor de secciones por schema, Tiptap, configuración, listas genéricas (`LIST_ENTITIES` + `ListManager`), vista previa con draft mode (`/admin/preview?type=post|project|service&id=`), actions de servicios/obras/notas (`src/server/actions/{services,projects,posts}.ts`) y schemas (`src/lib/admin/schemas.ts`).
Falta: UI de servicios (`/admin/servicios`, nuevo, [id]), obras (`/admin/obras` + galería de la obra), blog (`/admin/blog` con tabs notas/categorías), usuarios + `/admin/cuenta`, e2e de esos flujos.
Testing interactivo del admin: usar Playwright (`pnpm test:e2e --project=admin`); la pestaña de Chrome automatizada queda `hidden` y React no revela el contenido streameado.

## Entorno: iCloud

El proyecto vive en `~/Desktop/proyects/...` con "Escritorio y Documentos" de iCloud **desactivado**. Si aparecen archivos/carpetas con sufijo " 2" (`README 2.md`, `models 2`, `node_modules/x 2`), son copias de conflicto de iCloud: reinstalar deps (`rm -rf node_modules src/generated && pnpm install`) y borrar las copias.
