/** lets the sidebar badge refresh without a reload */
export const MESSAGES_CHANGED = "admin:messages-changed";

export const fmtDate = (iso: string, withTime = false) =>
  new Date(iso).toLocaleString("ar-EG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });

export function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat("ar", { numeric: "auto" });
  if (s < 60) return "دلوقتي";
  if (s < 3600) return rtf.format(-Math.floor(s / 60), "minute");
  if (s < 86400) return rtf.format(-Math.floor(s / 3600), "hour");
  if (s < 86400 * 30) return rtf.format(-Math.floor(s / 86400), "day");
  return fmtDate(iso);
}
