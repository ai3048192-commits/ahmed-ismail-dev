import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Wrench } from "lucide-react";
import { usePrefs } from "../lib/prefs";
import { useSettings } from "../lib/site-settings";
import { supabase } from "../lib/supabase";
import ChatWidget from "./ChatWidget";
import { SiteEffects } from "./Effects";
import Footer from "./Footer";
import Header, { Monogram } from "./Header";
import Seo, { type PageMeta } from "./Seo";
import { useSite } from "./SiteData";
import { visibleSections } from "./sections";
import { logVisit } from "./useSiteData";

// the dashboard's live preview loads the site with ?preview=1
const isPreview = new URLSearchParams(window.location.search).has("preview");

/** maintenance mode hides the site from visitors, but the admin still sees it */
function useIsAdmin(check: boolean) {
  const [admin, setAdmin] = useState<boolean | null>(null);
  useEffect(() => {
    if (!check) return;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return setAdmin(false);
      const { data: ok } = await supabase.rpc("is_admin");
      setAdmin(ok === true);
    });
  }, [check]);
  return admin;
}

/** everything around a public page: header, footer, effects, SEO, chat, maintenance */
export default function SiteLayout({ children, home = false, meta }: { children: ReactNode; home?: boolean; meta?: PageMeta }) {
  const { lang, pick } = usePrefs();
  const { settings: s, loaded } = useSettings();
  const data = useSite();
  const { profile } = data;
  const maintenance = loaded && s.maintenance && !isPreview;
  const isAdmin = useIsAdmin(maintenance);
  const sections = useMemo(() => visibleSections(s, data), [s, data]);
  const base = home ? "" : "/";

  useEffect(() => {
    if (!isPreview) logVisit(lang);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (maintenance && !isAdmin) {
    return (
      <main className="min-h-screen grid place-items-center px-5 text-center">
        <Seo settings={s} profile={profile} preview={isPreview} />
        <SiteEffects settings={s} />
        {isAdmin === false && (
          <div className="glass max-w-md rounded-[2rem] p-10">
            <div className="mx-auto w-fit">
              <Monogram profile={profile} size={56} />
            </div>
            <Wrench className="mx-auto mt-8 text-accent-ink" />
            <h1 className="mt-4 text-3xl tracking-tight">{pick(s.maintenance_en, s.maintenance_ar)}</h1>
            {profile.email && (
              <a href={`mailto:${profile.email}`} className="mt-6 inline-block text-sm text-muted hover:text-fg" dir="ltr">
                {profile.email}
              </a>
            )}
          </div>
        )}
      </main>
    );
  }

  return (
    <>
      <Seo settings={s} profile={profile} preview={isPreview} page={meta} />
      <SiteEffects settings={s} />
      {maintenance && isAdmin && (
        <p className="fixed bottom-5 start-5 z-[80] rounded-pill bg-fg text-bg px-4 py-2 text-xs shadow-lg">
          {pick("Maintenance mode is on — only you can see the site.", "وضع الصيانة شغال — إنت بس اللي شايف الموقع.")}
        </p>
      )}
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-[200] focus:rounded-pill focus:bg-grad focus:text-white focus:px-4 focus:py-2">
        {pick("Skip to content", "انتقل للمحتوى")}
      </a>
      <Header profile={profile} sections={sections} base={base} hasBlog={data.posts.length > 0} />
      <main id="main">{children}</main>
      <Footer profile={profile} base={base} hasBlog={data.posts.length > 0} />
      <ChatWidget profile={profile} />
    </>
  );
}
