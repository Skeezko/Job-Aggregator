import type {
  LoginResponse,
  Me,
  Offer,
  OfferListItem,
  OffersFilter,
  SavedOffer,
  User,
} from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export function setToken(token: string): void {
  localStorage.setItem("access_token", token);
}

export function clearToken(): void {
  localStorage.removeItem("access_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // credentials: include so the HttpOnly refresh_token cookie is sent on
  // /refresh and /logout, and so CORS allow-credentials is honoured.
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    let message = res.statusText;
    let code: string | undefined;
    try {
      const body = await res.json();
      message = body?.error?.message ?? body?.message ?? message;
      code = body?.error?.code;
    } catch {
      // body wasn't JSON
    }
    const err = new Error(message) as Error & { status: number; code?: string };
    err.status = res.status;
    err.code = code;
    throw err;
  }

  if (res.status === 204) return undefined as T;
  // Some endpoints return plain text (register, logout); guard against that.
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  return request<LoginResponse>("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(
  email: string,
  password: string,
  firstname: string,
  lastname: string
): Promise<void> {
  return request<void>("/register", {
    method: "POST",
    body: JSON.stringify({ email, password, firstname, lastname }),
  });
}

export async function logout(): Promise<void> {
  await request<void>("/logout", { method: "POST" });
}

export async function refreshToken(): Promise<LoginResponse> {
  return request<LoginResponse>("/refresh", { method: "POST" });
}

export async function getMe(): Promise<Me> {
  return request<Me>("/auth/me");
}

// ─── Offers ─────────────────────────────────────────────────────────────────

export async function getOffers(
  filter: OffersFilter = {}
): Promise<OfferListItem[]> {
  const params = new URLSearchParams();
  if (filter.contract_type) params.set("contract_type", filter.contract_type);
  if (filter.remote_policy) params.set("remote_policy", filter.remote_policy);
  if (filter.city) params.set("city", filter.city);
  if (filter.limit != null) params.set("limit", String(filter.limit));
  if (filter.offset != null) params.set("offset", String(filter.offset));

  const qs = params.toString();
  return request<OfferListItem[]>(`/offers${qs ? `?${qs}` : ""}`);
}

export async function getOffer(id: string): Promise<Offer> {
  return request<Offer>(`/offers/${id}`);
}

// ─── Saved offers (a.k.a. bookmarks) ────────────────────────────────────────

export async function getSavedOffers(): Promise<SavedOffer[]> {
  return request<SavedOffer[]>("/users/saved-offers");
}

export async function saveOffer(
  offerId: string,
  notes?: string | null
): Promise<void> {
  return request<void>(`/offers/${offerId}/save`, {
    method: "POST",
    body: JSON.stringify({ notes: notes ?? null }),
  });
}

export async function removeSavedOffer(offerId: string): Promise<void> {
  return request<void>(`/users/saved-offers/${offerId}`, { method: "DELETE" });
}

// ─── Admin ──────────────────────────────────────────────────────────────────

export async function listUsers(): Promise<User[]> {
  return request<User[]>("/admin/users");
}

export async function disableOffer(offerId: string): Promise<void> {
  return request<void>(`/admin/offers/${offerId}/disable`, { method: "PATCH" });
}
