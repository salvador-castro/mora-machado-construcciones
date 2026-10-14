# DESIGN.md — Mora Machado Construcciones

Lenguaje visual editorial inspirado en el template "Foster & Reeves" (BYQ Studio). **No se copia** HTML/CSS/JS/imágenes/textos del template: solo se recrea layout, ritmo, jerarquía, paleta y tipo de animaciones con código propio.

## 1. Paleta (tokens en `:root`, `src/app/globals.css`)

| Token        | Valor     | Uso                                                   |
| ------------ | --------- | ----------------------------------------------------- |
| `--ink`      | `#111A0D` | Texto principal, fondos oscuros (hero, servicios)     |
| `--paper`    | `#F4F3F0` | Fondo claro principal                                 |
| `--paper-2`  | `#F4F3EA` | Variante de fondo claro                               |
| `--sand`     | `#CFC9BE` | Fondo sección contacto                                |
| `--stone`    | `#5E5A53` | Fondo footer                                          |
| `--accent`   | `#E8FD53` | Botón primario, cuadrados de íconos, highlights       |
| `--ink-8…88` | ink + α   | 8/16/32/48/64/88 % — bordes, texto secundario, grilla |

- `--accent` se sobreescribe en runtime desde `SiteSettings.accentColor` (style en `<html>`). Default lima; alternativa terracota de la marca actual.
- Texto sobre acento: siempre `--ink`. Verificar contraste AA si el acento cambia (el admin avisa).
- Texto sobre fotos: overlay `--ink` ≥ 48 %.

## 2. Tipografía

- Familia única **Aspekta** (variable, OFL, self-hosted con `next/font/local`). Fallback: `Inter Tight`, Arial, sans-serif.
- Escala (desktop → mobile con `clamp()`):

| Rol     | Tamaño | Line-height | Peso | Tracking            | Mobile (375px) |
| ------- | ------ | ----------- | ---- | ------------------- | -------------- |
| H1      | 80px   | 72px (0.9)  | 500  | −3px                | ~44px          |
| H2      | 64px   | 56px        | 500  | −2px                | ~38px          |
| H3      | 48px   | 44px        | 500  | −2px                | ~30px          |
| H4      | 24px   | 28px        | 500  | −0.5px              | 20px           |
| Lead    | 22px   | 30px        | 400  | −0.2px              | 18px           |
| Body    | 16px   | 24px        | 400  | 0                   | 16px           |
| Eyebrow | 12px   | 16px        | 500  | +0.08em, MAYÚSCULAS | 12px           |

- **Eyebrow**: label corto en mayúsculas precedido de un cuadradito sólido (`■`, 8px, color acento sobre oscuro / ink sobre claro).

## 3. Layout

- Contenedor: `max-width: 1440px`, gutter 16px (mobile) / 24px (tablet) / 40px (desktop).
- Grilla: 4 cols mobile, 8 tablet, 12 desktop.
- **Grilla de fondo**: líneas verticales de 1px (`--ink-8` sobre claro, `--paper` 8 % sobre oscuro), fijas a todo el alto, alineadas a las columnas del contenedor (4 líneas mobile / 6 desktop).
- Ritmo vertical de secciones: 80px mobile / 120px desktop. Secciones alternan oscuro/claro.

## 4. Componentes

- **Barra de anuncio**: 36px, fondo `--ink`, texto `--paper` chico, link opcional. Editable + on/off.
- **Nav fija**: 56px, logo izq., derecha: botón primario "Pedir presupuesto" + botón menú (hamburguesa). Overlay de navegación a pantalla completa (`--ink`), links grandes tipo H2, trap de foco, cierre con Esc.
- **Botones**: alto 48px (44px min táctil), padding 20px, radio 2px.
  - Primario: fondo `--accent`, texto `--ink`, hover oscurece 8 %.
  - Secundario: outline 1px `currentColor`, transparente.
  - Link con flecha: texto + `→` que se desplaza 4px en hover.
- **Ícono en cuadrado**: 48×48, fondo `--accent`, ícono lucide 24px `--ink`.
- **Card de obra**: imagen dominante (aspect 4:3 / 16:10), título H4, bajada, metadatos en 2 columnas (UBICACIÓN / SERVICIO en eyebrow + valor), link "Ver obra →". Hover: zoom imagen 1.04 en 600ms.
- **Card de servicio** (oscuro): número `01`, título, descripción, borde superior `--paper` 16 %.
- **Highlights**: número grande + título + descripción, separados por líneas.
- **Marquee**: CSS puro, `animation` lineal infinita, pausa en hover, se detiene con `prefers-reduced-motion`.
- **Slider**: embla, contador "1 de 6", flechas cuadradas outline.
- **Botón flotante WhatsApp**: 56px circular, verde WhatsApp, esquina inf. der., sobre todo.

## 5. Movimiento

- Reveal en scroll: fade + translateY(24px) → 0, 600ms, `cubic-bezier(.2,.7,.2,1)`, stagger 80ms.
- Todo desactivado con `prefers-reduced-motion: reduce`.

## 6. Accesibilidad

- Contraste AA mínimo. Foco visible: outline 2px `--accent` + offset 2px (sobre claro usar `--ink`).
- `alt` obligatorio al subir imágenes. Targets táctiles ≥ 44px.

## 7. Admin

- shadcn/ui con tema neutro claro + `--accent` como color de acción secundaria. Mobile-first (el cliente lo usa desde el celular). Todo en español.

## 8. Breakpoints de prueba

375 · 768 · 1280 · 1440 px.
