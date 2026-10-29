import { useEffect, useState } from "react";
import { NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import {
  Award,
  BarChart3,
  BadgeDollarSign,
  CalendarCheck,
  CircleHelp,
  Code2,
  ExternalLink,
  FolderKanban,
  Inbox,
  Layers,
  Loader2,
  LogOut,
  Menu,
  Moon,
  Newspaper,
  Palette,
  Quote,
  Search,
  Settings,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { usePrefs } from "../lib/prefs";
import { supabase } from "../lib/supabase";
import Bookings from "./Bookings";
import Login from "./Login";
import Messages from "./Messages";
import { MESSAGES_CHANGED } from "./format";
import Overview from "./Overview";
import ProfilePage from "./ProfilePage";
import ResourceManager from "./ResourceManager";
import SettingsPage from "./SettingsPage";
import SiteDesigner from "./SiteDesigner";
import * as R from "./resources";
import { useAdmin } from "./useAdmin";

const GROUPS = [
  {
    title: "الرئيسية",
    items: [
      { to: "/admin", label: "نظرة عامة", Icon: BarChart3, end: true },
      { to: "/admin/messages", label: "الرسائل", Icon: Inbox },
      { to: "/admin/bookings", label: "الحجوزات", Icon: CalendarCheck },
    ],
  },
  {
    title: "المحتوى",
    items: [
      { to: "/admin/projects", label: "المشاريع", Icon: FolderKanban },
      { to: "/admin/skills", label: "المهارات", Icon: Code2 },
      { to: "/admin/experience", label: "الخبرات والشهادات", Icon: Award },
      { to: "/admin/services", label: "الخدمات", Icon: Layers },
      { to: "/admin/testimonials", label: "آراء العملاء", Icon: Quote },
      { to: "/admin/posts", label: "المقالات", Icon: Newspaper },
      { to: "/admin/packages", label: "الباقات والأسعار", Icon: BadgeDollarSign },
      { to: "/admin/faqs", label: "الأسئلة الشائعة", Icon: CircleHelp },
      { to: "/admin/profile", label: "البيانات الشخصية", Icon: UserRound },
    ],
  },
  {
    title: "الشكل",
    items: [
      { to: "/admin/design", label: "شكل الموقع و 3D", Icon: Palette },
      { to: "/admin/seo", label: "SEO ومحركات البحث", Icon: Search },
    ],
  },
  {
    title: "النظام",
    items: [{ to: "/admin/settings", label: "الإعدادات", Icon: Settings }],
  },
];

function useUnreadCount(trigger: string) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const refresh = () =>
      supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false)
        .then(({ count }) => setN(count || 0));
    refresh();
    window.addEventListener(MESSAGES_CHANGED, refresh);
    return () => window.removeEventListener(MESSAGES_CHANGED, refresh);
  }, [trigger]);
  return n;
}

export default function AdminApp() {
  const admin = useAdmin();
  const { isDark, setIsDark } = usePrefs();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const unread = useUnreadCount(location.pathname + (admin.status === "admin" ? "1" : "0"));

  useEffect(() => {
    document.title = "لوحة التحكم";
  }, []);

  if (admin.status === "loading") {
    return (
      <div dir="rtl" lang="ar" className="min-h-screen grid place-items-center text-faint">
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  if (admin.status === "signed-out") {
    return (
      <div dir="rtl" lang="ar">
        <Login />
      </div>
    );
  }

  const email = admin.session.user.email || "";
  const current = GROUPS.flatMap((g) => g.items).find((i) => (i.end ? location.pathname === i.to || location.pathname === `${i.to}/` : location.pathname.startsWith(i.to)));

  const nav = (
    <nav aria-label="أقسام لوحة التحكم" className="flex flex-col gap-6" onClick={() => setMenuOpen(false)}>
      {GROUPS.map((g) => (
        <div key={g.title}>
          <p className="px-3 mb-2 font-mono text-[10px] uppercase text-faint">{g.title}</p>
          <div className="flex flex-col gap-0.5">
            {g.items.map(({ to, label, Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${isActive ? "bg-surface-2 text-fg font-medium" : "text-muted hover:text-fg hover:bg-surface-2/60"}`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <span className="absolute inset-y-2 start-0 w-[3px] rounded-full bg-accent" aria-hidden />}
                    <Icon size={17} className={isActive ? "text-accent-ink" : ""} />
                    <span className="flex-1">{label}</span>
                    {to === "/admin/messages" && unread > 0 && <span className="rounded-pill bg-accent text-accent-fg px-2 py-0.5 text-[11px] font-semibold tabular-nums">{unread}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );

  const account = (
    <div className="mt-auto pt-4 border-t border-line flex items-center gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-accent-fg text-sm font-bold uppercase">{email[0] || "A"}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">الأدمن</span>
        <span className="block text-[11px] text-faint truncate" dir="ltr">
          {email}
        </span>
      </span>
      <button type="button" onClick={() => supabase.auth.signOut()} className="p-2 rounded-lg text-muted hover:text-danger hover:bg-surface-2" aria-label="تسجيل خروج" title="تسجيل خروج">
        <LogOut size={17} />
      </button>
    </div>
  );

  return (
    <div dir="rtl" lang="ar" className="min-h-screen lg:grid lg:grid-cols-[272px_1fr]">
      <aside className="hidden lg:block p-3">
        <div className="sticky top-3 flex h-[calc(100vh-1.5rem)] flex-col rounded-3xl border border-line bg-surface p-4 overflow-y-auto">
          <div className="flex items-center gap-3 px-2 pb-6">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-fg font-display font-bold">AI</span>
            <span>
              <span className="block font-display font-semibold leading-tight">لوحة التحكم</span>
              <span className="block text-[11px] text-faint">إدارة الموقع كله</span>
            </span>
          </div>
          {nav}
          <div className="pt-6">{account}</div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 px-3 pt-3">
          <div className="flex h-14 items-center gap-3 rounded-2xl border border-line bg-bg/75 backdrop-blur-xl px-3 sm:px-4">
            <button type="button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="القائمة" className="lg:hidden relative p-2 rounded-lg hover:bg-surface-2">
              {menuOpen ? <X size={19} /> : <Menu size={19} />}
              {!menuOpen && unread > 0 && <span className="absolute top-1.5 end-1.5 h-2 w-2 rounded-full bg-accent" />}
            </button>
            <p className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-faint hidden sm:inline">لوحة التحكم</span>
              <span className="text-faint hidden sm:inline">/</span>
              <span className="font-medium truncate">{current?.label || "نظرة عامة"}</span>
            </p>
            <div className="ms-auto flex items-center gap-1.5">
              <button type="button" onClick={() => setIsDark(!isDark)} className="p-2 rounded-lg text-muted hover:text-fg hover:bg-surface-2" aria-label={isDark ? "الوضع الفاتح" : "الوضع الداكن"}>
                {isDark ? <Sun size={17} /> : <Moon size={17} />}
              </button>
              <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-pill bg-accent text-accent-fg px-4 py-2 text-xs font-semibold">
                <ExternalLink size={14} /> <span className="hidden sm:inline">عرض الموقع</span>
              </a>
            </div>
          </div>
        </header>

        {menuOpen && (
          <div className="lg:hidden fixed inset-x-3 top-[4.75rem] bottom-3 z-30 rounded-3xl border border-line bg-surface p-4 flex flex-col overflow-y-auto shadow-2xl">
            {nav}
            <div className="pt-6">{account}</div>
          </div>
        )}

        <main className={`min-w-0 px-4 sm:px-8 py-8 lg:py-10 mx-auto ${location.pathname.startsWith("/admin/design") ? "max-w-[1700px]" : "max-w-6xl"}`}>
          <Routes>
            <Route index element={<Overview />} />
            <Route path="messages" element={<Messages />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="posts" element={<ResourceManager key="posts" config={R.posts} />} />
            <Route path="packages" element={<ResourceManager key="packages" config={R.packages} />} />
            <Route path="faqs" element={<ResourceManager key="faqs" config={R.faqs} />} />
            <Route path="projects" element={<ResourceManager key="projects" config={R.projects} />} />
            <Route path="skills" element={<ResourceManager key="skills" config={R.skills} />} />
            <Route path="experience" element={<ResourceManager key="experience" config={R.experience} />} />
            <Route path="services" element={<ResourceManager key="services" config={R.services} />} />
            <Route path="testimonials" element={<ResourceManager key="testimonials" config={R.testimonials} />} />
            <Route path="design" element={<SiteDesigner key="design" mode="design" />} />
            <Route path="seo" element={<SiteDesigner key="seo" mode="seo" />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
