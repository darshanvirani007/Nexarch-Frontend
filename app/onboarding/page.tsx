"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Building2, CircleUserRound, Goal, LayoutDashboard } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { Button, Field, inputClass, ProgressBar, SelectControl } from "@/components/ui";
import { useThemePalette } from "@/components/theme-palette-provider";
import { densityOptions, isDensity } from "@/lib/theme-palettes";
import { isAppearanceTheme } from "@/lib/appearance-preferences";

const steps = [
  { title: "Build your private workspace", description: "Choose the areas you want Nexarch to help you keep track of.", icon: CircleUserRound },
  { title: "Your businesses", description: "Add the first business you want to keep visible. The others are optional.", icon: Building2 },
  { title: "Your learning", description: "Add something you are learning now, or skip it for later.", icon: Goal },
  { title: "Your preferences", description: "Choose how Nexarch should look and which updates you want to see.", icon: LayoutDashboard },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { theme, setTheme, density, setDensity } = useThemePalette();
  const [step, setStep] = useState(0);
  const [businesses, setBusinesses] = useState(["", "", ""]);
  const CurrentIcon = steps[step].icon;
  return <main className="mx-auto flex min-h-screen max-w-6xl flex-col p-5 sm:p-8">
    <header className="flex items-center justify-between"><div className="flex items-center gap-3"><BrandMark className="size-9 rounded-xl" /><span className="font-semibold">Nexarch</span></div><button onClick={() => router.push("/dashboard")} className="muted text-sm hover:text-foreground">Skip for now</button></header>
    <div className="mx-auto my-auto w-full max-w-2xl py-14">
      <div className="mb-8 flex items-center justify-between"><p className="muted text-sm">Step {step + 1} of {steps.length}</p><p className="muted text-sm">{Math.round(((step + 1) / steps.length) * 100)}%</p></div><ProgressBar value={((step + 1) / steps.length) * 100} />
      <div className="mt-12"><span className="mb-5 grid size-12 place-items-center rounded-2xl bg-foreground text-background"><CurrentIcon className="size-5" /></span><h1 className="text-3xl font-semibold tracking-tight">{steps[step].title}</h1><p className="muted mt-2">{steps[step].description}</p></div>
      <div className="mt-9 min-h-64">
        {step === 0 && <div className="grid gap-4 sm:grid-cols-2"><Field label="First name"><input className={inputClass} placeholder="Your first name" autoComplete="given-name" /></Field><Field label="Last name"><input className={inputClass} placeholder="Your surname" autoComplete="family-name" /></Field><Field label="Timezone"><SelectControl options={["Europe/Dublin", "Europe/London", "America/New_York"]} defaultValue="Europe/Dublin" /></Field></div>}
        {step === 1 && <div className="grid gap-4">{businesses.map((value, index) => <Field key={index} label={`Business ${index + 1}${index === 0 ? "" : " (optional)"}`}><input value={value} onChange={(event) => setBusinesses((items) => items.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} className={inputClass} placeholder={["Northstar Studio","Blackbird Systems","Fieldnotes Press"][index]} /></Field>)}<p className="muted text-xs">After setup, each business can have a logo, website, inbox, social accounts, admin panel, hosting, domain, and custom shortcuts.</p></div>}
        {step === 2 && <div className="grid gap-4 sm:grid-cols-2"><Field label="First learning category"><SelectControl options={["Course", "Certification", "Book"]} /></Field><Field label="What do you want to learn?"><input className={inputClass} placeholder="Advanced TypeScript" /></Field></div>}
        {step === 3 && <div className="grid gap-4 sm:grid-cols-2"><Field label="Theme"><SelectControl value={theme} onValueChange={(value) => { if (isAppearanceTheme(value)) setTheme(value); }} options={[{ value: "dark", label: "Dark" }, { value: "light", label: "Light" }, { value: "system", label: "System" }]} /></Field><Field label="Density"><SelectControl value={density} onValueChange={(value) => { if (isDensity(value)) setDensity(value); }} options={densityOptions} /></Field><label className="flex items-center gap-3 rounded-xl border p-4 text-sm"><input type="checkbox" defaultChecked /> Show recent activity</label><label className="flex items-center gap-3 rounded-xl border p-4 text-sm"><input type="checkbox" defaultChecked /> Show personal progress</label></div>}
      </div>
      <div className="mt-8 flex justify-between"><Button variant="ghost" disabled={step === 0} onClick={() => setStep((value) => value - 1)}><ArrowLeft className="size-4" /> Back</Button><Button onClick={() => step === steps.length - 1 ? router.push("/dashboard") : setStep((value) => value + 1)}>{step === steps.length - 1 ? <><Check className="size-4" /> Finish setup</> : <>Continue <ArrowRight className="size-4" /></>}</Button></div>
    </div>
  </main>;
}
