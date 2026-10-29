import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export type AdminState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "admin"; session: Session };

/** a signed-in user only counts if public.is_admin() says so; anyone else is signed straight out */
export async function checkAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_admin");
  if (error) console.error("is_admin:", error.message);
  return data === true;
}

export function useAdmin(): AdminState {
  const [state, setState] = useState<AdminState>({ status: "loading" });

  useEffect(() => {
    let alive = true;
    const resolve = async (session: Session | null) => {
      if (!session) return alive && setState({ status: "signed-out" });
      const ok = await checkAdmin();
      if (!alive) return;
      if (ok) setState({ status: "admin", session });
      else {
        await supabase.auth.signOut();
        setState({ status: "signed-out" });
      }
    };

    supabase.auth.getSession().then(({ data }) => resolve(data.session));
    // supabase warns against awaiting its own calls inside this callback, hence the setTimeout
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") setTimeout(() => resolve(session), 0);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
