"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as api from "@/lib/api";
import type { SavedOffer } from "@/lib/types";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";

export default function BookmarksPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState<SavedOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?redirect=/bookmarks");
      return;
    }
    api
      .getSavedOffers()
      .then(setSaved)
      .catch(() => setError("Impossible de charger tes favoris."))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  async function remove(offerId: string) {
    const previous = saved;
    setSaved((prev) => prev.filter((b) => b.offer_id !== offerId));
    try {
      await api.removeSavedOffer(offerId);
    } catch {
      setSaved(previous);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
        <div
          className="h-8 w-48 bg-zinc-800 rounded animate-pulse mb-6"
          aria-hidden="true"
        />
        <ul className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <li
              key={i}
              className="h-28 bg-zinc-900 rounded-xl border border-zinc-800 animate-pulse"
              aria-hidden="true"
            />
          ))}
        </ul>
        <p className="sr-only">Chargement des favoris…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Mes favoris</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {saved.length === 0
            ? "Aucune offre sauvegardée pour l'instant."
            : `${saved.length} offre${saved.length > 1 ? "s" : ""} sauvegardée${saved.length > 1 ? "s" : ""}`}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          {error}
        </div>
      )}

      {saved.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-zinc-800 bg-zinc-900">
          <svg
            className="h-10 w-10 text-zinc-700 mb-3"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
          <p className="text-sm text-zinc-500">
            {"Retrouve tes offres préférées ici. Clique sur "}
            <span className="text-zinc-400">{"l'icône signet"}</span>
            {" sur une offre pour la sauvegarder."}
          </p>
        </div>
      ) : (
        <ul className="grid gap-4" aria-label="Offres sauvegardées">
          {saved.map((bookmark) => (
            <li
              key={bookmark.offer_id}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/offers/${bookmark.offer_id}`}
                    className="text-sm font-semibold text-white hover:text-blue-400 transition-colors"
                  >
                    {bookmark.title}
                  </Link>
                  {bookmark.company && (
                    <p className="mt-1 text-xs text-zinc-400 font-medium">
                      {bookmark.company}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(bookmark.offer_id)}
                  aria-label="Retirer des favoris"
                >
                  Retirer
                </Button>
              </div>

              {bookmark.notes && (
                <p className="mt-3 text-xs text-zinc-500 italic">
                  Note : {bookmark.notes}
                </p>
              )}

              <p className="mt-2 text-[10px] text-zinc-600">
                Sauvegardée le{" "}
                <time dateTime={bookmark.saved_at}>
                  {new Date(bookmark.saved_at).toLocaleDateString("fr-FR")}
                </time>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
