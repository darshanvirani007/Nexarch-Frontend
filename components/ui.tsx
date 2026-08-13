"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cloneElement, isValidElement, useId, useState } from "react";
import { Check, ChevronDown, ChevronUp, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Button({
  className, variant = "primary", ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium shadow-sm transition-[transform,background-color,border-color,box-shadow,opacity] duration-150 ease-out will-change-transform active:scale-[.98] disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "bg-foreground text-background shadow-black/10 hover:opacity-90",
        variant === "secondary" && "border bg-[var(--panel)] hover:border-foreground/20 hover:bg-foreground/5",
        variant === "ghost" && "hover:bg-foreground/7",
        variant === "danger" && "bg-red-500/12 text-red-500 hover:bg-red-500/20",
        className,
      )}
      {...props}
    />
  );
}

export function IconButton({ label, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button aria-label={label} title={label} className={cn("inline-flex size-10 items-center justify-center rounded-xl border bg-[var(--panel)] shadow-sm transition-[transform,background-color,border-color,box-shadow] duration-150 ease-out will-change-transform hover:border-foreground/20 hover:bg-foreground/5 active:scale-[.98]", className)} {...props} />
  );
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "green" | "yellow" | "red" | "neutral" }) {
  const tones = {
    green: "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20",
    yellow: "bg-amber-500/10 text-amber-500 ring-amber-500/20",
    red: "bg-red-500/10 text-red-500 ring-red-500/20",
    neutral: "bg-foreground/5 text-[var(--muted)] ring-foreground/10",
  };
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset", tones[tone])}>{children}</span>;
}

export function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  const generatedId = useId();
  const errorId = `${generatedId}-error`;
  const control = isValidElement<{ id?: string; "aria-describedby"?: string }>(children)
    ? cloneElement(children, {
      id: children.props.id || generatedId,
      "aria-describedby": error ? errorId : children.props["aria-describedby"],
    })
    : children;
  return (
    <div className="grid gap-2 text-sm font-medium">
      <label htmlFor={isValidElement<{ id?: string }>(control) ? control.props.id : generatedId}>{label}</label>
      {control}
      {error && <span id={errorId} className="text-xs font-normal text-red-500">{error}</span>}
    </div>
  );
}

export const inputClass = "premium-input h-11 w-full rounded-xl border px-3 text-sm placeholder:text-[var(--muted)]";

type SelectOption = string | { value: string; label: string };

export function SelectControl({
  options,
  value,
  defaultValue,
  onValueChange,
  name,
  id,
  className,
  placeholder = "Select an option",
  ariaLabel,
  "aria-describedby": ariaDescribedBy,
  disabled,
}: {
  options: readonly SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  id?: string;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
  "aria-describedby"?: string;
  disabled?: boolean;
}) {
  const items = options.map((option) => typeof option === "string" ? { value: option, label: option } : option);
  const [internalValue, setInternalValue] = useState(defaultValue ?? items[0]?.value ?? "");
  const selectedValue = value ?? internalValue;
  const emptyValue = "__nexarch_empty_value__";
  const radixValue = selectedValue === "" ? emptyValue : selectedValue;

  const changeValue = (nextValue: string) => {
    const cleanValue = nextValue === emptyValue ? "" : nextValue;
    if (value === undefined) setInternalValue(cleanValue);
    onValueChange?.(cleanValue);
  };

  return (
    <>
      {name && <input type="hidden" name={name} value={selectedValue} />}
      <SelectPrimitive.Root value={radixValue} onValueChange={changeValue} disabled={disabled}>
        <SelectPrimitive.Trigger
          id={id}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          className={cn(
            inputClass,
            "group/select inline-flex items-center justify-between gap-3 text-left data-[placeholder]:text-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-55",
            className,
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="size-3.5 shrink-0 text-[var(--muted)] transition-transform duration-200 group-data-[state=open]/select:rotate-180" strokeWidth={1.8} />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            side="bottom"
            align="start"
            sideOffset={8}
            collisionPadding={12}
            className="z-[100] max-h-[min(20rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-2xl border bg-[var(--panel-solid)] p-1.5 text-foreground shadow-[0_20px_70px_rgba(0,0,0,.22)]"
          >
            <SelectPrimitive.ScrollUpButton className="flex h-7 items-center justify-center text-[var(--muted)]">
              <ChevronUp className="size-3.5" />
            </SelectPrimitive.ScrollUpButton>
            <SelectPrimitive.Viewport>
              {items.map((item) => (
                <SelectPrimitive.Item
                  key={item.value}
                  value={item.value === "" ? emptyValue : item.value}
                  className="relative flex min-h-9 cursor-default select-none items-center rounded-xl py-2 pl-3 pr-9 text-sm outline-none transition data-[disabled]:pointer-events-none data-[disabled]:opacity-45 data-[highlighted]:bg-foreground data-[highlighted]:text-background"
                >
                  <SelectPrimitive.ItemText>{item.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="absolute right-3 inline-flex items-center">
                    <Check className="size-3.5" strokeWidth={2} />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
            <SelectPrimitive.ScrollDownButton className="flex h-7 items-center justify-center text-[var(--muted)]">
              <ChevronDown className="size-3.5" />
            </SelectPrimitive.ScrollDownButton>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </>
  );
}

export function Modal({ open, onOpenChange, title, description, children, contentClassName, headerClassName, bodyClassName }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  contentClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm" />
        <Dialog.Content className={cn("glass fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl p-6", contentClassName)}>
          <div className={cn("mb-6 pr-10", headerClassName)}>
            <Dialog.Title className="text-xl font-semibold">{title}</Dialog.Title>
            {description && <Dialog.Description className="muted mt-1 text-sm">{description}</Dialog.Description>}
          </div>
          <div className={bodyClassName}>{children}</div>
          <Dialog.Close className="absolute right-5 top-5 inline-flex size-9 items-center justify-center rounded-xl hover:bg-foreground/5" aria-label="Close">
            <X className="size-4" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function SectionHeading({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="section-title text-lg font-semibold tracking-tight">{title}</h2>
        {description && <p className="muted mt-1 text-sm">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return <div className="h-1.5 overflow-hidden rounded-full bg-foreground/8"><div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>;
}
