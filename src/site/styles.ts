export const btn = {
  primary:
    "group/btn relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-pill bg-grad text-white px-6 py-3.5 text-sm font-semibold shadow-[0_18px_45px_-15px_var(--accent)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_55px_-12px_var(--accent-2)] active:translate-y-0",
  ghost:
    "glass inline-flex items-center justify-center gap-2 rounded-pill px-6 py-3.5 text-sm font-medium text-fg transition-colors hover:bg-surface-2",
  icon: "glass inline-flex h-10 w-10 items-center justify-center rounded-pill text-fg transition-colors hover:bg-surface-2",
  chip: (on: boolean) =>
    `rounded-pill px-4 py-2 text-sm transition-all ${on ? "bg-grad text-white shadow-[0_10px_30px_-12px_var(--accent)]" : "glass text-muted hover:text-fg"}`,
};

/** the frosted surface used across the site */
export const tile = "glass rounded-3xl";
