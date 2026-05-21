"use client";

import { useCallback, useEffect, useState } from "react";
import * as api from "@/lib/api";
import type { OfferListItem, OffersFilter } from "@/lib/types";
import { useAuth } from "@/context/auth-context";
import { OfferCard } from "@/components/offers/offer-card";
import { OfferFilters } from "@/components/offers/offer-filters";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 20;
const DEFAULT_FILTER: OffersFilter = { offset: 0, limit: PAGE_SIZE };

export default function OffersPage() {
  const { user, loading: authLoading } = useAuth();
  const [filters, setFilters] = useState<OffersFilter>(DEFAULT_FILTER);
  const [offers, setOffers] = useState<OfferListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    api
      .getSavedOffers()
      .then((items) => setBookmarked(new Set(items.map((s) => s.offer_id))))
      .catch(() => {});
  }, [user]);

  const fetchOffers = useCallback(async (f: OffersFilter) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.getOffers(f);
      setOffers(res);
    } catch (err) {
      if ((err as { status?: number }).status === 401) {
        // Not logged in — surface a friendly message; layout will let them log in.
        setError("Connecte-toi pour voir les offres.");
      } else {
        setError("Impossible de charger les offres. Réessaie plus tard.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    fetchOffers(filters);
  }, [filters, fetchOffers, authLoading]);

  async function toggleBookmark(offerId: string) {
    if (!user) return;
    const wasBookmarked = bookmarked.has(offerId);
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (wasBookmarked) next.delete(offerId);
      else next.add(offerId);
      return next;
    });
    try {
      if (wasBookmarked) await api.removeSavedOffer(offerId);
      else await api.saveOffer(offerId);
    } catch {
      setBookmarked((prev) => {
        const next = new Set(prev);
        if (wasBookmarked) next.add(offerId);
        else next.delete(offerId);
        return next;
      });
    }
  }

  const offset = filters.offset ?? 0;
  const limit = filters.limit ?? PAGE_SIZE;
  // Backend doesn't return a total; infer "has next" from whether we got a full page.
  const hasPrev = offset > 0;
  const hasNext = offers.length >= limit;
  const pageNumber = Math.floor(offset / limit) + 1;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{"Offres d'emploi"}</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {loading
            ? "Chargement…"
            : offers.length === 0
              ? "Aucune offre"
              : `${offers.length} offre${offers.length > 1 ? "s" : ""} sur cette page`}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 shrink-0">
          <OfferFilters
            filters={filters}
            onChange={setFilters}
            onReset={() => setFilters(DEFAULT_FILTER)}
          />
        </div>

        <div className="flex-1 min-w-0">
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-md border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
            >
              {error}
            </div>
          )}

          {loading ? (
            <ul
              className="grid gap-4"
              aria-label="Chargement des offres"
              aria-busy="true"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <li
                  key={i}
                  className="h-36 rounded-xl border border-zinc-800 bg-zinc-900 animate-pulse"
                  aria-hidden="true"
                />
              ))}
            </ul>
          ) : offers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-zinc-400 font-medium">Aucune offre trouvée</p>
              <p className="mt-1 text-sm text-zinc-600">
                Modifie tes filtres ou reviens plus tard.
              </p>
            </div>
          ) : (
            <ul className="grid gap-4" aria-label="Liste des offres">
              {offers.map((offer) => (
                <li key={offer.id}>
                  <OfferCard
                    offer={offer}
                    bookmarked={bookmarked.has(offer.id)}
                    onToggleBookmark={user ? toggleBookmark : undefined}
                  />
                </li>
              ))}
            </ul>
          )}

          {(hasPrev || hasNext) && (
            <nav
              className="mt-6 flex items-center justify-center gap-2"
              aria-label="Pagination"
            >
              <Button
                variant="secondary"
                size="sm"
                disabled={!hasPrev}
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    offset: Math.max(0, (f.offset ?? 0) - (f.limit ?? PAGE_SIZE)),
                  }))
                }
                aria-label="Page précédente"
              >
                Précédent
              </Button>
              <span className="text-sm text-zinc-400">Page {pageNumber}</span>
              <Button
                variant="secondary"
                size="sm"
                disabled={!hasNext}
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    offset: (f.offset ?? 0) + (f.limit ?? PAGE_SIZE),
                  }))
                }
                aria-label="Page suivante"
              >
                Suivant
              </Button>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
