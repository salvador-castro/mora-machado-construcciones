# Despliegue — Mora Machado Construcciones

VPS DonWeb (Ubuntu 24.04) · Nginx (TLS) → Next.js `standalone` con PM2 (puerto 3000, solo localhost) · PostgreSQL 16 local · uploads en disco.

```
/var/www/mora/
├── repo/                 clon del repositorio (historial completo)
├── releases/<fecha-sha>/ un git worktree por deploy (quedan las últimas 3)
├── current -> releases/… release activa (PM2 corre current/.next/standalone)
├── shared/.env           variables de producción (una sola copia)
├── uploads/              UPLOAD_DIR: fotos subidas (Nginx las sirve directo)
├── backups/              volcados diarios
└── logs/                 app, backup, cleanup
```

Archivos de esta carpeta:

| Archivo                | Para qué                                                       |
| ---------------------- | -------------------------------------------------------------- |
| `deploy.sh`            | Deploy con rollback automático si `/healthz` no responde       |
| `ecosystem.config.cjs` | Proceso PM2 (1 instancia: la caché de Next vive en el proceso) |
| `nginx/mora-http.conf` | Puerto 80: desafío de Let's Encrypt + redirect a https         |
| `nginx/mora.conf`      | Sitio https, `/uploads/` desde disco, proxy a Next             |
| `backup.sh`            | Base + fotos, rotación y copia externa opcional (rclone)       |
| `crontab`              | Backup 03:15, limpieza de sesiones/rate limits 03:45           |

---

## 1. Preparar el servidor (una vez)

Conectarse: `ssh -p 5086 salva@<IP>`.

```bash
# Paquetes base
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl build-essential nginx postgresql postgresql-contrib \
  certbot python3-certbot-nginx ufw rclone

# Firewall: SSH (puerto 5086), http y https. Postgres queda solo en localhost.
sudo ufw allow 5086/tcp && sudo ufw allow 'Nginx Full' && sudo ufw enable

# Node 22 + pnpm (versión fijada en package.json → packageManager)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo corepack enable
sudo npm i -g pm2
pm2 install pm2-logrotate                      # rota logs de PM2 (10 MB, 30 archivos)
pm2 set pm2-logrotate:max_size 10M && pm2 set pm2-logrotate:retain 30
pm2 startup systemd                            # ejecutar el comando sudo que imprime

# Carpetas
sudo mkdir -p /var/www/mora/{releases,shared,uploads,backups,logs} /var/www/certbot
sudo chown -R salva:salva /var/www/mora
chmod 755 /var/www/mora /var/www/mora/uploads  # Nginx (www-data) lee uploads
```

> Ubuntu 24.04 trae PostgreSQL 16 como `postgresql`. Si `psql --version` muestra otra versión, instalar `postgresql-16` del repositorio de PGDG.

### Base de datos

```bash
sudo -u postgres createuser --pwprompt mora      # contraseña larga sin caracteres especiales de URL (@ : / ?)
sudo -u postgres createdb -O mora mora_prod
```

### Variables de entorno

```bash
nano /var/www/mora/shared/.env && chmod 600 /var/www/mora/shared/.env
```

Partir de `.env.example`. Valores de producción:

| Variable                                         | Valor                                                                                      |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `DATABASE_URL`                                   | `postgresql://mora:<clave>@localhost:5432/mora_prod?schema=public`                         |
| `SITE_URL`                                       | `https://moramachadoconstrucciones.com` (https: activa HSTS y `upgrade-insecure-requests`) |
| `SITE_NOINDEX`                                   | `false` (`true` mientras se prueba en un subdominio)                                       |
| `UPLOAD_DIR`                                     | `/var/www/mora/uploads` (ruta **absoluta**)                                                |
| `AUTH_SECRET`                                    | `openssl rand -base64 32`                                                                  |
| `IP_HASH_SALT`                                   | `openssl rand -base64 16`                                                                  |
| `RESEND_API_KEY`, `MAIL_FROM`, `MAIL_TO_DEFAULT` | ver [Email: Resend](#email-resend)                                                         |
| `LEAD_CONFIRMATION_EMAIL`                        | `false` (opcional: acuse al cliente)                                                       |
| `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY`    | vacías (opcional, anti-spam de Cloudflare)                                                 |
| `BACKUP_KEEP_DAYS`, `BACKUP_RCLONE_REMOTE`       | ver [Backups](#5-backups)                                                                  |

`SITE_URL` y `SITE_NOINDEX` se leen al **buildear**: si cambian, volver a deployar.

## 2. Primer deploy

```bash
git clone https://github.com/salvador-castro/mora-machado-construcciones.git /var/www/mora/repo
/var/www/mora/repo/deploy/deploy.sh main        # o develop para una prueba previa

cd /var/www/mora/current
pnpm create-admin                                # usuario ADMIN del cliente (interactivo)
crontab deploy/crontab                           # si ya hay un crontab, combinarlo a mano
```

Cada deploy corre `pnpm db:seed` después de las migraciones: en una base vacía carga el contenido inicial (textos, las 11 fotos del sitio viejo, logo e ícono); en una base con contenido solo agrega bloques o campos nuevos, sin pisar lo editado. Por eso el primer deploy no necesita pasos extra antes del build (que lee la base).

El seed toma las 11 fotos del sitio viejo del historial de git (commit `39b8b90`), por eso los releases son worktrees y no exportaciones.

## 3. Nginx + HTTPS

```bash
sudo cp /var/www/mora/current/deploy/nginx/mora-http.conf /etc/nginx/sites-available/mora-http
sudo ln -s ../sites-available/mora-http /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Con el DNS ya apuntando al VPS (ver §6):
sudo certbot certonly --webroot -w /var/www/certbot \
  -d moramachadoconstrucciones.com -d www.moramachadoconstrucciones.com \
  --deploy-hook "systemctl reload nginx"

sudo cp /var/www/mora/current/deploy/nginx/mora.conf /etc/nginx/sites-available/mora
sudo ln -s ../sites-available/mora /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

La renovación del certificado la hace el timer de certbot (`systemctl list-timers | grep certbot`).

**Puntos de la configuración que no hay que cambiar:**

- `X-Real-IP $remote_addr`: la app la usa para limitar intentos de login y envíos del formulario. Si falta, todos los visitantes cuentan como la misma IP.
- **No** agregar `X-Forwarded-Proto`: con `https` en esa cabecera, Next 16 trata el 404 de `proxy.ts` (slugs inexistentes) como un proxy externo y responde 500. La app no lo necesita (las URLs absolutas salen de `SITE_URL`).
- `client_max_body_size 12m`: las fotos se suben de a una, hasta 10 MB.
- Nada de `proxy_cache`: la caché la maneja Next y el admin la invalida al guardar.
- `/uploads/` se sirve desde disco con sus propias cabeceras (esas respuestas no pasan por Next). El resto de las cabeceras de seguridad (CSP, HSTS…) las pone Next.

## 4. Deploys siguientes

```bash
/var/www/mora/current/deploy/deploy.sh main
```

Hace: `git fetch` → nuevo worktree → `pnpm install` → `prisma migrate deploy` → `db:seed` (idempotente) → build → copia de `public` y `.next/static` al standalone → cambia `current` → `pm2 reload` → chequea `/healthz`. Si falla el chequeo, vuelve a la release anterior.

- Las migraciones corren **antes** del build (el prerender lee la base). Mantenerlas aditivas: mientras se buildea, la release anterior sigue sirviendo con el esquema nuevo.
- Volver atrás a mano: `ln -sfn /var/www/mora/releases/<anterior> /var/www/mora/current && pm2 reload /var/www/mora/current/deploy/ecosystem.config.cjs`.
- Estado y logs: `pm2 status`, `pm2 logs mora`, `/var/www/mora/logs/`, `/var/log/nginx/mora.*.log`.

## 5. Backups

`deploy/backup.sh` (cron 03:15): `pg_dump` en formato custom + `tar.gz` de `uploads/`, en `/var/www/mora/backups`, con `BACKUP_KEEP_DAYS` días de retención.

**Copia fuera del servidor (recomendado):** si el VPS se pierde, los backups locales se pierden con él. Configurar un remoto con `rclone config` (Google Drive, S3, etc.) y poner su nombre en `BACKUP_RCLONE_REMOTE` (ej. `gdrive:mora-backups`).

Restaurar:

```bash
pg_restore --clean --if-exists --no-owner -d "postgresql://mora:<clave>@localhost:5432/mora_prod" backups/db-AAAA-MM-DD.dump
tar -xzf backups/uploads-AAAA-MM-DD.tar.gz -C /var/www/mora
pm2 reload mora
```

Probar una restauración en una base aparte de vez en cuando (`createdb mora_restore_test`).

## 6. DNS y lanzamiento

Hoy el dominio apunta al sitio viejo (Vercel).

**Prueba previa (sin tocar el sitio actual):** crear un registro `A` `nuevo` → IP del VPS. Copiar las configuraciones de Nginx reemplazando el dominio (`sed 's/moramachadoconstrucciones\.com/nuevo.moramachadoconstrucciones.com/g'`, quitando el bloque `www`), sacar el certificado para `nuevo.…`, y en `.env`: `SITE_URL=https://nuevo.moramachadoconstrucciones.com`, `SITE_NOINDEX=true`. Deployar `develop`.

**Lanzamiento:**

1. Bajar el TTL de los registros `@` y `www` a 300 s un día antes.
2. Mergear `develop` → `main`.
3. En `.env`: `SITE_URL=https://moramachadoconstrucciones.com`, `SITE_NOINDEX=false`.
4. DNS: `A @` → IP del VPS y `www` → `CNAME @` (o `A` a la misma IP). **No tocar los MX** (las casillas siguen en su proveedor).
5. Cuando propague: certificado (§3) y `deploy.sh main`.
6. Verificar: `https://moramachadoconstrucciones.com/healthz`, una consulta de prueba, Google Search Console con el `sitemap.xml`.
7. Desvincular el proyecto de Vercel del sitio viejo (`.vercel/`).

## 7. Monitoreo (recomendado)

Un chequeo externo gratuito (UptimeRobot, Better Stack) contra `https://moramachadoconstrucciones.com/healthz` cada 5 minutos, con aviso por email. Devuelve `{"ok":true}` y 503 si la base no responde.

---

## Email: Resend

El sitio **solo envía** emails (aviso de cada consulta del formulario, email de prueba y, opcionalmente, el acuse al cliente) a través de [Resend](https://resend.com). Resend **no aloja casillas**: info@, sofia@ y rodo@ siguen en el proveedor de correo actual.

### 1. Dar de alta el dominio

1. En Resend → **Domains** → **Add domain** → `moramachadoconstrucciones.com` (región: la que sugiera el panel; usar siempre la misma).
2. El panel muestra los registros DNS a cargar. Copiarlos **tal cual** desde el panel (los valores cambian por cuenta y región). Tienen esta forma:

| Tipo | Nombre (host)       | Valor                                                 | Para qué                                    |
| ---- | ------------------- | ----------------------------------------------------- | ------------------------------------------- |
| TXT  | `resend._domainkey` | `p=MIGfMA0…` (clave pública larga)                    | **DKIM**: firma los emails como del dominio |
| MX   | `send`              | `feedback-smtp.<región>.amazonses.com` (prioridad 10) | Rebotes y quejas del subdominio de envío    |
| TXT  | `send`              | `v=spf1 include:amazonses.com ~all`                   | **SPF** del subdominio de envío             |

3. Cargarlos en la zona DNS del dominio (donde esté administrado hoy) y esperar a que Resend los marque como **Verified**.

### ⚠️ No tocar el MX raíz

- Los registros de Resend van en **`send`** y en **`resend._domainkey`**, que son subdominios. **No** modifican ni reemplazan el **MX de `@`** (raíz), que sigue apuntando al proveedor donde están las casillas info@, sofia@ y rodo@.
- Si el dominio ya tiene un registro SPF en la raíz (`@`, `v=spf1 …`) para ese proveedor, **dejarlo como está**: el SPF de Resend va en `send`, no se suma al de la raíz.
- Si al cargar algo el panel DNS ofrece "reemplazar registros MX existentes", **no** aceptar para la raíz.

### 2. DMARC básico

Si el dominio todavía no tiene DMARC, agregar:

| Tipo | Nombre   | Valor                                                             |
| ---- | -------- | ----------------------------------------------------------------- |
| TXT  | `_dmarc` | `v=DMARC1; p=none; rua=mailto:info@moramachadoconstrucciones.com` |

`p=none` solo monitorea (no bloquea nada). Con unas semanas de reportes sin problemas se puede subir a `p=quarantine`. Si ya existe un `_dmarc`, no duplicarlo: revisar el actual.

### 3. API key

1. Resend → **API Keys** → **Create API key**.
2. Permiso: **Sending access** (no "Full access"). Dominio: **moramachadoconstrucciones.com**.
3. Copiarla (se muestra una sola vez) al `.env` del servidor como `RESEND_API_KEY` y reiniciar la app con PM2.

### 4. Verificar

- Panel → **Configuración** → «Emails que reciben las consultas» → **Enviar email de prueba**.
- Mandar una consulta desde `/contacto` y revisar que llegue; respondiendo ese email se le escribe a quien consultó (Reply-To).
- Si un envío falla, la consulta se guarda igual y en su detalle aparece **Reintentar envío** (el error queda registrado). Los envíos se ven en Resend → **Emails**.

### En desarrollo

Sin `RESEND_API_KEY` no se envía nada: el email (asunto, destinatarios y texto) se imprime en la consola de `pnpm dev`.
