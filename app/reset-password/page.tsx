"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { BrandMark } from "@/components/brand-mark";
import { InlineLoader } from "@/components/nexarch-loader";
import { Button, Field, inputClass } from "@/components/ui";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { PublicFooter } from "@/components/public-footer";
import { passwordRequirements, protectedPasswordInputProps } from "@/lib/password-policy";
import { changePasswordSchema } from "@/lib/validations";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmation?: string }>({});

  const updatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = changePasswordSchema.safeParse({ password, confirmPassword: confirmation });
    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors;
      setFieldErrors({ password: flattened.password?.[0], confirmation: flattened.confirmPassword?.[0] });
      return;
    }
    setFieldErrors({});
    if (!isSupabaseConfigured()) return toast.info("Password recovery activates when Supabase is configured");

    setLoading(true);
    const { error } = await createClient().auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    router.push("/dashboard");
    router.refresh();
  };

  return <main className="flex min-h-screen flex-col p-6 sm:p-12">
    <div className="my-auto w-full max-w-md self-center py-10">
      <Link href="/" className="mb-12 flex items-center gap-3"><BrandMark /><span className="font-semibold">Nexarch</span></Link>
      <p className="muted mb-2 text-xs font-medium uppercase tracking-[.16em]">Secure account recovery</p>
      <h1 className="text-3xl font-semibold tracking-tight">Choose a new password</h1>
      <p className="muted mt-2 text-sm">{passwordRequirements}</p>
      <form className="mt-8 grid gap-4" onSubmit={updatePassword} noValidate>
        <Field label="New password" error={fieldErrors.password}><div className="relative"><KeyRound className="muted absolute left-3 top-3.5 size-4" /><input {...protectedPasswordInputProps} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className={`${inputClass} pl-10`} autoComplete="new-password" required /></div></Field>
        <Field label="Confirm new password" error={fieldErrors.confirmation}><div className="relative"><KeyRound className="muted absolute left-3 top-3.5 size-4" /><input {...protectedPasswordInputProps} type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className={`${inputClass} pl-10`} autoComplete="new-password" required /></div></Field>
        <Button type="submit" disabled={loading}>{loading && <InlineLoader />}{loading ? "Updating…" : "Update password"} {!loading && <ArrowRight className="size-4" />}</Button>
      </form>
    </div>
    <PublicFooter />
  </main>;
}
