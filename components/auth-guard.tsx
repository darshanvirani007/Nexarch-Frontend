"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/components/auth-session-provider";
import { NexarchLoader } from "./nexarch-loader";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status } = useAuthSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [router, status]);

  if (status !== "authenticated") {
    return <main><NexarchLoader fullScreen label="Checking your session" description="Opening your private Nexarch workspace." /></main>;
  }
  return children;
}
