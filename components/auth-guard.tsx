"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthChangeEvent, Session, UserResponse } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { NexarchLoader } from "./nexarch-loader";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(!isSupabaseConfigured());

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    let active = true;

    void supabase.auth.getUser().then(({ data, error }: UserResponse) => {
      if (!active) return;
      if (error || !data.user) {
        router.replace("/login");
        return;
      }
      setReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === "SIGNED_OUT" || !session) {
        setReady(false);
        router.replace("/login");
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [router]);

  if (!ready) {
    return <main><NexarchLoader fullScreen label="Checking your session" description="Opening your private Nexarch workspace." /></main>;
  }
  return children;
}
