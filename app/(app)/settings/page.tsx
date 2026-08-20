"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Download, KeyRound, LogOut, Save, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { PageHeader } from "@/components/app-shell";
import { useAuthSession } from "@/components/auth-session-provider";
import { Button, Field, inputClass, Modal, SectionHeading, SelectControl } from "@/components/ui";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { profileService } from "@/lib/supabase/profile";
import { accountSettingsSchema, changePasswordSchema } from "@/lib/validations";
import { useThemePalette } from "@/components/theme-palette-provider";
import { densityOptions, isDensity, isThemePalette, themePalettes } from "@/lib/theme-palettes";
import { isAppearanceTheme } from "@/lib/appearance-preferences";
import { timezoneOptions } from "@/lib/timezones";
import { passwordRequirements, protectedPasswordInputProps } from "@/lib/password-policy";
import { deleteMyAccount, downloadJsonExport, exportMyData } from "@/lib/privacy";

type AccountSettingsValues = z.input<typeof accountSettingsSchema>;
type ChangePasswordValues = z.input<typeof changePasswordSchema>;

const emptyProfile: AccountSettingsValues = {
  fullName: "",
  email: "",
  country: "",
  contactNumber: "",
  timezone: "Europe/Dublin",
};

export default function SettingsPage() {
  const { theme, setTheme, palette, setPalette, density, setDensity } = useThemePalette();
  const { user, profile, profileLoading, profileError, refreshProfile, updateCachedProfile } = useAuthSession();
  const router = useRouter();
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

  const {
    register: registerProfile,
    control: profileControl,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm<AccountSettingsValues>({ resolver: zodResolver(accountSettingsSchema), defaultValues: emptyProfile });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<ChangePasswordValues>({ resolver: zodResolver(changePasswordSchema), defaultValues: { password: "", confirmPassword: "" } });

  useEffect(() => {
    resetProfile(profile);
  }, [profile, resetProfile]);

  const saveProfile = handleProfileSubmit(async (values) => {
    if (!isSupabaseConfigured()) {
      toast.error("Profile updates are temporarily unavailable. Please try again later.");
      return;
    }

    setProfileSaving(true);
    const supabase = createClient();
    if (!user) {
      setProfileSaving(false);
      toast.error("Could not verify your account");
      return;
    }

    const emailChanged = user.email !== values.email;
    const { error: authError } = await supabase.auth.updateUser({
      ...(emailChanged ? { email: values.email } : {}),
      data: { full_name: values.fullName, country: values.country, contact_number: values.contactNumber, timezone: values.timezone },
    });
    if (authError) {
      setProfileSaving(false);
      toast.error(authError.message);
      return;
    }

    let profileError: Error | null = null;
    try {
      await profileService.update({
        full_name: values.fullName,
        country: values.country,
        contact_no: values.contactNumber,
        timezone: values.timezone,
      });
    } catch (error: unknown) {
      profileError = error instanceof Error ? error : new Error("Profile could not be saved");
    }
    setProfileSaving(false);
    if (profileError) {
      toast.error(profileError.message);
      return;
    }
    updateCachedProfile(values);
    toast.success(emailChanged ? "Profile saved. Confirm your new email address." : "Profile saved");
  });

  const changePassword = handlePasswordSubmit(async (values) => {
    if (!isSupabaseConfigured()) {
      toast.error("Password updates are temporarily unavailable. Please try again later.");
      return;
    }
    setPasswordSaving(true);
    const { error } = await createClient().auth.updateUser({ password: values.password });
    setPasswordSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    resetPassword();
    toast.success("Password updated");
  });

  const logout = async () => {
    if (isSupabaseConfigured()) await createClient().auth.signOut();
    router.push("/login");
  };

  const exportData = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      downloadJsonExport(await exportMyData());
      toast.success("Your data export is ready");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Your data could not be exported");
    } finally {
      setExporting(false);
    }
  };

  const eraseAccount = async () => {
    if (deleteConfirmation !== "DELETE" || deleting) return;
    setDeleting(true);
    try {
      await deleteMyAccount();
      router.replace("/login?account_deleted=1");
      router.refresh();
    } catch (error: unknown) {
      setDeleting(false);
      toast.error(error instanceof Error ? error.message : "Your account could not be deleted");
    }
  };

  return <>
    <PageHeader eyebrow="Workspace" title="Settings" description="Manage your account, appearance, and dashboard preferences." />
    <div className="grid max-w-4xl gap-8">
      <section>
        <SectionHeading title="Account details" description="The personal information connected to your Nexarch account." />
        <form className="panel grid gap-4 rounded-[22px] p-6 sm:grid-cols-2" onSubmit={saveProfile} noValidate>
          <Field label="Full name" error={profileErrors.fullName?.message}><input {...registerProfile("fullName")} className={inputClass} placeholder="Your full name" autoComplete="name" /></Field>
          <Field label="Email address" error={profileErrors.email?.message}><input {...registerProfile("email")} type="email" className={inputClass} placeholder="you@example.com" autoComplete="email" /></Field>
          <Field label="Country" error={profileErrors.country?.message}><input {...registerProfile("country")} className={inputClass} placeholder="Ireland" autoComplete="country-name" /></Field>
          <Field label="Contact number" error={profileErrors.contactNumber?.message}><input {...registerProfile("contactNumber")} type="tel" className={inputClass} placeholder="+353 87 123 4567" autoComplete="tel" inputMode="tel" /></Field>
          <Field label="Timezone" error={profileErrors.timezone?.message}><Controller name="timezone" control={profileControl} render={({ field }) => <SelectControl value={field.value} onValueChange={field.onChange} options={timezoneOptions} />} /></Field>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <Button type="submit" disabled={profileSaving}><Save className="size-4" /> {profileSaving ? "Saving…" : "Save account details"}</Button>
            {profileLoading && <p className="muted text-xs" role="status">Loading your saved profile…</p>}
            {profileError && <button type="button" className="text-xs font-medium underline decoration-foreground/30 underline-offset-4" onClick={() => void refreshProfile()}>Saved profile unavailable · Try again</button>}
          </div>
        </form>
      </section>

      <section>
        <SectionHeading title="Password" description="Set a new password without displaying or storing your existing password." />
        <form className="panel grid gap-4 rounded-[22px] p-6 sm:grid-cols-2" onSubmit={changePassword} noValidate>
          <Field label="New password" error={passwordErrors.password?.message}><input {...registerPassword("password")} {...protectedPasswordInputProps} type="password" className={inputClass} autoComplete="new-password" placeholder="10+ characters" /></Field>
          <Field label="Re-enter new password" error={passwordErrors.confirmPassword?.message}><input {...registerPassword("confirmPassword")} {...protectedPasswordInputProps} type="password" className={inputClass} autoComplete="new-password" placeholder="Repeat your password" /></Field>
          <p className="muted -mt-1 text-xs sm:col-span-2">{passwordRequirements}</p>
          <Button type="submit" variant="secondary" className="sm:col-span-2 sm:justify-self-start" disabled={passwordSaving}><KeyRound className="size-4" /> {passwordSaving ? "Updating…" : "Update password"}</Button>
        </form>
      </section>

      <section>
        <SectionHeading title="Appearance & density" description="Choose a refined colour palette while keeping the same Nexarch experience." />
        <div className="panel grid gap-4 rounded-[22px] p-6 sm:grid-cols-3">
          <Field label="Theme"><SelectControl value={theme} onValueChange={(value) => { if (isAppearanceTheme(value)) setTheme(value); }} options={[{ value: "dark", label: "Dark" }, { value: "light", label: "Light" }, { value: "system", label: "System" }]} /></Field>
          <Field label="Colour palette"><SelectControl value={palette} onValueChange={(value) => { if (isThemePalette(value)) setPalette(value); }} options={themePalettes} /></Field>
          <Field label="Density"><SelectControl value={density} onValueChange={(value) => { if (isDensity(value)) setDensity(value); }} options={densityOptions} /></Field>
        </div>
      </section>
      <section>
        <SectionHeading title="Privacy & your data" description="Access, download, or erase the personal data connected to your account." />
        <div className="panel grid gap-4 rounded-[22px] p-6 sm:grid-cols-2">
          <div className="rounded-2xl border p-5"><ShieldCheck className="size-5" /><h3 className="mt-4 text-sm font-semibold">Privacy notice</h3><p className="muted mt-1 text-xs leading-relaxed">Understand what Nexarch processes, why it is needed, and your data-protection rights.</p><Link href="/privacy" className="mt-4 inline-block text-sm font-medium underline underline-offset-4">Read privacy notice</Link></div>
          <div className="rounded-2xl border p-5"><Download className="size-5" /><h3 className="mt-4 text-sm font-semibold">Download your data</h3><p className="muted mt-1 text-xs leading-relaxed">Export your account and workspace records in a portable JSON file.</p><Button type="button" variant="secondary" className="mt-4" disabled={exporting} onClick={() => void exportData()}><Download className="size-4" /> {exporting ? "Preparing…" : "Download data"}</Button></div>
          <div className="rounded-2xl border border-red-500/20 p-5 sm:col-span-2"><Trash2 className="size-5 text-red-500" /><h3 className="mt-4 text-sm font-semibold">Delete your account</h3><p className="muted mt-1 text-xs leading-relaxed">Permanently erase your account, workspace records and server-side development secrets. Download your data first if you need a copy.</p><Button type="button" variant="danger" className="mt-4" onClick={() => setDeleteOpen(true)}><Trash2 className="size-4" /> Delete account</Button></div>
        </div>
      </section>
      <section><SectionHeading title="Session" /><div className="panel flex items-center justify-between gap-4 rounded-[22px] p-6"><div><p className="text-sm font-medium">Sign out securely</p><p className="muted mt-1 text-xs">End this session on this device.</p></div><Button variant="secondary" onClick={logout}><LogOut className="size-4" /> Sign out</Button></div></section>
    </div>
    <Modal open={deleteOpen} onOpenChange={(value) => { if (!deleting) { setDeleteOpen(value); if (!value) setDeleteConfirmation(""); } }} title="Permanently delete account" description="This cannot be undone. Your active Nexarch account and workspace data will be erased.">
      <div className="grid gap-4"><Field label="Type DELETE to confirm"><input value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} className={inputClass} autoComplete="off" /></Field><div className="flex justify-end gap-2"><Button type="button" variant="ghost" disabled={deleting} onClick={() => setDeleteOpen(false)}>Cancel</Button><Button type="button" variant="danger" disabled={deleteConfirmation !== "DELETE" || deleting} onClick={() => void eraseAccount()}>{deleting ? "Deleting…" : "Delete permanently"}</Button></div></div>
    </Modal>
  </>;
}
