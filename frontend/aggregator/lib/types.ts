export type UserRole = "user" | "admin";

export type ContractType =
  | "cdi"
  | "cdd"
  | "stage"
  | "apprentissage"
  | "freelance"
  | "interim"
  | "other";

export type OfferStatus = "active" | "closed" | "archived" | "flagged";

export type OfferSource = "welovedevs" | "manual";

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Offer {
  id: string;
  source: OfferSource;
  external_id: string;
  source_url: string | null;
  title: string;
  description: string;
  company: string;
  location: string | null;
  contract_type: ContractType | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  salary_period: "hour" | "day" | "month" | "year" | null;
  posted_at: string;
  expires_at: string | null;
  ingested_at: string;
  status: OfferStatus;
  ai_category: string | null;
  ai_keywords: string[] | null;
  ai_processed_at: string | null;
}

export interface Bookmark {
  offer_id: string;
  bookmarked_at: string;
  notes: string | null;
  offer: Offer;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface OffersFilter {
  search?: string;
  contract_type?: ContractType;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  ai_category?: string;
  status?: OfferStatus;
  page?: number;
  limit?: number;
}

export interface DashboardStats {
  total_offers: number;
  active_offers: number;
  by_contract_type: { contract_type: string; count: number }[];
  by_location: { location: string; count: number }[];
  by_company: { company: string; count: number }[];
  salary_distribution: { range: string; count: number }[];
  offers_over_time: { date: string; count: number }[];
  ai_categories: { category: string; count: number }[];
  top_keywords: { keyword: string; count: number }[];
}

export interface AdminStats {
  total_users: number;
  active_users: number;
  total_offers: number;
  flagged_offers: number;
  last_ingestion: string | null;
}

export interface AuditLog {
  id: string;
  actor_user_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  actor?: User;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}
