import { useSyncExternalStore } from "react";
import { useSettings } from "../lib/site-settings";

const query = "(prefers-reduced-motion: reduce)";
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(query);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const reduced = () => window.matchMedia(query).matches;

/** true when the dashboard allows motion and the visitor hasn't asked for less */
export function useMotionOK() {
  const reduce = useSyncExternalStore(subscribe, reduced, () => false);
  const { settings } = useSettings();
  return settings.animations && !reduce;
}
