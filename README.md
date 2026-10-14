# Mora Machado Construcciones

Sitio público + panel de administración. Next.js 16 · Prisma 7 · PostgreSQL 16.

## Desarrollo

```bash
brew services start postgresql@16   # puerto 5433
cp .env.example .env                # completar DATABASE_URL, etc.
pnpm install
pnpm db:migrate && pnpm db:seed
pnpm dev
```

Ver `CLAUDE.md` (stack, convenciones, decisiones) y `DESIGN.md` (design system). Despliegue: `deploy/README.md`.
