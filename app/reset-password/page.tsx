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

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);

  const updatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmation) return toast.error("Passwords do not match");
    if (!isSupabaseConfigured()) return toast.info("Password recovery activates when Supabase is configured");

    setLoading(true);
    const { error } = await createClient().auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    router.push("/dashboard");
    router.refresh();
  };

  return <main className="flex min-h-screen items-center justify-center p-6 sm:p-12">
    <div className="w-full max-w-md">
      <Link href="/" className="mb-12 flex items-center gap-3"><BrandMark /><span className="font-semibold">Nexarch</span></Link>
      <p className="muted mb-2 text-xs font-medium uppercase tracking-[.16em]">Secure account recovery</p>
      <h1 className="text-3xl font-semibold tracking-tight">Choose a new password</h1>
      <p className="muted mt-2 text-sm">Use at least eight characters.</p>
      <form className="mt-8 grid gap-4" onSubmit={updatePassword}>
        <Field label="New password"><div className="relative"><KeyRound className="muted absolute left-3 top-3.5 size-4" /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className={`${inputClass} pl-10`} minLength={8} autoComplete="new-password" required /></div></Field>
        <Field label="Confirm new password"><div className="relative"><KeyRound className="muted absolute left-3 top-3.5 size-4" /><input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className={`${inputClass} pl-10`} minLength={8} autoComplete="new-password" required /></div></Field>
        <Button type="submit" disabled={loading}>{loading && <InlineLoader />}{loading ? "Updating…" : "Update password"} {!loading && <ArrowRight className="size-4" />}</Button>
      </form>
    </div>
  </main>;
}
