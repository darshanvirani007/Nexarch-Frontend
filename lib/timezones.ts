export const timezoneOptions = [
  { value: "UTC", label: "UTC — Coordinated Universal Time" },
  { value: "Europe/Dublin", label: "Dublin" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Lisbon", label: "Lisbon" },
  { value: "Europe/Paris", label: "Paris" },
  { value: "Europe/Berlin", label: "Berlin" },
  { value: "Europe/Amsterdam", label: "Amsterdam" },
  { value: "Europe/Madrid", label: "Madrid" },
  { value: "Europe/Rome", label: "Rome" },
  { value: "Europe/Warsaw", label: "Warsaw" },
  { value: "Europe/Athens", label: "Athens" },
  { value: "Europe/Helsinki", label: "Helsinki" },
  { value: "Europe/Kyiv", label: "Kyiv" },
  { value: "Europe/Istanbul", label: "Istanbul" },
  { value: "Africa/Cairo", label: "Cairo" },
  { value: "Africa/Lagos", label: "Lagos" },
  { value: "Africa/Johannesburg", label: "Johannesburg" },
  { value: "Asia/Dubai", label: "Dubai" },
  { value: "Asia/Kolkata", label: "India — Kolkata" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Asia/Hong_Kong", label: "Hong Kong" },
  { value: "Asia/Tokyo", label: "Tokyo" },
  { value: "Asia/Seoul", label: "Seoul" },
  { value: "Australia/Perth", label: "Perth" },
  { value: "Australia/Adelaide", label: "Adelaide" },
  { value: "Australia/Sydney", label: "Sydney" },
  { value: "Australia/Melbourne", label: "Melbourne" },
  { value: "Pacific/Auckland", label: "Auckland" },
  { value: "America/Toronto", label: "Toronto" },
  { value: "America/Vancouver", label: "Vancouver" },
  { value: "America/New_York", label: "New York" },
  { value: "America/Chicago", label: "Chicago" },
  { value: "America/Denver", label: "Denver" },
  { value: "America/Los_Angeles", label: "Los Angeles" },
  { value: "America/Mexico_City", label: "Mexico City" },
  { value: "America/Sao_Paulo", label: "São Paulo" },
] as const;

export type NexarchTimezone = (typeof timezoneOptions)[number]["value"];
export const timezoneValues = timezoneOptions.map(({ value }) => value) as [NexarchTimezone, ...NexarchTimezone[]];

export function isNexarchTimezone(value: string): value is NexarchTimezone {
  return timezoneValues.includes(value as NexarchTimezone);
}
