import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { EMPTY_SITE_DATA, fetchSiteData, type SiteData } from "./useSiteData";

const Ctx = createContext<SiteData>(EMPTY_SITE_DATA);

/** loaded once for the whole public site, so moving between pages doesn't refetch */
export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SiteData>(EMPTY_SITE_DATA);
  useEffect(() => {
    let alive = true;
    fetchSiteData().then((d) => alive && setData(d));
    return () => {
      alive = false;
    };
  }, []);
  return <Ctx.Provider value={data}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- the hook belongs next to its provider
export function useSite() {
  return useContext(Ctx);
}
