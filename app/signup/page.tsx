"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowRight, Check, Earth, KeyRound, Mail, MailCheck, Phone, RefreshCw, UserRound } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { BrandMark } from "@/components/brand-mark";
import { InlineLoader } from "@/components/nexarch-loader";
import { Button, Field, inputClass } from "@/components/ui";
import { buildAuthCallbackUrl } from "@/lib/auth-redirect";
import { resendSignupVerification } from "@/lib/auth-verification";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { signUpSchema } from "@/lib/validations";
import { initializeUserAppearance } from "@/lib/appearance-preferences";
import { PublicFooter } from "@/components/public-footer";

type SignUpValues = z.input<typeof signUpSchema>;

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", fullName: "", country: "", contactNumber: "", password: "", confirmPassword: "" },
  });

  const createAccount = handleSubmit(async (values) => {
    if (loading) return;
    if (!isSupabaseConfigured()) {
      toast.error("Account creation is temporarily unavailable. Please try again later.");
      return;
    }

    let callbackUrl: string;
    try {
      callbackUrl = buildAuthCallbackUrl("/onboarding");
    } catch {
      toast.error("Account verification is temporarily unavailable. Please try again later.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await createClient().auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: callbackUrl,
          data: {
            full_name: values.fullName,
            country: values.country,
            contact_number: values.contactNumber,
          },
        },
      });

      if (error) {
        toast.error("We could not create your account. Please check your details and try again.");
        return;
      }
      if (data.user) initializeUserAppearance(window.localStorage, data.user.id);
      if (data.session) {
        toast.success("Account created");
        router.push("/onboarding");
        router.refresh();
        return;
      }
      setVerificationEmail(values.email.trim());
      toast.success("Check your email to verify your account.");
    } catch {
      toast.error("We could not create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  });

  const resendVerification = async () => {
    if (resending || !verificationEmail || !isSupabaseConfigured()) return;
    const parsedEmail = z.string().trim().email().safeParse(verificationEmail);
    if (!parsedEmail.success) {
      toast.error("Enter a valid email address before requesting another email.");
      return;
    }

    setResending(true);
    try {
      const { error } = await resendSignupVerification(createClient().auth, parsedEmail.data);
      if (error) {
        toast.error("We could not resend the verification email. Please wait a moment and try again.");
        return;
      }
      toast.success("If verification is still required, a new email has been sent.");
    } catch {
      toast.error("We could not resend the verification email. Please wait a moment and try again.");
    } finally {
      setResending(false);
    }
  };

  return <main className="grid min-h-screen lg:grid-cols-2">
    <section className="flex flex-col p-6 sm:p-12">
      <div className="my-auto w-full max-w-xl self-center py-10">
        <Link href="/" className="mb-10 flex items-center gap-3"><BrandMark /><span className="font-semibold">Nexarch</span></Link>
        <p className="muted mb-2 text-xs font-medium uppercase tracking-[.16em]">Create your account</p>
        <h1 className="text-3xl font-semibold tracking-tight">Create your Nexarch</h1>
        <p className="muted mt-2 text-sm">Build one place to keep track of everything you’re working on.</p>

        {verificationEmail ? (
          <div className="panel mt-8 rounded-3xl p-6 sm:p-8">
            <div className="grid size-12 place-items-center rounded-2xl bg-foreground text-background shadow-lg shadow-black/10"><MailCheck className="size-5" aria-hidden="true" /></div>
            <h2 className="mt-5 text-xl font-semibold">Check your email to verify your account.</h2>
            <p className="muted mt-2 text-sm leading-relaxed">We sent a verification link to <span className="font-medium text-foreground">{verificationEmail}</span>. Click that link before signing in.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button type="button" onClick={resendVerification} disabled={resending}>
                {resending ? <InlineLoader /> : <RefreshCw className="size-4" aria-hidden="true" />}
                {resending ? "Sending…" : "Resend verification email"}
              </Button>
              <Link href="/login" className="inline-flex h-10 items-center justify-center rounded-xl border bg-[var(--panel-solid)] px-4 text-sm font-medium transition hover:border-[var(--line-strong)] active:scale-[.98]">Back to sign in</Link>
            </div>
          </div>
        ) : (
          <>
            <form className="mt-8 grid gap-4 sm:grid-cols-2" onSubmit={createAccount} noValidate>
              <div className="sm:col-span-2"><Field label="Email address" error={errors.email?.message}><div className="relative"><Mail className="muted absolute left-3 top-3.5 size-4" /><input {...register("email")} type="email" className={`${inputClass} pl-10`} placeholder="you@example.com" autoComplete="email" /></div></Field></div>
              <Field label="Full name" error={errors.fullName?.message}><div className="relative"><UserRound className="muted absolute left-3 top-3.5 size-4" /><input {...register("fullName")} className={`${inputClass} pl-10`} placeholder="Your full name" autoComplete="name" /></div></Field>
              <Field label="Country" error={errors.country?.message}><div className="relative"><Earth className="muted absolute left-3 top-3.5 size-4" /><input {...register("country")} className={`${inputClass} pl-10`} placeholder="Ireland" autoComplete="country-name" /></div></Field>
              <div className="sm:col-span-2"><Field label="Contact number" error={errors.contactNumber?.message}><div className="relative"><Phone className="muted absolute left-3 top-3.5 size-4" /><input {...register("contactNumber")} type="tel" className={`${inputClass} pl-10`} placeholder="+353 87 123 4567" autoComplete="tel" inputMode="tel" /></div></Field></div>
              <Field label="Password" error={errors.password?.message}><div className="relative"><KeyRound className="muted absolute left-3 top-3.5 size-4" /><input {...register("password")} type="password" className={`${inputClass} pl-10`} autoComplete="new-password" /></div></Field>
              <Field label="Re-enter password" error={errors.confirmPassword?.message}><div className="relative"><KeyRound className="muted absolute left-3 top-3.5 size-4" /><input {...register("confirmPassword")} type="password" className={`${inputClass} pl-10`} autoComplete="new-password" /></div></Field>
              <Button type="submit" className="mt-2 sm:col-span-2" disabled={loading}>{loading && <InlineLoader />}{loading ? "Creating account…" : "Create account"} {!loading && <ArrowRight className="size-4" />}</Button>
            </form>

            <p className="muted mt-6 text-sm">Already have an account? <Link href="/login" className="font-medium text-foreground hover:opacity-70">Sign in</Link></p>
          </>
        )}
        <p className="muted mt-8 rounded-xl border p-3 text-xs leading-relaxed">Your contact details are stored in your private profile and are only accessible to your account.</p>
      </div>
      <div className="lg:hidden"><PublicFooter /></div>
    </section>
    <aside className="hidden border-l bg-foreground text-background lg:flex lg:flex-col lg:justify-between lg:p-14"><div className="text-sm font-medium">Everything you’re building, one clear view.</div><div><h2 className="max-w-xl text-5xl font-semibold leading-[1.05] tracking-[-.05em]">One account.<br />One clear view.<br />Everything that matters.</h2><ul className="mt-10 space-y-3 text-sm opacity-70">{["Keep your businesses and accounts together","Track learning, goals and daily priorities","Know what needs your attention"].map((item) => <li key={item} className="flex items-center gap-2"><Check className="size-4" />{item}</li>)}</ul></div><div className="grid gap-2"><p className="text-xs opacity-50">Nexarch · Your Private Workspace</p><PublicFooter inverse /></div></aside>
  </main>;
}
