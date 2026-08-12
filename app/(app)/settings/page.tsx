"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { KeyRound, LogOut, Save } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { PageHeader } from "@/components/app-shell";
import { Button, Field, inputClass, SectionHeading, SelectControl } from "@/components/ui";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { isNexarchApiConfigured, nexarchApi } from "@/lib/api/client";
import type { ProfileResponse } from "@/lib/api/mappers";
import { accountSettingsSchema, changePasswordSchema } from "@/lib/validations";
import { useThemePalette } from "@/components/theme-palette-provider";
import { densityOptions, isDensity, isThemePalette, themePalettes } from "@/lib/theme-palettes";
import { isAppearanceTheme } from "@/lib/appearance-preferences";

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
  const router = useRouter();
  const [profileLoading, setProfileLoading] = useState(isSupabaseConfigured());
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

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
    if (!isSupabaseConfigured()) return;
    let active = true;
    const loadProfile = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (!active) return;
        if (userError || !user) {
          setProfileLoading(false);
          toast.error(userError?.message || "Could not load your account");
          return;
        }
        const response = isNexarchApiConfigured()
          ? await nexarchApi.profile<ProfileResponse>()
          : { profile: null, email: user.email ?? null };
        if (!active) return;
        const profile = response.profile;
        resetProfile({
          email: response.email || user.email || "",
          fullName: profile?.full_name || String(user.user_metadata.full_name || user.user_metadata.name || ""),
          country: profile?.country || String(user.user_metadata.country || ""),
          contactNumber: profile?.contact_no || String(user.user_metadata.contact_number || ""),
          timezone: profile?.timezone === "Europe/London" ? "Europe/London" : "Europe/Dublin",
        });
      } catch (error: unknown) {
        if (!active) return;
        toast.error(error instanceof Error ? error.message : "Could not load your account");
      } finally {
        if (active) setProfileLoading(false);
      }
    };
    void loadProfile();
    return () => { active = false; };
  }, [resetProfile]);

  const saveProfile = handleProfileSubmit(async (values) => {
    if (!isSupabaseConfigured()) {
      toast.error("Profile updates are temporarily unavailable. Please try again later.");
      return;
    }

    setProfileSaving(true);
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setProfileSaving(false);
      toast.error(userError?.message || "Could not verify your account");
      return;
    }

    const emailChanged = user.email !== values.email;
    const { error: authError } = await supabase.auth.updateUser({
      ...(emailChanged ? { email: values.email } : {}),
      data: { full_name: values.fullName, country: values.country, contact_number: values.contactNumber },
    });
    if (authError) {
      setProfileSaving(false);
      toast.error(authError.message);
      return;
    }

    let profileError: Error | null = null;
    if (isNexarchApiConfigured()) {
      try {
        await nexarchApi.updateProfile({
          full_name: values.fullName,
          country: values.country,
          contact_no: values.contactNumber,
          timezone: values.timezone,
        });
      } catch (error: unknown) {
        profileError = error instanceof Error ? error : new Error("Profile could not be saved");
      }
    }
    setProfileSaving(false);
    if (profileError) {
      toast.error(profileError.message);
      return;
    }
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

  return <>
    <PageHeader eyebrow="Workspace" title="Settings" description="Manage your account, appearance, and dashboard preferences." />
    <div className="grid max-w-4xl gap-8">
      <section>
        <SectionHeading title="Account details" description="The personal information connected to your Nexarch account." />
        <form className="panel grid gap-4 rounded-[22px] p-6 sm:grid-cols-2" onSubmit={saveProfile} noValidate>
          <Field label="Full name" error={profileErrors.fullName?.message}><input {...registerProfile("fullName")} className={inputClass} placeholder="Your full name" autoComplete="name" disabled={profileLoading} /></Field>
          <Field label="Email address" error={profileErrors.email?.message}><input {...registerProfile("email")} type="email" className={inputClass} placeholder="you@example.com" autoComplete="email" disabled={profileLoading} /></Field>
          <Field label="Country" error={profileErrors.country?.message}><input {...registerProfile("country")} className={inputClass} placeholder="Ireland" autoComplete="country-name" disabled={profileLoading} /></Field>
          <Field label="Contact number" error={profileErrors.contactNumber?.message}><input {...registerProfile("contactNumber")} type="tel" className={inputClass} placeholder="+353 87 123 4567" autoComplete="tel" inputMode="tel" disabled={profileLoading} /></Field>
          <Field label="Timezone" error={profileErrors.timezone?.message}><Controller name="timezone" control={profileControl} render={({ field }) => <SelectControl value={field.value} onValueChange={field.onChange} options={["Europe/Dublin", "Europe/London"]} disabled={profileLoading} />} /></Field>
          <Button type="submit" className="sm:col-span-2 sm:justify-self-start" disabled={profileLoading || profileSaving}><Save className="size-4" /> {profileSaving ? "Saving…" : "Save account details"}</Button>
        </form>
      </section>

      <section>
        <SectionHeading title="Password" description="Set a new password without displaying or storing your existing password." />
        <form className="panel grid gap-4 rounded-[22px] p-6 sm:grid-cols-2" onSubmit={changePassword} noValidate>
          <Field label="New password" error={passwordErrors.password?.message}><input {...registerPassword("password")} type="password" className={inputClass} autoComplete="new-password" placeholder="At least 8 characters" /></Field>
          <Field label="Re-enter new password" error={passwordErrors.confirmPassword?.message}><input {...registerPassword("confirmPassword")} type="password" className={inputClass} autoComplete="new-password" placeholder="Repeat your password" /></Field>
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
      <section><SectionHeading title="Session" /><div className="panel flex items-center justify-between gap-4 rounded-[22px] p-6"><div><p className="text-sm font-medium">Sign out securely</p><p className="muted mt-1 text-xs">End this session on this device.</p></div><Button variant="secondary" onClick={logout}><LogOut className="size-4" /> Sign out</Button></div></section>
    </div>
  </>;
}
