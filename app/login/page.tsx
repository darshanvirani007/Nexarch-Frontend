"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound, Mail } from "lucide-react";
import { SiApple, SiGoogle } from "react-icons/si";
import { toast } from "sonner";
import { BrandMark } from "@/components/brand-mark";
import { InlineLoader } from "@/components/nexarch-loader";
import { Button, Field, inputClass } from "@/components/ui";
import { buildAuthCallbackUrl } from "@/lib/auth-redirect";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { isNexarchApiConfigured, nexarchApi } from "@/lib/api/client";
import { PublicFooter } from "@/components/public-footer";
import { LoginShowcase } from "@/components/login-showcase";
import { protectedPasswordInputProps } from "@/lib/password-policy";

type AuthMode = "login" | "forgot";
type OAuthProvider = "google" | "apple";

const providers = [
  { id: "google", label: "Google", icon: SiGoogle },
  { id: "apple", label: "Apple", icon: SiApple },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const error = search.get("error");
    if (search.get("verified") === "1") {
      toast.success("Email verified. You can now sign in.");
    }
    if (error === "verification_failed") {
      toast.error("Email verification could not be completed. The link may be invalid or expired.");
    }
    if (error === "oauth_callback_failed") {
      toast.error("Sign-in could not be completed. Please try again.");
    }
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isSupabaseConfigured()) {
      toast.error("Sign-in is temporarily unavailable. Please try again later.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    if (mode === "forgot") {
      let redirectTo: string;
      try {
        redirectTo = buildAuthCallbackUrl("/reset-password");
      } catch {
        setLoading(false);
        toast.error("Password recovery is temporarily unavailable. Please try again later.");
        return;
      }
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("Password reset instructions sent");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (isNexarchApiConfigured()) void nexarchApi.get<unknown>("/health").catch(() => undefined);
    router.push("/dashboard");
    router.refresh();
  };

  const continueWith = async (provider: OAuthProvider) => {
    if (!isSupabaseConfigured()) {
      toast.error("Sign-in is temporarily unavailable. Please try again later.");
      return;
    }

    setLoadingProvider(provider);
    let redirectTo: string;
    try {
      redirectTo = buildAuthCallbackUrl("/dashboard");
    } catch {
      setLoadingProvider(null);
      toast.error("Sign-in is temporarily unavailable. Please try again later.");
      return;
    }
    const { error } = await createClient().auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });

    if (error) {
      setLoadingProvider(null);
      toast.error(error.message);
    }
  };

  const heading = mode === "forgot" ? "Reset your password" : "Welcome back to Nexarch";
  const supportingText = mode === "forgot" ? "We’ll send instructions to your email." : "Everything important, one clear view.";

  return <main className="grid min-h-screen lg:grid-cols-2">
    <section className="flex flex-col p-6 sm:p-12">
      <div className="my-auto w-full max-w-md self-center py-10">
        <Link href="/" className="mb-12 flex items-center gap-3"><BrandMark /><span className="font-semibold">Nexarch</span></Link>
        <p className="muted mb-2 text-xs font-medium uppercase tracking-[.16em]">Private by design</p>
        <h1 className="text-3xl font-semibold tracking-tight">{heading}</h1>
        <p className="muted mt-2 text-sm">{supportingText}</p>

        <form className="mt-8 grid gap-4" onSubmit={submit}>
          <Field label="Email address">
            <div className="relative"><Mail className="muted absolute left-3 top-3.5 size-4" /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={`${inputClass} pl-10`} placeholder="you@example.com" autoComplete="email" required /></div>
          </Field>
          {mode !== "forgot" && <Field label="Password">
            <div className="relative"><KeyRound className="muted absolute left-3 top-3.5 size-4" /><input {...protectedPasswordInputProps} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className={`${inputClass} pl-10`} autoComplete="current-password" required /></div>
          </Field>}
          <Button type="submit" disabled={loading || loadingProvider !== null}>
            {loading && <InlineLoader />}{loading ? "Please wait…" : mode === "forgot" ? "Send reset instructions" : "Sign in"} {!loading && <ArrowRight className="size-4" />}
          </Button>
        </form>

        {mode !== "forgot" && <>
          <div className="my-6 flex items-center gap-3"><span className="h-px flex-1 bg-[var(--border)]" /><span className="muted text-xs">or continue with</span><span className="h-px flex-1 bg-[var(--border)]" /></div>
          <div className="grid grid-cols-2 gap-3">
            {providers.map(({ id, label, icon: Icon }) => (
              <Button key={id} type="button" variant="secondary" disabled={loading || loadingProvider !== null} onClick={() => continueWith(id)}>
                <Icon className="size-4" aria-hidden="true" />
                {loadingProvider === id && <InlineLoader />}{loadingProvider === id ? "Connecting…" : label}
              </Button>
            ))}
          </div>
        </>}

        <div className="muted mt-7 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {mode === "login" && <Link href="/signup" className="hover:text-foreground">Create an account</Link>}
          {mode === "login" && <button type="button" onClick={() => setMode("forgot")} className="hover:text-foreground">Forgot password?</button>}
          {mode === "forgot" && <button type="button" onClick={() => setMode("login")} className="hover:text-foreground">Back to sign in</button>}
        </div>

      </div>
      <div className="lg:hidden"><PublicFooter /></div>
    </section>
    <LoginShowcase />
  </main>;
}
