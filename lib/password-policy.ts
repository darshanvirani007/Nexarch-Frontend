import type { ClipboardEvent, DragEvent, MouseEvent } from "react";
import { z } from "zod";

export const passwordRequirements = "Use 10 or more characters with a letter, number, and special character.";

export const strongPasswordSchema = z.string()
  .min(10, "Password must contain at least 10 characters")
  .max(72, "Password is too long")
  .regex(/[A-Za-z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

const preventClipboard = (event: ClipboardEvent<HTMLInputElement>) => event.preventDefault();
const preventDrop = (event: DragEvent<HTMLInputElement>) => event.preventDefault();

export const protectedPasswordInputProps = {
  onCopy: preventClipboard,
  onCut: preventClipboard,
  onPaste: preventClipboard,
  onDrop: preventDrop,
  onContextMenu: (event: MouseEvent<HTMLInputElement>) => event.preventDefault(),
} as const;
