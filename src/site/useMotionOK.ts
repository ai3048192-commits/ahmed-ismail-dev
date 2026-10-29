import { useReducedMotion } from "framer-motion";
import { useSettings } from "../lib/site-settings";

/** true when the dashboard allows motion and the visitor hasn't asked for less */
export function useMotionOK() {
  const reduce = useReducedMotion();
  const { settings } = useSettings();
  return settings.animations && !reduce;
}
