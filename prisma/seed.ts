/**
 * Initial content, taken from the legacy site (moramachadoconstrucciones.com).
 * Text marked "DRAFT" below did not exist on the legacy site and was written
 * for review by the client (see pendingTodos).
 *
 * Usage:
 *   pnpm db:seed            → only runs on an empty database
 *   pnpm db:seed --force    → wipes content (keeps users and leads) and reseeds
 */
import "dotenv/config";
import { createPrismaClient } from "@/lib/db-client";
import { removeMediaFiles, type MediaVariant } from "@/lib/media/process";
import {
  pageContentSchemas,
  phonesSchema,
  todosSchema,
  type PageContentKey,
} from "@/lib/content/schemas";
import { importBrandAssets } from "../scripts/import-brand";
import { importLegacyImages, type LegacyMedia } from "../scripts/import-legacy-images";

const db = createPrismaClient();
const force = process.argv.includes("--force");

const LOCATION = "Zárate, Buenos Aires";

async function wipeContent() {
  const media = await db.media.findMany({ select: { variants: true } });
  await db.$transaction([
    db.siteSettings.deleteMany(),
    db.pageContent.deleteMany(),
    db.projectImage.deleteMany(),
    db.testimonial.deleteMany(),
    db.project.deleteMany(),
    db.projectCategory.deleteMany(),
    db.service.deleteMany(),
    db.processStep.deleteMany(),
    db.valueItem.deleteMany(),
    db.highlight.deleteMany(),
    db.marqueeItem.deleteMany(),
    db.clientLogo.deleteMany(),
    db.galleryImage.deleteMany(),
    db.blogPost.deleteMany(),
    db.blogCategory.deleteMany(),
    db.media.deleteMany(),
  ]);
  await removeMediaFiles(media.flatMap((m) => (m.variants as MediaVariant[]).map((v) => v.path)));
}

/** Default content for every PageContent key (validated per key). */
function buildPages(img: LegacyMedia) {
  const pages: { [K in PageContentKey]: unknown } = {
    "home.hero": {
      eyebrow: "Empresa familiar de Zárate",
      title: "Obras reales, soluciones concretas y compromiso en cada etapa.",
      highlight: "soluciones concretas",
      subtitle:
        "Construcciones nuevas, reformas, obras civiles, terminaciones exteriores y espacios deportivos. Trabajamos con una mirada práctica, cercana y orientada a resolver.",
      primaryCta: { label: "Solicitar presupuesto", href: "#contacto" },
      secondaryCta: { label: "Ver trabajos realizados", href: "#obras" },
      backgroundId: img.pool.id,
    },
    "home.intro": {
      eyebrow: "Quiénes somos",
      // DRAFT
      text: "Somos una empresa familiar de Zárate. Construimos, reformamos y resolvemos obra civil con trato directo, seguimiento cercano y la experiencia de estar todos los días en obra.",
      showClientLogos: true,
    },
    "home.services": {
      eyebrow: "Qué hacemos",
      title: "Servicios pensados para resolver obra real.",
      highlight: "resolver obra real",
      subtitle:
        "Una propuesta clara para clientes que necesitan construir, reformar o mejorar espacios con una empresa que acompaña el proceso completo.",
      cta: { label: "Pedir presupuesto", href: "#contacto" },
    },
    "home.projects": {
      eyebrow: "Obras reales",
      title: "Trabajos realizados, sin renders.",
      highlight: "sin renders",
      subtitle:
        "Mostramos obras reales porque en construcción la confianza se construye viendo procesos, avances y resultados concretos.",
      cta: { label: "Ver todas", href: "/obras" },
    },
    "home.process": {
      eyebrow: "Cómo trabajamos",
      title: "Proceso simple, obra ordenada.",
      highlight: "obra ordenada",
      subtitle:
        "Un método claro ayuda a que cada proyecto avance con mayor previsibilidad, comunicación y control.",
    },
    "home.values": {
      eyebrow: "Diferenciales",
      title: "Una constructora familiar, con respuesta profesional.",
      highlight: "con respuesta profesional",
      imageId: img.inProgress.id,
    },
    "home.featured": {
      eyebrow: "Proceso constructivo",
      title: "Ver la obra en marcha también construye confianza.",
    },
    "home.gallery": {
      eyebrow: "Galería",
      title: "Detalles de obra, avance y terminación.",
      highlight: "avance y terminación",
      subtitle: "Una selección de imágenes reales para mostrar variedad de trabajos y etapas.",
    },
    "home.cta": {
      title: "¿Tenés una obra en mente?",
      text: "Hablemos por WhatsApp y contanos qué necesitás construir, reformar o resolver. Te orientamos con una respuesta clara.",
      cta: { label: "Pedir presupuesto", href: "#contacto" },
      showTestimonial: true,
    },
    "home.contact": {
      eyebrow: "Contacto",
      title: "Datos de contacto",
      text: "Estamos disponibles para recibir consultas, evaluar obras y coordinar proyectos.",
      formEyebrow: "Consulta",
      formTitle: "Envianos tu consulta",
      formText: "Completá tus datos y te respondemos por WhatsApp a la brevedad.",
      consentText: "Acepto que Mora Machado Construcciones guarde mis datos para contactarme.",
    },
    // DRAFT
    about: {
      eyebrow: "Nosotros",
      title: "Una empresa familiar que construye con los pies en la obra.",
      highlight: "con los pies en la obra",
      subtitle:
        "Desde Zárate acompañamos a familias, comercios e industrias en construcciones nuevas, reformas y obra civil.",
      imageId: img.concrete.id,
      body: [
        "<p>Mora Machado Construcciones nace como una empresa familiar con una idea simple: resolver obra real con trato directo y compromiso en cada etapa.</p>",
        "<p>Trabajamos en construcciones nuevas, reformas y ampliaciones, obras civiles, terminaciones exteriores, espacios deportivos y obras industriales, en Zárate y en otras ciudades y provincias según el proyecto.</p>",
        "<p>Nos gusta mostrar la obra tal como es: procesos visibles, avances concretos y resultados que se sostienen en el tiempo.</p>",
      ].join(""),
      showValues: true,
      showProcess: true,
      cta: { label: "Pedir presupuesto", href: "/contacto" },
    },
    contact: {
      eyebrow: "Contacto",
      title: "¿Tenés una obra en mente?",
      highlight: "obra en mente",
      subtitle:
        "Contanos qué necesitás construir, reformar o resolver. Te respondemos por WhatsApp a la brevedad.",
      showMap: true,
    },
    "services.index": {
      eyebrow: "Servicios",
      title: "Servicios pensados para resolver obra real.",
      highlight: "resolver obra real",
      subtitle:
        "Una propuesta clara para clientes que necesitan construir, reformar o mejorar espacios con una empresa que acompaña el proceso completo.",
    },
    "projects.index": {
      eyebrow: "Obras",
      title: "Trabajos realizados, sin renders.",
      highlight: "sin renders",
      subtitle:
        "Mostramos obras reales porque en construcción la confianza se construye viendo procesos, avances y resultados concretos.",
    },
    "blog.index": {
      eyebrow: "Blog",
      title: "Notas de obra.",
      subtitle: "Consejos prácticos para planificar, construir y mantener tus espacios.",
    },
    details: {
      serviceWhyEyebrow: "Por qué elegirnos",
      serviceWhyTitle: "Una obra bien hecha empieza por cómo se trabaja.",
      serviceStepsEyebrow: "Etapas",
      serviceStepsTitle: "Cómo lo hacemos.",
      serviceAsideText: "Contanos tu proyecto y te orientamos con una respuesta clara.",
      projectGalleryTitle: "Avance y detalles.",
      projectRelatedTitle: "Otras obras.",
      blogRelatedTitle: "Notas relacionadas.",
    },
    // DRAFT — reviewed by the client before publishing.
    "legal.privacy": {
      title: "Política de privacidad",
      lastUpdated: "Octubre 2026",
      body: [
        "<p>En Mora Machado Construcciones respetamos tu privacidad. Esta política explica qué datos recopilamos a través de este sitio y cómo los usamos, conforme a la Ley 25.326 de Protección de los Datos Personales.</p>",
        "<h2>Qué datos recopilamos</h2>",
        "<p>Cuando completás el formulario de contacto guardamos tu nombre, teléfono, email (si lo indicás), el rango de presupuesto y el mensaje. También registramos datos técnicos mínimos para prevenir abusos (un identificador anónimo derivado de tu dirección IP y el navegador utilizado).</p>",
        "<h2>Para qué los usamos</h2>",
        "<p>Usamos tus datos únicamente para responder tu consulta y, si corresponde, elaborar un presupuesto. No los vendemos ni los compartimos con terceros con fines comerciales.</p>",
        "<h2>Cuánto tiempo los conservamos</h2>",
        "<p>Conservamos las consultas mientras sean necesarias para la relación comercial y luego las eliminamos.</p>",
        "<h2>Tus derechos</h2>",
        "<p>Podés solicitar el acceso, la rectificación o la supresión de tus datos escribiéndonos por WhatsApp o a nuestro email de contacto. La Agencia de Acceso a la Información Pública, órgano de control de la Ley 25.326, atiende las denuncias y reclamos relacionados con el incumplimiento de las normas sobre protección de datos personales.</p>",
      ].join(""),
    },
  };

  return pages;
}

/**
 * Creates missing PageContent rows and fills fields added to a schema later
 * (top-level keys absent from the stored JSON). Never overwrites client edits.
 */
async function ensurePages(img: LegacyMedia) {
  const pages = buildPages(img);
  const rows = new Map(
    (await db.pageContent.findMany({ select: { key: true, data: true } })).map((r) => [
      r.key,
      r.data as Record<string, unknown>,
    ]),
  );
  const added: string[] = [];
  for (const key of Object.keys(pages) as PageContentKey[]) {
    const defaults = pageContentSchemas[key].parse(pages[key]) as Record<string, unknown>;
    const current = rows.get(key);
    if (!current) {
      await db.pageContent.create({ data: { key, data: defaults as object } });
      added.push(key);
      continue;
    }
    const newFields = Object.keys(defaults).filter((f) => !(f in current));
    if (newFields.length) {
      await db.pageContent.update({
        where: { key },
        data: { data: { ...defaults, ...current } as object },
      });
      added.push(`${key} (${newFields.join(", ")})`);
    }
  }
  return added;
}

async function main() {
  const existing = await db.siteSettings.findUnique({ where: { id: 1 } });
  if (force) {
    console.log("Borrando contenido existente…");
    await wipeContent();
  }

  console.log("Importando imágenes del sitio anterior…");
  const img = await importLegacyImages(db);

  const addedPages = await ensurePages(img);
  if (existing && !force) {
    await importBrandAssets(db); // assigns logo/favicon only if still empty
    console.log(
      addedPages.length
        ? `Bloques de contenido agregados: ${addedPages.join(", ")}`
        : "La base ya tiene contenido. Usá `pnpm db:seed --force` para reiniciarlo.",
    );
    return;
  }

  // ── Settings ────────────────────────────────────────────────
  const phones = phonesSchema.parse([
    { label: "WhatsApp", number: "03487-656133", whatsapp: true, primary: true },
  ]);

  const pendingTodos = todosSchema.parse(
    [
      "Elegir color de acento: lima (template) o terracota (marca actual).",
      "Fotos adicionales en alta resolución (las actuales son de 1200 px), logos de clientes y testimonios reales.",
      "Revisar textos redactados: intro de inicio, Nosotros, detalle de servicios, blog y política de privacidad.",
      "Confirmar rangos de presupuesto del formulario.",
      "Mejorar los textos alternativos de las fotos de galería (hoy «Detalle de obra»).",
    ].map((text, i) => ({ id: `todo-${i + 1}`, text, done: false })),
  );

  await db.siteSettings.create({
    data: {
      id: 1,
      brandName: "Mora Machado Construcciones",
      tagline: "Obras civiles · reformas · construcción",
      accentColor: "#E8FD53",
      phones,
      email: "info@moramachadoconstrucciones.com",
      address: "Zárate, Buenos Aires, Argentina",
      coverage: "Otras ciudades y provincias a evaluar",
      mapEmbedUrl:
        "https://www.google.com/maps?q=Z%C3%A1rate,+Buenos+Aires,+Argentina&output=embed",
      socials: [],
      announcementText: "Agenda abierta para obras 2027 — consultá disponibilidad",
      announcementUrl: "#contacto",
      announcementEnabled: false,
      footerText: "Soluciones de obra con compromiso, cercanía y ejecución real.",
      defaultSeoTitle:
        "Mora Machado Construcciones | Obras civiles, reformas y construcción en Zárate",
      defaultSeoDescription:
        "Empresa familiar de Zárate. Construcciones nuevas, reformas, obras civiles, terminaciones exteriores y espacios deportivos.",
      defaultOgImageId: img.pool.id,
      notificationEmails: ["info@moramachadoconstrucciones.com"],
      budgetRanges: [
        "Todavía no lo sé",
        "Hasta $10 millones",
        "$10 a $30 millones",
        "$30 a $80 millones",
        "Más de $80 millones",
      ],
      pendingTodos,
    },
  });

  // ── Home lists ──────────────────────────────────────────────
  await db.highlight.createMany({
    data: [
      { number: "01", title: "Obra nueva", description: "Desarrollo y ejecución desde cero." },
      { number: "02", title: "Reformas", description: "Ampliaciones, mejoras y terminaciones." },
      {
        number: "03",
        title: "Alcance regional",
        description: "Zárate y otras ciudades/provincias.",
      },
    ].map((h, order) => ({ ...h, order })),
  });

  await db.marqueeItem.createMany({
    data: [
      "Construcciones nuevas",
      "Reformas integrales",
      "Obras civiles",
      "Terminaciones exteriores",
      "Espacios deportivos",
      "Zárate y alrededores",
    ].map((text, order) => ({ text, order })),
  });

  const processSteps = [
    {
      title: "Relevamiento",
      description: "Entendemos la necesidad, el tipo de obra y las condiciones del lugar.",
    },
    {
      title: "Propuesta",
      description: "Definimos alcance, etapas, prioridades y una forma concreta de avanzar.",
    },
    {
      title: "Ejecución",
      description: "Coordinamos recursos y desarrollamos la obra con seguimiento cercano.",
    },
    {
      title: "Entrega",
      description: "Cerramos cada trabajo buscando funcionalidad, prolijidad y resultado duradero.",
    },
  ];
  await db.processStep.createMany({ data: processSteps.map((s, order) => ({ ...s, order })) });

  await db.valueItem.createMany({
    data: [
      {
        title: "Trato directo",
        description:
          "Comunicación cercana para entender cada necesidad y dar respuestas concretas.",
        icon: "Handshake",
      },
      {
        title: "Obra real",
        description: "Procesos visibles, trabajos en ejecución y experiencia aplicada en campo.",
        icon: "HardHat",
      },
      {
        title: "Versatilidad",
        description:
          "Capacidad para resolver construcción, reforma, exterior, estructura y obra civil.",
        icon: "Layers",
      },
    ].map((v, order) => ({ ...v, order })),
  });

  // ── Services ────────────────────────────────────────────────
  // DRAFT: whyItems and steps are shared defaults until the client details each service.
  const whyItems = [
    { title: "Trato directo", description: "Hablás con quienes dirigen y ejecutan la obra." },
    { title: "Seguimiento cercano", description: "Te contamos cada avance y cada decisión." },
    { title: "Obra real", description: "Experiencia aplicada en campo, sin promesas en el aire." },
    { title: "Alcance regional", description: "Zárate, alrededores y otras ciudades a evaluar." },
  ];

  const services = [
    {
      slug: "construcciones-nuevas",
      title: "Construcciones nuevas",
      icon: "Building2",
      shortDescription:
        "Desarrollo de proyectos desde etapa inicial, con planificación, ejecución y seguimiento de cada avance.",
    },
    {
      slug: "obras-civiles",
      title: "Obras civiles",
      icon: "Landmark",
      shortDescription:
        "Estructuras, muros, losas, mampostería y trabajos generales para obras residenciales, comerciales e industriales.",
    },
    {
      slug: "reformas-y-ampliaciones",
      title: "Reformas y ampliaciones",
      icon: "Hammer",
      shortDescription:
        "Intervenciones sobre espacios existentes para mejorar funcionalidad, estética y valor de uso.",
    },
    {
      slug: "terminaciones-exteriores",
      title: "Terminaciones exteriores",
      icon: "Trees",
      shortDescription:
        "Solados, entornos de piscina, accesos, pisos exteriores y mejoras de espacios abiertos.",
    },
    {
      slug: "espacios-deportivos",
      title: "Espacios deportivos",
      icon: "Trophy",
      shortDescription:
        "Intervenciones y trabajos de obra para canchas, sectores deportivos y espacios de uso intensivo.",
    },
    {
      slug: "obras-industriales",
      title: "Obras industriales",
      icon: "Factory",
      shortDescription:
        "Soluciones para entornos operativos, estructuras, adecuaciones y necesidades específicas de obra.",
    },
  ];

  const serviceIds: Record<string, string> = {};
  for (const [order, s] of services.entries()) {
    const created = await db.service.create({
      data: {
        ...s,
        order,
        content: `<p>${s.shortDescription}</p>`,
        whyItems,
        steps: processSteps,
      },
    });
    serviceIds[s.slug] = created.id;
  }

  // ── Projects ────────────────────────────────────────────────
  const categories = [
    { slug: "exterior-residencial", name: "Exterior residencial" },
    { slug: "espacio-deportivo", name: "Espacio deportivo" },
    { slug: "obra-civil", name: "Obra civil" },
    { slug: "construccion-nueva", name: "Construcción nueva" },
  ];
  const categoryIds: Record<string, string> = {};
  for (const [order, c] of categories.entries()) {
    categoryIds[c.slug] = (await db.projectCategory.create({ data: { ...c, order } })).id;
  }

  const projects = [
    {
      slug: "solado-exterior-y-entorno-de-piscina",
      title: "Solado exterior y entorno de piscina",
      category: "exterior-residencial",
      service: "terminaciones-exteriores",
      excerpt:
        "Trabajo de terminación exterior en vivienda, integrando circulación, estética y funcionalidad del espacio.",
      cover: img.pool,
    },
    {
      slug: "cancha-de-padel",
      title: "Cancha de pádel",
      category: "espacio-deportivo",
      service: "espacios-deportivos",
      excerpt: "Intervención en espacio deportivo con tareas de preparación y terminación.",
      cover: img.padel,
    },
    {
      slug: "muro-curvo-de-hormigon",
      title: "Muro curvo de hormigón",
      category: "obra-civil",
      service: "obras-civiles",
      excerpt: "Trabajo estructural en ejecución con encofrados y terminación de hormigón.",
      cover: img.curvedWall,
      gallery: [img.concrete],
    },
    {
      slug: "encofrado",
      title: "Encofrado",
      category: "construccion-nueva",
      service: "construcciones-nuevas",
      excerpt: "Avances de obra con estructura y cerramientos tradicionales.",
      cover: img.formwork,
      gallery: [img.inProgress],
    },
  ];

  for (const [order, p] of projects.entries()) {
    await db.project.create({
      data: {
        slug: p.slug,
        title: p.title,
        categoryId: categoryIds[p.category],
        serviceId: serviceIds[p.service],
        location: LOCATION,
        excerpt: p.excerpt,
        content: `<p>${p.excerpt}</p>`,
        coverId: p.cover.id,
        featured: true,
        featuredOrder: order,
        order,
        published: true,
        publishedAt: new Date(),
        images: {
          create: [p.cover, ...(p.gallery ?? [])].map((m, i) => ({ mediaId: m.id, order: i })),
        },
      },
    });
  }

  // ── Gallery (order and captions from the legacy site) ───────
  const gallery = [
    { media: img.detail1 },
    { media: img.detail2 },
    { media: img.detail3 },
    { media: img.concrete, caption: "Encofrado y hormigón" },
    { media: img.detail4 },
    { media: img.detail5 },
    { media: img.formwork, caption: "Encofrado y avance de obra", shape: "wide" },
  ];
  await db.galleryImage.createMany({
    data: gallery.map((g, order) => ({
      mediaId: g.media.id,
      caption: g.caption ?? null,
      shape: g.shape ?? (g.media.height > g.media.width ? "tall" : "normal"),
      order,
    })),
  });

  // ── Blog (drafts) ───────────────────────────────────────────
  const blogCategory = await db.blogCategory.create({
    data: { slug: "consejos-de-obra", name: "Consejos de obra", order: 0 },
  });
  await db.blogPost.createMany({
    data: [
      {
        slug: "que-tener-en-cuenta-antes-de-una-reforma",
        title: "Qué tener en cuenta antes de empezar una reforma",
        excerpt:
          "Definir prioridades, revisar el estado de lo existente y ordenar las etapas evita sorpresas y sobrecostos.",
        content: [
          "<p>Una reforma bien planificada empieza mucho antes de mover el primer ladrillo. Antes de arrancar, conviene ordenar algunas decisiones.</p>",
          "<h2>1. Definí qué querés resolver</h2>",
          "<p>¿Ganar espacio, mejorar la funcionalidad o renovar terminaciones? Tener claro el objetivo ayuda a priorizar.</p>",
          "<h2>2. Revisá el estado de lo existente</h2>",
          "<p>Instalaciones, humedad y estructura condicionan el alcance real de la obra. Un buen relevamiento evita sorpresas.</p>",
          "<h2>3. Ordená las etapas</h2>",
          "<p>Dividir la obra en etapas permite avanzar con previsibilidad y adaptar el ritmo a tu presupuesto.</p>",
        ].join(""),
        coverId: img.inProgress.id,
        categoryId: blogCategory.id,
        status: "DRAFT",
      },
      {
        slug: "solados-exteriores-como-elegir",
        title: "Solados exteriores: cómo elegir el piso para tu galería y piscina",
        excerpt:
          "Antideslizante, resistencia a la intemperie y mantenimiento: lo que importa al elegir un piso exterior.",
        content: [
          "<p>El piso exterior está expuesto al sol, la lluvia y el uso intensivo. Elegirlo bien hace la diferencia a lo largo de los años.</p>",
          "<h2>Seguridad primero</h2>",
          "<p>Alrededor de la piscina, una superficie antideslizante es indispensable.</p>",
          "<h2>Pendientes y desagües</h2>",
          "<p>Un buen solado empieza por una base bien nivelada, con pendientes que alejen el agua de la construcción.</p>",
          "<h2>Mantenimiento</h2>",
          "<p>Consultá cuánto cuidado necesita cada material y cómo envejece con el tiempo.</p>",
        ].join(""),
        coverId: img.pool.id,
        categoryId: blogCategory.id,
        status: "DRAFT",
      },
    ],
  });

  console.log("Importando logo e ícono…");
  await importBrandAssets(db);

  const counts = {
    media: await db.media.count(),
    services: await db.service.count(),
    projects: await db.project.count(),
    gallery: await db.galleryImage.count(),
    pages: await db.pageContent.count(),
    posts: await db.blogPost.count(),
  };
  console.log("Seed completo:", counts);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
