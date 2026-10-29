import { Suspense, lazy } from "react";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import NotFound from "./site/NotFound";
import Portfolio from "./site/Portfolio";
import ProjectPage from "./site/ProjectPage";
import { SiteDataProvider } from "./site/SiteData";

// the dashboard is a separate chunk: visitors never download it
const AdminApp = lazy(() => import("./admin/AdminApp"));
// the markdown renderer only loads when someone opens the blog
const BlogIndex = lazy(() => import("./site/Blog").then((m) => ({ default: m.BlogIndex })));
const BlogPost = lazy(() => import("./site/Blog").then((m) => ({ default: m.BlogPost })));

/** public pages share one data load */
function PublicSite() {
  return (
    <SiteDataProvider>
      <Suspense fallback={<div className="min-h-screen bg-bg" />}>
        <Outlet />
      </Suspense>
    </SiteDataProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicSite />}>
          <Route path="/" element={<Portfolio />} />
          <Route path="/work/:slug" element={<ProjectPage />} />
          <Route path="/blog" element={<BlogIndex />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
        </Route>
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<div className="min-h-screen bg-bg" />}>
              <AdminApp />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
