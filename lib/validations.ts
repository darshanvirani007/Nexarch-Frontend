import { z } from "zod";
import { personalLinkKinds } from "./types";

const optionalUrl = z
  .string()
  .trim()
  .refine(
    (value) => !value || /^https?:\/\/.+/i.test(value),
    "Enter a full URL beginning with http:// or https://",
  );

const accountProfileFields = {
  email: z.email("Enter a valid email address"),
  fullName: z.string().trim().min(2, "Full name is required").max(100, "Full name is too long"),
  country: z.string().trim().min(2, "Country is required").max(80, "Country name is too long"),
  contactNumber: z.string().trim().regex(/^\+?[0-9][0-9\s().-]{6,24}$/, "Enter a valid contact number"),
};

export const signUpSchema = z.object({
  ...accountProfileFields,
  password: z.string().min(8, "Password must contain at least 8 characters").max(72, "Password is too long"),
  confirmPassword: z.string(),
}).refine((values) => values.password === values.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const accountSettingsSchema = z.object({
  ...accountProfileFields,
  timezone: z.enum(["Europe/Dublin", "Europe/London"]),
});

export const changePasswordSchema = z.object({
  password: z.string().min(8, "Password must contain at least 8 characters").max(72, "Password is too long"),
  confirmPassword: z.string(),
}).refine((values) => values.password === values.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const businessSchema = z.object({
  name: z.string().trim().min(2, "Business name is required").max(80),
  description: z.string().trim().min(2, "Business description is required").max(240),
  websiteUrl: optionalUrl,
  emailInboxUrl: optionalUrl,
  adminUrl: optionalUrl,
  hostingUrl: optionalUrl,
  domainUrl: optionalUrl,
});

export const businessLinkSchema = z.object({
  label: z.string().trim().min(2, "Label is required").max(50),
  url: optionalUrl.refine((value) => Boolean(value), "URL is required"),
  category: z.enum([
    "Website", "Development", "Hosting", "Domain", "Email",
    "Social", "Analytics", "Payments", "Documents", "Other",
  ]),
});

export const socialAccountSchema = z.object({
  platform: z.enum([
    "LinkedIn", "Instagram", "X", "YouTube", "Facebook",
    "TikTok", "GitHub", "Threads", "Reddit", "Blog", "Other",
  ]),
  accountName: z.string().trim().min(2, "Account name is required"),
  username: z.string().trim().default(""),
  profileUrl: optionalUrl.refine((value) => Boolean(value), "Profile URL is required"),
  showOnCard: z.boolean().default(true),
});

export const personalLinkSchema = z.object({
  name: z.string().trim().min(2, "Link name is required").max(80),
  kind: z.enum(personalLinkKinds),
  url: optionalUrl.refine((value) => Boolean(value), "URL is required"),
});

export const commerceStoreSchema = z.object({
  name: z.string().trim().min(2, "Store name is required").max(100),
  platform: z.enum(["Amazon", "Shopify", "WooCommerce", "Custom dropshipping store", "Manual", "Other"]),
  storeUrl: optionalUrl,
  adminUrl: optionalUrl,
  region: z.string().trim().max(80),
  currency: z.string().trim().length(3, "Use a three-letter currency code").transform((value) => value.toUpperCase()),
});

export const commerceProductSchema = z.object({
  name: z.string().trim().min(2, "Product name is required").max(160),
  storeId: z.string().uuid("Choose a valid store"),
  sku: z.string().trim().max(80),
  asin: z.string().trim().max(20),
  productUrl: optionalUrl,
  sellingPrice: z.number().nonnegative(),
  productCost: z.number().nonnegative(),
  shippingCost: z.number().nonnegative(),
  inventoryQuantity: z.number().int(),
  reorderThreshold: z.number().int().nonnegative(),
});

export const commerceOrderSchema = z.object({
  storeId: z.string().uuid("Choose a valid store"),
  externalOrderId: z.string().trim().min(1, "Order ID is required").max(120),
  orderDate: z.iso.date(),
  grossAmount: z.number().nonnegative(),
  discount: z.number().nonnegative(),
  refundAmount: z.number().nonnegative(),
  productCost: z.number().nonnegative(),
  marketplaceFees: z.number().nonnegative(),
  paymentFees: z.number().nonnegative(),
  shippingCost: z.number().nonnegative(),
  advertisingAllocation: z.number().nonnegative(),
});
