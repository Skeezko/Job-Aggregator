// Types aligned with the Rust backend (snake_case JSON).

export type UserRole = "user" | "admin";

export type ContractType =
  | "internship"
  | "apprenticeship"
  | "full_time"
  | "freelance"
  | "unknown";

export type RemotePolicy = "onsite" | "hybrid" | "remote" | "unknown";

// Returned by GET /auth/me — minimal, server only knows id + role.
export interface Me {
  id: string;
  role: UserRole;
}

// Returned by GET /admin/users — only available to admins.
export interface User {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  role: UserRole;
  created_at: string;
}

// Returned by GET /offers (list item, lighter shape).
export interface OfferListItem {
  id: string;
  title: string;
  company: string | null;
  location_city: string | null;
  contract_type: ContractType;
  remote_policy: RemotePolicy;
}

// Returned by GET /offers/{id} — full detail.
export interface Offer {
  id: string;
  source: string;
  source_id: string;
  title: string;
  description: string;
  company: string | null;
  location_city: string | null;
  location_country: string | null;
  remote_policy: RemotePolicy;
  contract_type: ContractType;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  posted_at: string | null;
}

// Returned by GET /users/saved-offers — flat, with notes.
export interface SavedOffer {
  offer_id: string;
  title: string;
  company: string | null;
  notes: string | null;
  saved_at: string;
}

export interface OffersFilter {
  contract_type?: ContractType;
  remote_policy?: RemotePolicy;
  city?: string;
  limit?: number;
  offset?: number;
}

export interface LoginResponse {
  access_token: string;
}

export interface ApiError {
  code?: string;
  message: string;
  status?: number;
}
