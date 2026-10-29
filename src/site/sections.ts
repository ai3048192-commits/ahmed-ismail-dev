import type { SectionId, SiteSettings } from "../lib/settings";
import type { SiteData } from "./useSiteData";

function hasRows(id: SectionId, d: SiteData, s: SiteSettings) {
  switch (id) {
    case "services":
      return d.services.length > 0;
    case "work":
      return d.projects.length > 0;
    case "skills":
      return d.skills.length > 0;
    case "experience":
      return d.experience.length > 0;
    case "pricing":
      return d.packages.length > 0;
    case "testimonials":
      return d.testimonials.length > 0;
    case "faq":
      return d.faqs.length > 0;
    case "blog":
      return d.posts.length > 0;
    case "booking":
      return s.booking_enabled;
    default:
      return true;
  }
}

/** dashboard order, minus hidden sections and sections with nothing in them */
export function visibleSections(s: SiteSettings, d: SiteData): SectionId[] {
  return s.section_order.filter((id) => !s.hidden_sections.includes(id) && (d.status === "loading" ? id !== "blog" : hasRows(id, d, s)));
}
