import { CtaSection } from "@/components/home/cta-section";
import { FeaturedSection } from "@/components/home/featured-section";
import { GallerySection } from "@/components/home/gallery-section";
import { Hero } from "@/components/home/hero";
import { Intro } from "@/components/home/intro";
import { ProcessSection } from "@/components/home/process-section";
import { ProjectsSection } from "@/components/home/projects-section";
import { ServicesSection } from "@/components/home/services-section";
import { ValuesSection } from "@/components/home/values-section";
import { ContactBlock } from "@/components/site/contact/contact-block";
import { Section } from "@/components/ui/section";
import {
  getClientLogos,
  getFeaturedProjects,
  getFeaturedTestimonial,
  getGallery,
  getHighlights,
  getMarqueeItems,
  getMedia,
  getPageContent,
  getProcessSteps,
  getServices,
  getSettings,
  getValueItems,
} from "@/lib/content/queries";

export default async function HomePage() {
  const [
    settings,
    hero,
    intro,
    servicesHeader,
    projectsHeader,
    processHeader,
    values,
    featured,
    galleryHeader,
    cta,
    contact,
    highlights,
    marquee,
    logos,
    services,
    projects,
    steps,
    valueItems,
    gallery,
    testimonial,
  ] = await Promise.all([
    getSettings(),
    getPageContent("home.hero"),
    getPageContent("home.intro"),
    getPageContent("home.services"),
    getPageContent("home.projects"),
    getPageContent("home.process"),
    getPageContent("home.values"),
    getPageContent("home.featured"),
    getPageContent("home.gallery"),
    getPageContent("home.cta"),
    getPageContent("home.contact"),
    getHighlights(),
    getMarqueeItems(),
    getClientLogos(),
    getServices(),
    getFeaturedProjects(),
    getProcessSteps(),
    getValueItems(),
    getGallery(),
    getFeaturedTestimonial(),
  ]);

  const [heroBg, valuesImage] = await Promise.all([
    getMedia(hero?.backgroundId),
    getMedia(values?.imageId),
  ]);

  return (
    <>
      {hero && <Hero content={hero} background={heroBg} />}
      {intro && <Intro content={intro} highlights={highlights} marquee={marquee} logos={logos} />}
      {projectsHeader && <ProjectsSection content={projectsHeader} projects={projects} />}
      {servicesHeader && services.length > 0 && (
        <ServicesSection content={servicesHeader} services={services} />
      )}
      {processHeader && <ProcessSection content={processHeader} steps={steps} />}
      {values && valueItems.length > 0 && (
        <ValuesSection content={values} items={valueItems} image={valuesImage} />
      )}
      {featured && <FeaturedSection content={featured} projects={projects} />}
      {galleryHeader && <GallerySection content={galleryHeader} items={gallery} />}
      {cta && <CtaSection content={cta} testimonial={testimonial} />}
      {contact && (
        <Section id="contacto" tone="sand" aria-label="Contacto">
          <div className="container-site">
            <ContactBlock content={contact} settings={settings} sourcePage="/" />
          </div>
        </Section>
      )}
    </>
  );
}
