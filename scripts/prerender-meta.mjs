// Runs after `vite build`. Social apps (WhatsApp, Facebook, LinkedIn) don't run
// JavaScript, so they never see the titles/images React sets. This writes a copy
// of dist/index.html per page with the right <meta> tags baked in:
//   dist/index.html, dist/work/<slug>/index.html, dist/blog/index.html, dist/blog/<slug>/index.html
// Hosts serve those files before the SPA fallback. Never fails the build.
import fs from "node:fs";
import path from "node:path";

const dist = path.resolve("dist");
const read = (k) => process.env[k] || envFile()[k];
let cachedEnv;
function envFile() {
  if (cachedEnv) return cachedEnv;
  cachedEnv = {};
  for (const name of [".env", ".env.local", ".env.production"]) {
    if (!fs.existsSync(name)) continue;
    for (const line of fs.readFileSync(name, "utf8").split(/\r?\n/)) {
      const i = line.indexOf("=");
      if (i > 0 && !line.trim().startsWith("#")) cachedEnv[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    }
  }
  return cachedEnv;
}

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function main() {
  const url = read("VITE_SUPABASE_URL");
  const key = read("VITE_SUPABASE_ANON_KEY");
  if (!url || !key || !fs.existsSync(path.join(dist, "index.html"))) {
    console.warn("prerender-meta: skipped (missing Supabase env or dist/index.html)");
    return;
  }
  const get = async (q) => {
    const r = await fetch(`${url}/rest/v1/${q}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    return r.ok ? r.json() : [];
  };
  const [[profile = {}], [settingsRow], projects, posts] = await Promise.all([
    get("profile?select=*&id=eq.1"),
    get("site_settings?select=data&id=eq.1"),
    get("projects?select=slug,name_en,desc_en,image&published=eq.true"),
    get("posts?select=slug,title_en,excerpt_en,cover&published=eq.true"),
  ]);
  const s = settingsRow?.data || {};
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const origin = (s.canonical_url || process.env.SITE_URL || (vercel ? `https://${vercel}` : "")).replace(/\/$/, "");
  const abs = (u) => (!u ? "" : /^https?:\/\//.test(u) ? u : origin ? origin + (u.startsWith("/") ? u : `/${u}`) : "");

  const name = profile.full_name_en || "Portfolio";
  const siteTitle = s.seo_title_en || `${name} — ${profile.role_en || "Developer"}`;
  const siteDesc = (s.seo_desc_en || profile.hero_desc_en || "").slice(0, 200);
  const siteImage = abs(s.og_image || profile.avatar_url || profile.logo_url);
  const template = fs.readFileSync(path.join(dist, "index.html"), "utf8");

  const page = ({ title, desc, image, route, type = "website" }) => {
    const tags = [
      `<meta property="og:type" content="${type}" />`,
      `<meta property="og:title" content="${esc(title)}" />`,
      `<meta property="og:description" content="${esc(desc)}" />`,
      origin && `<meta property="og:url" content="${esc(origin + route)}" />`,
      image && `<meta property="og:image" content="${esc(image)}" />`,
      `<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />`,
      `<meta name="twitter:title" content="${esc(title)}" />`,
      `<meta name="twitter:description" content="${esc(desc)}" />`,
      image && `<meta name="twitter:image" content="${esc(image)}" />`,
      s.noindex && `<meta name="robots" content="noindex, nofollow" />`,
      s.google_verification && `<meta name="google-site-verification" content="${esc(s.google_verification)}" />`,
      origin && s.canonical_url && `<link rel="canonical" href="${esc(origin + route)}" />`,
    ]
      .filter(Boolean)
      .join("\n    ");
    return template
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
      .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(desc)}" />`)
      .replace("</head>", `    ${tags}\n  </head>`);
  };
  const write = (route, html) => {
    const file = path.join(dist, route, "index.html");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, html);
  };

  write("/", page({ title: siteTitle, desc: siteDesc, image: siteImage, route: "/" }));
  for (const p of projects) {
    if (!p.slug) continue;
    write(`/work/${p.slug}`, page({ title: `${p.name_en} — ${name}`, desc: (p.desc_en || siteDesc).slice(0, 200), image: abs(p.image) || siteImage, route: `/work/${p.slug}`, type: "article" }));
  }
  if (posts.length) write("/blog", page({ title: `Articles — ${name}`, desc: siteDesc, image: siteImage, route: "/blog" }));
  for (const p of posts) {
    if (!p.slug) continue;
    write(`/blog/${p.slug}`, page({ title: `${p.title_en} — ${name}`, desc: (p.excerpt_en || siteDesc).slice(0, 200), image: abs(p.cover) || siteImage, route: `/blog/${p.slug}`, type: "article" }));
  }
  // a sitemap helps Google find every project and article
  if (origin) {
    const urls = ["/", ...projects.filter((p) => p.slug).map((p) => `/work/${p.slug}`), ...(posts.length ? ["/blog"] : []), ...posts.filter((p) => p.slug).map((p) => `/blog/${p.slug}`)];
    fs.writeFileSync(
      path.join(dist, "sitemap.xml"),
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${esc(origin + u)}</loc></url>`).join("\n")}\n</urlset>\n`
    );
    fs.writeFileSync(path.join(dist, "robots.txt"), `User-agent: *\n${s.noindex ? "Disallow: /" : "Disallow: /admin"}\nSitemap: ${origin}/sitemap.xml\n`);
  }
  console.log(`prerender-meta: ${1 + projects.length + posts.length + (posts.length ? 1 : 0)} pages${origin ? " + sitemap" : " (set canonical URL in the dashboard for absolute links + sitemap)"}`);
}

main().catch((e) => console.warn("prerender-meta: skipped —", e.message));
