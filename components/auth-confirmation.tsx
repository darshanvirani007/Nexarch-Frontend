"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Check } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { PublicFooter } from "@/components/public-footer";

export type ConfirmationStatus = "success" | "error";
export const EMAIL_CONFIRMATION_DELAY_MS = 2_000;

type TimerHandle = ReturnType<typeof setTimeout>;

export function startEmailConfirmationRedirect(
  status: ConfirmationStatus,
  nextPath: string,
  navigate: (path: string) => void,
  schedule: (callback: () => void, delay: number) => TimerHandle = setTimeout,
  cancel: (handle: TimerHandle) => void = clearTimeout,
) {
  if (status === "error") return () => undefined;
  const timer = schedule(() => navigate(nextPath), EMAIL_CONFIRMATION_DELAY_MS);
  return () => cancel(timer);
}

export function AuthConfirmationView({ status, nextPath }: { status: ConfirmationStatus; nextPath: string }) {
  const success = status === "success";
  return (
    <main className="flex min-h-screen flex-col p-6 sm:p-12">
      <section className="page-content my-auto w-full max-w-lg self-center py-10">
        <Link href="/" className="mx-auto mb-8 flex w-fit items-center gap-3">
          <BrandMark />
          <span className="font-semibold">Nexarch</span>
        </Link>
        <div className="panel rounded-3xl p-7 text-center sm:p-10">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl border bg-foreground text-background shadow-lg shadow-black/10">
            {success ? <Check className="size-6" aria-hidden="true" /> : <AlertCircle className="size-6" aria-hidden="true" />}
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">
            {success ? "Email verified" : "Verification could not be completed"}
          </h1>
          {success ? (
            <div className="muted mt-3 space-y-1 text-sm leading-relaxed">
              <p>Your email has been verified successfully.</p>
              <p>Redirecting you to Nexarch…</p>
            </div>
          ) : (
            <div className="muted mt-3 space-y-3 text-sm leading-relaxed">
              <p>This link may be invalid, expired, or already used.</p>
              <p>Your email may already be verified. Try signing in with your email and password.</p>
            </div>
          )}

          {success ? (
            <Link href={nextPath} className="mt-7 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90 active:scale-[.98]">
              Continue to Nexarch <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          ) : (
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <Link href="/login" className="inline-flex h-10 items-center justify-center rounded-xl bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90 active:scale-[.98]">Go to sign in</Link>
              <Link href="/signup" className="inline-flex h-10 items-center justify-center rounded-xl border bg-[var(--panel-solid)] px-4 text-sm font-medium transition hover:border-[var(--line-strong)] active:scale-[.98]">Create a new account</Link>
            </div>
          )}
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}

export function AuthConfirmation({ status, nextPath }: { status: ConfirmationStatus; nextPath: string }) {
  const router = useRouter();
  useEffect(
    () => startEmailConfirmationRedirect(status, nextPath, (path) => router.replace(path)),
    [nextPath, router, status],
  );
  return <AuthConfirmationView status={status} nextPath={nextPath} />;
}
