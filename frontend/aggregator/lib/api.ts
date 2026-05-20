import type {
  AdminStats,
  AuditLog,
  AuthTokens,
  Bookmark,
  DashboardStats,
  LoginResponse,
  Offer,
  OffersFilter,
  PaginatedResponse,
  User,
} from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

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

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.message ?? message;
    } catch {
      // ignore
    }
    const err = new Error(message) as Error & { status: number };
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(
  email: string,
  password: string,
  name: string
): Promise<LoginResponse> {
  return request<LoginResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
}

export async function logout(): Promise<void> {
  await request<void>("/auth/logout", { method: "POST" });
}

export async function refreshToken(): Promise<AuthTokens> {
  return request<AuthTokens>("/auth/refresh", { method: "POST" });
}

export async function getMe(): Promise<User> {
  return request<User>("/auth/me");
}

// ─── Offers ─────────────────────────────────────────────────────────────────

export async function getOffers(
  filter: OffersFilter = {}
): Promise<PaginatedResponse<Offer>> {
  const params = new URLSearchParams();
  if (filter.search) params.set("search", filter.search);
  if (filter.contract_type) params.set("contract_type", filter.contract_type);
  if (filter.location) params.set("location", filter.location);
  if (filter.salary_min != null)
    params.set("salary_min", String(filter.salary_min));
  if (filter.salary_max != null)
    params.set("salary_max", String(filter.salary_max));
  if (filter.ai_category) params.set("ai_category", filter.ai_category);
  if (filter.status) params.set("status", filter.status);
  if (filter.page) params.set("page", String(filter.page));
  if (filter.limit) params.set("limit", String(filter.limit));

  const qs = params.toString();
  return request<PaginatedResponse<Offer>>(`/offers${qs ? `?${qs}` : ""}`);
}

export async function getOffer(id: string): Promise<Offer> {
  return request<Offer>(`/offers/${id}`);
}

// ─── Bookmarks ───────────────────────────────────────────────────────────────

export async function getBookmarks(): Promise<Bookmark[]> {
  return request<Bookmark[]>("/bookmarks");
}

export async function addBookmark(
  offerId: string,
  notes?: string
): Promise<void> {
  return request<void>(`/bookmarks/${offerId}`, {
    method: "POST",
    body: JSON.stringify({ notes }),
  });
}

export async function removeBookmark(offerId: string): Promise<void> {
  return request<void>(`/bookmarks/${offerId}`, { method: "DELETE" });
}

export async function updateBookmarkNotes(
  offerId: string,
  notes: string
): Promise<void> {
  return request<void>(`/bookmarks/${offerId}`, {
    method: "PATCH",
    body: JSON.stringify({ notes }),
  });
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  return request<DashboardStats>("/dashboard/stats");
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export async function getAdminStats(): Promise<AdminStats> {
  return request<AdminStats>("/admin/stats");
}

export async function getUsers(
  page = 1,
  limit = 20
): Promise<PaginatedResponse<User>> {
  return request<PaginatedResponse<User>>(
    `/admin/users?page=${page}&limit=${limit}`
  );
}

export async function updateUserRole(
  userId: string,
  role: "user" | "admin"
): Promise<User> {
  return request<User>(`/admin/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function toggleUserActive(
  userId: string,
  is_active: boolean
): Promise<User> {
  return request<User>(`/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ is_active }),
  });
}

export async function moderateOffer(
  offerId: string,
  status: "active" | "archived" | "flagged"
): Promise<Offer> {
  return request<Offer>(`/admin/offers/${offerId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function triggerIngestion(): Promise<{ message: string }> {
  return request<{ message: string }>("/admin/ingest", { method: "POST" });
}

export async function getAuditLog(
  page = 1,
  limit = 20
): Promise<PaginatedResponse<AuditLog>> {
  return request<PaginatedResponse<AuditLog>>(
    `/admin/audit-log?page=${page}&limit=${limit}`
  );
}
