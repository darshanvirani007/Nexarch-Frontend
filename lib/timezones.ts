const browserTimezones = typeof Intl.supportedValuesOf === "function"
  ? Intl.supportedValuesOf("timeZone")
  : ["Europe/Dublin", "Europe/London", "Asia/Kolkata", "America/New_York"];

export type NexarchTimezone = string;
export const timezoneValues = ["UTC", ...browserTimezones.filter((value) => value !== "UTC")];
export const timezoneOptions = timezoneValues.map((value) => ({
  value,
  label: value === "UTC" ? "UTC — Coordinated Universal Time" : value.replaceAll("_", " ").replace("/", " — "),
}));

const timezoneSet = new Set(timezoneValues);

export function isNexarchTimezone(value: string): value is NexarchTimezone {
  if (value === "UTC" || timezoneSet.has(value)) return true;
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export function detectBrowserTimezone(): NexarchTimezone {
  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return detected && isNexarchTimezone(detected) ? detected : "UTC";
}
