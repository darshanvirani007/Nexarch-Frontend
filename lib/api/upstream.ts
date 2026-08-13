const UNSAFE_PATH_SEGMENT = /^(?:\.{1,2}|)$/;

export function buildNexarchUpstreamUrl(baseUrl: string, path: string[], search: string) {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  const base = new URL(`${normalizedBaseUrl}/`);

  if (base.protocol !== "https:" && base.hostname !== "localhost") {
    throw new Error("The Nexarch API must use HTTPS.");
  }
  if (!path.length || path.some((segment) => UNSAFE_PATH_SEGMENT.test(segment))) {
    throw new Error("The Nexarch API path is invalid.");
  }

  const target = new URL(path.map(encodeURIComponent).join("/"), base);
  target.search = search;
  return target;
}
