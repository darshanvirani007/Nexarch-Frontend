import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { shouldRetryReadRequest } from "./retry";

export class NexarchApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "NexarchApiError";
  }
}

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ? "/api/nexarch" : "";
}

export function isNexarchApiConfigured() {
  return Boolean(getApiBaseUrl()) && isSupabaseConfigured();
}

async function getAccessToken() {
  const { data, error } = await createClient().auth.getSession();
  if (error) throw new NexarchApiError(error.message, 401);
  if (!data.session?.access_token) {
    throw new NexarchApiError("Your session has expired. Please sign in again.", 401);
  }
  return data.session.access_token;
}

function errorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") return "The Nexarch API request failed.";
  const record = payload as Record<string, unknown>;
  if (typeof record.message === "string" && record.message) return record.message;
  if (record.errors && typeof record.errors === "object") {
    const first = Object.values(record.errors as Record<string, unknown>)[0];
    if (Array.isArray(first) && typeof first[0] === "string") return first[0];
  }
  return "The Nexarch API request failed.";
}

function waitForRetry() {
  return new Promise((resolve) => setTimeout(resolve, 1_500));
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) throw new NexarchApiError("The Nexarch API is not configured.", 503);

  const token = await getAccessToken();
  const method = (init.method ?? "GET").toUpperCase();
  let response: Response;
  let attempt = 0;

  while (true) {
    response = await fetch(`${baseUrl}${path.startsWith("/") ? path : `/${path}`}`, {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${token}`,
        ...init.headers,
      },
    });

    if (!shouldRetryReadRequest(method, response.status, attempt)) break;
    attempt += 1;
    await waitForRetry();
  }

  if (response.status === 204) return undefined as T;
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new NexarchApiError(errorMessage(payload), response.status);
  return payload as T;
}

export const nexarchApi = {
  list: <T>(resource: string, query = "") => apiRequest<T[]>(`/${resource}${query}`),
  get: <T>(path: string) => apiRequest<T>(path),
  create: <T>(resource: string, payload: Record<string, unknown>) =>
    apiRequest<T>(`/${resource}`, { method: "POST", body: JSON.stringify(payload) }),
  update: <T>(resource: string, id: string, payload: Record<string, unknown>) =>
    apiRequest<T>(`/${resource}/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  remove: (resource: string, id: string) =>
    apiRequest<void>(`/${resource}/${id}`, { method: "DELETE" }),
  profile: <T>() => apiRequest<T>("/profile"),
  updateProfile: <T>(payload: Record<string, unknown>) =>
    apiRequest<T>("/profile", { method: "PUT", body: JSON.stringify(payload) }),
  createBusinessLink: <T>(businessId: string, payload: Record<string, unknown>) =>
    apiRequest<T>(`/businesses/${businessId}/links`, { method: "POST", body: JSON.stringify(payload) }),
  updateBusinessLink: <T>(businessId: string, linkId: string, payload: Record<string, unknown>) =>
    apiRequest<T>(`/businesses/${businessId}/links/${linkId}`, { method: "PUT", body: JSON.stringify(payload) }),
  removeBusinessLink: (businessId: string, linkId: string) =>
    apiRequest<void>(`/businesses/${businessId}/links/${linkId}`, { method: "DELETE" }),
  createSocial: <T>(businessId: string, payload: Record<string, unknown>) =>
    apiRequest<T>(`/businesses/${businessId}/social-links`, { method: "POST", body: JSON.stringify(payload) }),
  updateSocial: <T>(businessId: string, socialId: string, payload: Record<string, unknown>) =>
    apiRequest<T>(`/businesses/${businessId}/social-links/${socialId}`, { method: "PUT", body: JSON.stringify(payload) }),
  removeSocial: (businessId: string, socialId: string) =>
    apiRequest<void>(`/businesses/${businessId}/social-links/${socialId}`, { method: "DELETE" }),
  saveBusinessNote: <T>(businessId: string, content: string) =>
    apiRequest<T>(`/businesses/${businessId}/note`, { method: "PUT", body: JSON.stringify({ content }) }),
  checkWebsite: <T>(businessId: string, url: string) =>
    apiRequest<T>(`/businesses/${businessId}/website-checks`, { method: "POST", body: JSON.stringify({ url }) }),
};
