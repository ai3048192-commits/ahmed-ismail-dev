const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

export const btn = {
  primary: `group/btn inline-flex items-center justify-center gap-2 rounded-pill bg-fg text-bg px-6 py-3.5 text-sm font-semibold transition-[background-color,transform] duration-200 hover:bg-accent hover:text-accent-fg active:scale-[0.98] ${ring}`,
  accent: `group/btn inline-flex items-center justify-center gap-2 rounded-pill bg-accent text-accent-fg px-6 py-3.5 text-sm font-semibold transition-[filter,transform] duration-200 hover:brightness-110 active:scale-[0.98] ${ring}`,
  ghost: `inline-flex items-center justify-center gap-2 rounded-pill border border-line bg-surface px-6 py-3.5 text-sm font-medium text-fg transition-colors hover:border-fg/30 ${ring}`,
  icon: `inline-flex h-10 w-10 items-center justify-center rounded-pill border border-line bg-surface text-fg transition-colors hover:border-fg/30 ${ring}`,
  chip: (on: boolean) =>
    `rounded-pill border px-4 py-2 text-sm transition-colors ${ring} ${on ? "border-fg bg-fg text-bg" : "border-line text-muted hover:text-fg hover:border-fg/30"}`,
};

/** the plain card surface used across the site */
export const tile = "rounded-3xl border border-line bg-surface";

/** form inputs */
export const field =
  "w-full rounded-2xl border border-line bg-bg px-4 py-3.5 text-fg placeholder:text-faint outline-none transition-colors focus:border-fg/40 focus-visible:ring-2 focus-visible:ring-accent/40";
