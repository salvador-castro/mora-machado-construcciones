/**
 * Content from the client's questionnaire (answered 26/10/2026).
 *
 * Applied once to an existing database with `pnpm content:client-answers`,
 * and by `pnpm db:seed` right after seeding an empty one. Idempotent: a second
 * run changes nothing, but it does overwrite the fields it sets, so don't
 * re-run it after the client starts editing those fields in the admin.
 *
 * Text marked DRAFT was written by us from the client's answers and still
 * needs their OK (see pendingTodos).
 */
import type { createPrismaClient } from "@/lib/db-client";
import { todosSchema } from "@/lib/content/schemas";

type Db = ReturnType<typeof createPrismaClient>;

const ADDRESS = "Tali Puerto · Camino de la Costa Brava km 6,5, Zárate, Buenos Aires";

const SETTINGS = {
  address: ADDRESS,
  mapEmbedUrl:
    "https://www.google.com/maps?q=Tali+Puerto,+Camino+de+la+Costa+Brava+km+6.5,+Z%C3%A1rate,+Buenos+Aires&output=embed",
  coverage: "Obras en todo el país",
  openingHours: "Lunes a viernes de 8 a 17 h · Sábados de 8 a 13 h",
  socials: [
    { network: "instagram", url: "https://www.instagram.com/moramachadoconstrucciones/" },
    { network: "tiktok", url: "https://www.tiktok.com/@moramachadoconstrucciones" },
  ],
  announcementText: "Agenda abierta para obras 2027 — consultá disponibilidad",
  announcementUrl: "/#contacto",
  announcementEnabled: true,
  // "Los presupuestos son personalizados": the form no longer asks for a range.
  budgetRanges: [] as string[],
};

const PENDING_TODOS = [
  "Revisar los textos nuevos: historia en Nosotros, «Llave en mano», servicios «Plateas y pisos de hormigón» y «Pulido de pisos», y la política de privacidad.",
  "Fotos en alta resolución (originales), foto para la portada y foto del equipo para Nosotros.",
  "Logo original en buena calidad (PDF, AI, SVG o PNG grande con fondo transparente).",
  "Fotos y descripción de la obra «Pisos, veredas y calles de acceso» (está cargada pero oculta), y permiso del cliente para mostrarla.",
  "Logos de clientes (Club Náutico Zárate, Tali Puerto, El Cardón, Highland Park) con permiso, y testimonios.",
  "Descripción de las fotos de la galería (hoy dicen «Detalle de obra»).",
  "Crear el perfil de Google Business y pasar el link.",
  "Elegir color de acento: lima (template) o terracota (marca actual).",
];

const COVERAGE_ITEM = {
  title: "Alcance nacional",
  description: "Trabajamos en Zárate y en todo el país.",
};

// DRAFT
const KEY_VALUE = {
  title: "Llave en mano",
  description:
    "Nos ocupamos de la obra completa: materiales, mano de obra y coordinación, hasta la entrega.",
  icon: "KeyRound",
};

// DRAFT
const NEW_SERVICES = [
  {
    slug: "plateas-y-pisos-de-hormigon",
    title: "Plateas y pisos de hormigón",
    icon: "Grid3x3",
    shortDescription:
      "Plateas y pisos para naves industriales, galpones y espacios deportivos, con el movimiento de suelos incluido.",
    content: [
      "<p>Ejecutamos plateas y pisos de hormigón para sectores industriales, galpones, canchas y espacios deportivos.</p>",
      "<p>Nos ocupamos de todo el proceso: el movimiento de suelos y la preparación de la base, el armado, el hormigonado y la terminación, para lograr superficies niveladas y resistentes al uso intensivo.</p>",
    ].join(""),
  },
  {
    slug: "pulido-de-pisos",
    title: "Pulido de pisos",
    icon: "Sparkles",
    shortDescription:
      "Pulido de pisos de hormigón para lograr superficies lisas, resistentes y fáciles de mantener.",
    content:
      "<p>Pulimos pisos de hormigón en naves, galpones, comercios y espacios deportivos, para dejar superficies lisas, resistentes y fáciles de mantener.</p>",
  },
];

const NEW_PROJECT = {
  slug: "pisos-veredas-y-calles-de-acceso",
  title: "Pisos, veredas y calles de acceso",
  category: { slug: "industrial", name: "Industrial" },
  service: "plateas-y-pisos-de-hormigon",
  location: "Parque Industrial Zárate",
  year: 2026,
  area: "3.800 m²",
  excerpt:
    "Pisos, veredas y calles de acceso para un galpón del Parque Industrial de Zárate, ejecutados en 30 días.",
};

// DRAFT — history from the questionnaire.
const ABOUT_HISTORY = [
  "<p>La historia empezó en 2001, cuando Rodolfo Machado conoció a un ingeniero que tenía un proyecto de obra en un puerto cerealero de Molino Cañuelas S.A. y comenzó a trabajar con él como contratista. Al principio trabajaba solo; con los años se fue sumando gente y así se conformó Mora Machado Construcciones.</p>",
  "<p>Hoy contamos con personal propio y asegurado, y trabajamos junto al ingeniero Morel y a otros contratistas según lo que pida cada obra. Entre nuestros clientes están el Club Náutico Zárate, Tali Puerto S.A., el country El Cardón y Highland Park Country Club.</p>",
];

// DRAFT — reviewed by the client before publishing.
const PRIVACY_BODY = [
  "<p>En Mora Machado Construcciones respetamos tu privacidad. Esta política explica qué datos recopilamos a través de este sitio y cómo los usamos, conforme a la Ley 25.326 de Protección de los Datos Personales.</p>",
  "<h2>Responsable de los datos</h2>",
  `<p>Rodolfo Daniel Machado (Mora Machado Construcciones), CUIT 20-25661207-1, con domicilio en ${ADDRESS.replace(" · ", ", ")}. Contacto: info@moramachadoconstrucciones.com o por WhatsApp al 03487-656133.</p>`,
  "<h2>Qué datos recopilamos</h2>",
  "<p>Cuando completás el formulario de contacto guardamos tu nombre, teléfono, email (si lo indicás) y el mensaje. También registramos datos técnicos mínimos para prevenir abusos (un identificador anónimo derivado de tu dirección IP y el navegador utilizado).</p>",
  "<h2>Para qué los usamos</h2>",
  "<p>Usamos tus datos únicamente para responder tu consulta y, si corresponde, elaborar un presupuesto. No los vendemos ni los compartimos con terceros con fines comerciales.</p>",
  "<h2>Cuánto tiempo los conservamos</h2>",
  "<p>Conservamos las consultas durante 2 años desde que las recibimos y después las eliminamos.</p>",
  "<h2>Tus derechos</h2>",
  "<p>Podés solicitar el acceso, la rectificación o la supresión de tus datos escribiéndonos por WhatsApp o a nuestro email de contacto. La Agencia de Acceso a la Información Pública, órgano de control de la Ley 25.326, atiende las denuncias y reclamos relacionados con el incumplimiento de las normas sobre protección de datos personales.</p>",
].join("");

const BLOG_DRAFTS = ["que-tener-en-cuenta-antes-de-una-reforma", "solados-exteriores-como-elegir"];

type Item = { title: string; description: string };

export async function applyClientAnswers(db: Db) {
  const log: string[] = [];

  await db.siteSettings.update({
    where: { id: 1 },
    data: {
      ...SETTINGS,
      pendingTodos: todosSchema.parse(
        PENDING_TODOS.map((text, i) => ({ id: `todo-c${i + 1}`, text, done: false })),
      ),
    },
  });
  log.push("configuración (ubicación, mapa, horario, cobertura, redes, aviso, sin rangos)");

  const highlight = await db.highlight.findFirst({ where: { title: "Alcance regional" } });
  if (highlight) {
    await db.highlight.update({
      where: { id: highlight.id },
      data: { title: COVERAGE_ITEM.title, description: "Zárate y todo el país." },
    });
    log.push("destacado 03 → Alcance nacional");
  }

  if (!(await db.valueItem.findFirst({ where: { title: KEY_VALUE.title } }))) {
    const last = await db.valueItem.aggregate({ _max: { order: true } });
    await db.valueItem.create({ data: { ...KEY_VALUE, order: (last._max.order ?? -1) + 1 } });
    log.push("diferencial «Llave en mano»");
  }

  // Shared "por qué elegirnos" items: regional → national coverage.
  for (const s of await db.service.findMany({ select: { id: true, whyItems: true } })) {
    const items = (s.whyItems as Item[]) ?? [];
    if (!items.some((i) => i.title === "Alcance regional")) continue;
    await db.service.update({
      where: { id: s.id },
      data: { whyItems: items.map((i) => (i.title === "Alcance regional" ? COVERAGE_ITEM : i)) },
    });
  }

  // New services go first (in NEW_SERVICES order); the rest keep their relative order.
  const template = await db.service.findFirst({ orderBy: { order: "asc" } });
  for (const s of NEW_SERVICES) {
    if (await db.service.findUnique({ where: { slug: s.slug } })) continue;
    await db.service.create({
      data: { ...s, order: -1, whyItems: template?.whyItems ?? [], steps: template?.steps ?? [] },
    });
    log.push(`servicio «${s.title}»`);
  }
  const services = await db.service.findMany({
    orderBy: { order: "asc" },
    select: { id: true, slug: true },
  });
  const rank = (slug: string) => {
    const i = NEW_SERVICES.findIndex((s) => s.slug === slug);
    return i === -1 ? NEW_SERVICES.length : i;
  };
  const sorted = services
    .map((s, i) => ({ ...s, i }))
    .sort((a, b) => rank(a.slug) - rank(b.slug) || a.i - b.i);
  await db.$transaction(
    sorted.map((s, order) => db.service.update({ where: { id: s.id }, data: { order } })),
  );

  if (!(await db.project.findUnique({ where: { slug: NEW_PROJECT.slug } }))) {
    const category = await db.projectCategory.upsert({
      where: { slug: NEW_PROJECT.category.slug },
      update: {},
      create: {
        ...NEW_PROJECT.category,
        order:
          ((await db.projectCategory.aggregate({ _max: { order: true } }))._max.order ?? -1) + 1,
      },
    });
    const service = await db.service.findUnique({ where: { slug: NEW_PROJECT.service } });
    const last = await db.project.aggregate({ _max: { order: true } });
    await db.project.create({
      data: {
        slug: NEW_PROJECT.slug,
        title: NEW_PROJECT.title,
        categoryId: category.id,
        serviceId: service?.id,
        location: NEW_PROJECT.location,
        year: NEW_PROJECT.year,
        area: NEW_PROJECT.area,
        excerpt: NEW_PROJECT.excerpt,
        content: `<p>${NEW_PROJECT.excerpt}</p>`,
        order: (last._max.order ?? -1) + 1,
        published: false, // no photos yet
      },
    });
    log.push(`obra «${NEW_PROJECT.title}» (oculta, sin fotos)`);
  }

  const about = await db.pageContent.findUnique({ where: { key: "about" } });
  const aboutData = about?.data as { body?: string } | undefined;
  if (about && aboutData?.body && !aboutData.body.includes("2001")) {
    const [first, ...rest] = aboutData.body.split("</p>");
    const tail = rest
      .join("</p>")
      .replace(
        "en Zárate y en otras ciudades y provincias según el proyecto",
        "en Zárate y en todo el país",
      );
    await db.pageContent.update({
      where: { key: "about" },
      data: { data: { ...aboutData, body: `${first}</p>${ABOUT_HISTORY.join("")}${tail}` } },
    });
    log.push("Nosotros: historia");
  }

  const privacy = await db.pageContent.findUnique({ where: { key: "legal.privacy" } });
  if (privacy) {
    await db.pageContent.update({
      where: { key: "legal.privacy" },
      data: {
        data: { ...(privacy.data as object), body: PRIVACY_BODY, lastUpdated: "Octubre 2026" },
      },
    });
    log.push("política de privacidad (responsable, 2 años)");
  }

  const deleted = await db.blogPost.deleteMany({
    where: { slug: { in: BLOG_DRAFTS }, status: "DRAFT" },
  });
  if (deleted.count) log.push(`blog: ${deleted.count} borradores eliminados`);

  return log;
}
