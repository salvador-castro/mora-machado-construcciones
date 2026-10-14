# Despliegue — Mora Machado Construcciones

VPS DonWeb (Ubuntu 24.04) · Nginx → PM2 (Next `output: "standalone"`, puerto 3000) · PostgreSQL 16.

> El paso a paso completo del servidor (Node, PM2, Nginx, certificados, backups) se completa en F10.
> Esta guía ya documenta el envío de emails y dos requisitos que salieron de F9.

## Variables de entorno de producción

Ver `.env.example`. Además de las de base de datos y auth:

| Variable                  | Valor en producción                                                                            |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| `SITE_URL`                | `https://moramachadoconstrucciones.com` (con https: activa HSTS y `upgrade-insecure-requests`) |
| `RESEND_API_KEY`          | API key de Resend (ver abajo)                                                                  |
| `MAIL_FROM`               | `Web Mora Machado <no-reply@moramachadoconstrucciones.com>`                                    |
| `MAIL_TO_DEFAULT`         | `info@moramachadoconstrucciones.com` (si en Configuración no hay emails cargados)              |
| `LEAD_CONFIRMATION_EMAIL` | `true` para mandarle un acuse de recibo a quien consulta (opcional, apagado por defecto)       |

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

## Nginx: requisitos de F9

- `/uploads/` lo sirve Nginx directo desde `UPLOAD_DIR`: agregar ahí las cabeceras de seguridad (`X-Content-Type-Options: nosniff`, `Cache-Control: public, max-age=31536000, immutable`), porque esas respuestas no pasan por Next.
- El resto de las cabeceras (CSP, HSTS, etc.) las pone Next (`next.config.ts`); no duplicarlas en Nginx para el proxy a la app.
