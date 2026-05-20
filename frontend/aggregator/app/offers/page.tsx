"use client";

import { useCallback, useEffect, useState } from "react";
import * as api from "@/lib/api";
import type { Offer, OffersFilter } from "@/lib/types";
import { useAuth } from "@/context/auth-context";
import { OfferCard } from "@/components/offers/offer-card";
import { OfferFilters } from "@/components/offers/offer-filters";
import { Button } from "@/components/ui/button";

const DEFAULT_FILTER: OffersFilter = { page: 1, limit: 20 };

export default function OffersPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<OffersFilter>(DEFAULT_FILTER);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    api.getBookmarks().then((bms) => {
      setBookmarked(new Set(bms.map((b) => b.offer_id)));
    }).catch(() => {});
  }, [user]);

  const fetchOffers = useCallback(async (f: OffersFilter) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.getOffers(f);
      setOffers(res.data);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch {
      setError("Impossible de charger les offres. Réessaie plus tard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers(filters);
  }, [filters, fetchOffers]);

  async function toggleBookmark(offerId: string) {
    if (!user) return;
    const wasBookmarked = bookmarked.has(offerId);
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (wasBookmarked) { next.delete(offerId); } else { next.add(offerId); }
      return next;
    });
    try {
      if (wasBookmarked) {
        await api.removeBookmark(offerId);
      } else {
        await api.addBookmark(offerId);
      }
    } catch {
      setBookmarked((prev) => {
        const next = new Set(prev);
        if (wasBookmarked) { next.add(offerId); } else { next.delete(offerId); }
        return next;
      });
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{"Offres d'emploi"}</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {loading ? "Chargement…" : `${total.toLocaleString("fr-FR")} offres trouvées`}
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
            <ul className="grid gap-4" aria-label="Chargement des offres" aria-busy="true">
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

          {totalPages > 1 && (
            <nav
              className="mt-6 flex items-center justify-center gap-2"
              aria-label="Pagination"
            >
              <Button
                variant="secondary"
                size="sm"
                disabled={filters.page === 1}
                onClick={() =>
                  setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))
                }
                aria-label="Page précédente"
              >
                Précédent
              </Button>
              <span className="text-sm text-zinc-400">
                Page {filters.page ?? 1} / {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={(filters.page ?? 1) >= totalPages}
                onClick={() =>
                  setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))
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
