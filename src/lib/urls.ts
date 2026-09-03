export function getAppBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL.trim()}`.replace(/\/$/, "");
  }
  return "http://localhost:3000";
}

export function getStudioUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_STUDIO_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  return getAppBaseUrl();
}

export function studioHref(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const studio = getStudioUrl();
  const app = getAppBaseUrl();
  if (studio === app) return normalized;
  return `${studio}${normalized}`;
}

export function storefrontHref(username: string): string {
  const path = `/u/${encodeURIComponent(username)}`;
  const app = getAppBaseUrl();
  const studio = getStudioUrl();
  if (studio !== app) return `${app}${path}`;
  return path;
}

export function isLocalDevHost(host: string): boolean {
  const h = host.split(":")[0]?.toLowerCase() ?? "";
  return h === "localhost" || h === "127.0.0.1";
}

export function isStudioHost(host: string): boolean {
  const h = host.split(":")[0]?.toLowerCase() ?? "";
  return h === "studio.pagate.cl" || h.startsWith("studio.");
}

export function isMarketingHost(host: string): boolean {
  const h = host.split(":")[0]?.toLowerCase() ?? "";
  return h === "pagate.cl" || h === "www.pagate.cl";
}
