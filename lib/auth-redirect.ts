export type AppUrlEnvironment = "development" | "production" | "test";

export type AppUrlOptions = {
  configuredUrl?: string | null;
  browserOrigin?: string | null;
  environment?: AppUrlEnvironment;
};

const DEFAULT_AUTH_DESTINATION = "/login";

function isLocalHostname(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

function normalizeAppUrl(value: string, environment: AppUrlEnvironment) {
  const parsed = new URL(value.trim());
  const isLocalDevelopment = environment !== "production" && parsed.protocol === "http:" && isLocalHostname(parsed.hostname);
  const isSecure = parsed.protocol === "https:";

  if (!isSecure && !isLocalDevelopment) {
    throw new Error("The application URL must use HTTPS outside local development");
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash || (parsed.pathname !== "/" && parsed.pathname !== "")) {
    throw new Error("The application URL must contain only an origin");
  }

  return parsed.origin.replace(/\/$/, "");
}

export function safeInternalPath(value: string | null | undefined, fallback = DEFAULT_AUTH_DESTINATION) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\r\n]/.test(value)) {
    return fallback;
  }

  try {
    const base = new URL("https://nexarch.invalid");
    const parsed = new URL(value, base);
    if (parsed.origin !== base.origin) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function getAppUrl(options: AppUrlOptions = {}) {
  const environment = options.environment ?? process.env.NODE_ENV;
  const configuredUrl = options.configuredUrl === undefined
    ? process.env.NEXT_PUBLIC_APP_URL
    : options.configuredUrl;

  if (configuredUrl) return normalizeAppUrl(configuredUrl, environment);

  const browserOrigin = options.browserOrigin === undefined
    ? (typeof window === "undefined" ? null : window.location.origin)
    : options.browserOrigin;
  if (browserOrigin) return normalizeAppUrl(browserOrigin, environment);

  if (environment === "development" || environment === "test") return "http://localhost:3000";
  throw new Error("The application URL is not configured");
}

export function buildAuthCallbackUrl(nextPath = DEFAULT_AUTH_DESTINATION, options: AppUrlOptions = {}) {
  const callback = new URL("/auth/callback", getAppUrl(options));
  callback.searchParams.set("next", safeInternalPath(nextPath));
  return callback.toString();
}
