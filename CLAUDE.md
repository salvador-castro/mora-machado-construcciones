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
```

## Entorno local

- Postgres 16 vía Homebrew en **puerto 5433** (`brew services start postgresql@16`); el Postgres 14 del sistema queda en 5432 sin tocar.
- DB `mora_dev`, usuario `mora` / `mora_dev`. Variables en `.env` (documentadas en `.env.example`). `.env.local` solo tiene el token OIDC de Vercel del sitio viejo — no usar.

## Convenciones

- Código, nombres y comentarios en inglés. **Toda la UI (sitio y admin) en español rioplatense.**
- Lecturas públicas en `src/lib/content/queries.ts` con `'use cache'` + `cacheTag`; cada server action del admin llama `revalidateTag` del tag afectado.
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

F1 setup ✅ · F2 design system ✅ · F3 schema + seed ✅ · F4 home · F5 páginas internas · F6 auth + admin layout · F7 CRUDs/medios/settings · F8 contacto + leads · F9 SEO/a11y/perf/seguridad · F10 tests + deploy
