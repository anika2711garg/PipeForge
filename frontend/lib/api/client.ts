import { ApiError } from "./types";

const REQUEST_TIMEOUT_MS = 60_000;

const FALLBACK_API_URLS = [
  "http://127.0.0.1:8002",
  "http://localhost:8002",
  "http://127.0.0.1:8001",
  "http://localhost:8001",
  "http://127.0.0.1:8000",
  "http://localhost:8000",
];

let resolvedBaseUrl: string | null = null;
let resolvePromise: Promise<string> | null = null;

function configuredUrl(): string | null {
  const configured = process.env.NEXT_PUBLIC_PIPEFORGE_API_URL?.trim();
  return configured ? configured.replace(/\/$/, "") : null;
}

function candidateUrls(): string[] {
  const urls = [configuredUrl(), ...FALLBACK_API_URLS].filter((value): value is string => Boolean(value));
  return [...new Set(urls)];
}

export function getApiBaseUrl(): string {
  return resolvedBaseUrl ?? configuredUrl() ?? FALLBACK_API_URLS[0];
}

async function looksLikePipeForge(base: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(`${base}/api/health`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      return false;
    }
    const payload = (await response.json().catch(() => null)) as { api?: string } | null;
    return Boolean(payload && typeof payload.api === "string");
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function resolveApiBaseUrl(): Promise<string> {
  if (resolvedBaseUrl) {
    return resolvedBaseUrl;
  }
  if (!resolvePromise) {
    resolvePromise = (async () => {
      for (const base of candidateUrls()) {
        if (await looksLikePipeForge(base)) {
          resolvedBaseUrl = base;
          return base;
        }
      }
      resolvedBaseUrl = configuredUrl() ?? FALLBACK_API_URLS[0];
      return resolvedBaseUrl;
    })().finally(() => {
      resolvePromise = null;
    });
  }
  return resolvePromise;
}

function joinUrl(base: string, path: string): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(joinUrl(base, path), {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(options?.body ? { "Content-Type": "application/json" } : {}),
        ...options?.headers,
      },
    });

    const payload = (await response.json().catch(() => ({}))) as {
      detail?: string | Array<{ msg?: string }>;
    };

    if (!response.ok) {
      const detail = payload.detail;
      const message =
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
            ? detail.map((item) => item.msg ?? "Request failed").join("; ")
            : `Request failed (${response.status})`;
      throw new ApiError(message, response.status);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Request timed out", 408);
    }
    resolvedBaseUrl = null;
    throw new ApiError(
      error instanceof Error ? error.message : "PipeForge API is currently unavailable.",
      0,
    );
  } finally {
    clearTimeout(timer);
  }
}

export function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path);
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
