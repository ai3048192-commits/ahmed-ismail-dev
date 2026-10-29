import { useMemo } from "react";
import type { SectionId } from "../lib/settings";
import { useSettings } from "../lib/site-settings";
import BlogPreview from "./BlogPreview";
import Booking from "./Booking";
import Contact from "./Contact";
import Experience from "./Experience";
import Faq from "./Faq";
import Hero from "./Hero";
import Pricing from "./Pricing";
import Projects from "./Projects";
import Services from "./Services";
import SiteLayout from "./SiteLayout";
import Skills from "./Skills";
import Testimonials from "./Testimonials";
import { useSite } from "./SiteData";
import { visibleSections } from "./sections";

export default function Portfolio() {
  const { settings: s } = useSettings();
  const data = useSite();
  const sections = useMemo(() => visibleSections(s, data), [s, data]);
  const num = (id: SectionId) => String(sections.indexOf(id) + 1).padStart(2, "0");

  const render = (id: SectionId) => {
    switch (id) {
      case "services":
        return <Services key={id} services={data.services} index={num(id)} />;
      case "work":
        return <Projects key={id} projects={data.projects} index={num(id)} />;
      case "skills":
        return <Skills key={id} skills={data.skills} index={num(id)} />;
      case "experience":
        return <Experience key={id} items={data.experience} index={num(id)} />;
      case "pricing":
        return <Pricing key={id} packages={data.packages} index={num(id)} bookable={sections.includes("booking")} />;
      case "testimonials":
        return <Testimonials key={id} items={data.testimonials} index={num(id)} />;
      case "faq":
        return <Faq key={id} faqs={data.faqs} index={num(id)} />;
      case "blog":
        return <BlogPreview key={id} posts={data.posts} index={num(id)} />;
      case "booking":
        return <Booking key={id} index={num(id)} />;
      case "contact":
        return <Contact key={id} profile={data.profile} index={num(id)} />;
    }
  };

  return (
    <SiteLayout home>
      <Hero profile={data.profile} projectCount={data.projects.length} skills={data.skills} />
      {data.status === "loading" ? <div className="min-h-[60vh]" /> : sections.map(render)}
    </SiteLayout>
  );
}
