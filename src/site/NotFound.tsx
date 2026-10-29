import { Link } from "react-router-dom";
import { usePrefs } from "../lib/prefs";
import { btn } from "./styles";

export default function NotFound() {
  const { pick } = usePrefs();
  return (
    <main className="min-h-screen grid place-items-center px-5 text-center">
      <div>
        <p className="font-mono text-accent-ink text-sm">404</p>
        <h1 className="mt-3 text-4xl font-semibold">{pick("This page doesn't exist.", "الصفحة دي مش موجودة.")}</h1>
        <Link to="/" className={`${btn.primary} mt-8`}>
          {pick("Back to the homepage", "ارجع للرئيسية")}
        </Link>
      </div>
    </main>
  );
}
