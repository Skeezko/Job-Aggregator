"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import * as api from "@/lib/api";
import type { Offer } from "@/lib/types";
import { useAuth } from "@/context/auth-context";
import { ContractBadge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function formatSalary(offer: Offer): string | null {
  if (offer.salary_min == null && offer.salary_max == null) return null;
  const cur = offer.salary_currency ?? "EUR";
  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 0,
    }).format(n);
  const period =
    offer.salary_period === "year"
      ? "/an"
      : offer.salary_period === "month"
      ? "/mois"
      : "";
  if (offer.salary_min != null && offer.salary_max != null)
    return `${fmt(offer.salary_min)} – ${fmt(offer.salary_max)}${period}`;
  if (offer.salary_min != null) return `Dès ${fmt(offer.salary_min)}${period}`;
  return `Jusqu'à ${fmt(offer.salary_max!)}${period}`;
}

export default function OfferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  useEffect(() => {
    api
      .getOffer(id)
      .then(setOffer)
      .catch(() => setError("Offre introuvable."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user) return;
    api.getBookmarks().then((bms) => {
      setBookmarked(bms.some((b) => b.offer_id === id));
    }).catch(() => {});
  }, [user, id]);

  async function toggleBookmark() {
    if (!user || !offer) return;
    setBookmarkLoading(true);
    try {
      if (bookmarked) {
        await api.removeBookmark(offer.id);
        setBookmarked(false);
      } else {
        await api.addBookmark(offer.id);
        setBookmarked(true);
      }
    } finally {
      setBookmarkLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-2/3 bg-zinc-800 rounded" aria-hidden="true" />
          <div className="h-4 w-1/3 bg-zinc-800 rounded" aria-hidden="true" />
          <div className="h-64 bg-zinc-900 rounded-xl" aria-hidden="true" />
        </div>
        <p className="sr-only">{"Chargement de l'offre…"}</p>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
        <div
          role="alert"
          className="rounded-md border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          {error || "Offre introuvable."}
        </div>
        <Link
          href="/offers"
          className="mt-4 inline-block text-sm text-blue-400 hover:text-blue-300"
        >
          ← Retour aux offres
        </Link>
      </div>
    );
  }

  const salary = formatSalary(offer);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <nav aria-label="Fil d'Ariane" className="mb-6">
        <Link
          href="/offers"
          className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ← Retour aux offres
        </Link>
      </nav>

      <article aria-label={`Offre : ${offer.title}`}>
        <header className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white leading-tight">
              {offer.title}
            </h1>
            <p className="mt-1 text-base font-medium text-blue-400">
              {offer.company}
            </p>
          </div>
          {user && (
            <Button
              variant="secondary"
              size="sm"
              loading={bookmarkLoading}
              onClick={toggleBookmark}
              aria-pressed={bookmarked}
              aria-label={bookmarked ? "Retirer des favoris" : "Ajouter aux favoris"}
              className="shrink-0"
            >
              <svg
                className="h-4 w-4"
                fill={bookmarked ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
              {bookmarked ? "Sauvegardé" : "Sauvegarder"}
            </Button>
          )}
        </header>

        <div className="grid sm:grid-cols-2 gap-3 mb-6 p-4 rounded-xl border border-zinc-800 bg-zinc-900">
          <dl className="space-y-2">
            {offer.location && (
              <div className="flex items-center gap-2">
                <dt className="text-xs text-zinc-500 w-24">Localisation</dt>
                <dd className="text-sm text-zinc-200">{offer.location}</dd>
              </div>
            )}
            <div className="flex items-center gap-2">
              <dt className="text-xs text-zinc-500 w-24">Contrat</dt>
              <dd>
                <ContractBadge type={offer.contract_type} />
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="text-xs text-zinc-500 w-24">Statut</dt>
              <dd>
                <StatusBadge status={offer.status} />
              </dd>
            </div>
          </dl>

          <dl className="space-y-2">
            {salary && (
              <div className="flex items-center gap-2">
                <dt className="text-xs text-zinc-500 w-24">Salaire</dt>
                <dd className="text-sm text-green-400 font-medium">{salary}</dd>
              </div>
            )}
            <div className="flex items-center gap-2">
              <dt className="text-xs text-zinc-500 w-24">Publiée le</dt>
              <dd className="text-sm text-zinc-200">
                <time dateTime={offer.posted_at}>
                  {new Date(offer.posted_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="text-xs text-zinc-500 w-24">Source</dt>
              <dd className="text-sm text-zinc-400 capitalize">{offer.source}</dd>
            </div>
          </dl>
        </div>

        {(offer.ai_category || (offer.ai_keywords && offer.ai_keywords.length > 0)) && (
          <section
            aria-label="Analyse IA"
            className="mb-6 p-4 rounded-xl border border-violet-500/20 bg-violet-500/5"
          >
            <h2 className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-3">
              Analyse IA
            </h2>
            {offer.ai_category && (
              <p className="text-sm text-zinc-300 mb-2">
                Catégorie :{" "}
                <span className="font-medium text-violet-300">
                  {offer.ai_category}
                </span>
              </p>
            )}
            {offer.ai_keywords && offer.ai_keywords.length > 0 && (
              <div>
                <p className="text-xs text-zinc-500 mb-2">Compétences détectées :</p>
                <ul className="flex flex-wrap gap-1.5" aria-label="Mots-clés extraits par l'IA">
                  {offer.ai_keywords.map((kw) => (
                    <li key={kw}>
                      <span className="inline-flex items-center px-2 py-0.5 text-xs rounded border bg-violet-500/10 text-violet-300 border-violet-500/20">
                        {kw}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        <section aria-label="Description du poste">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Description
          </h2>
          <div
            className="prose prose-invert prose-sm max-w-none text-zinc-300 leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: offer.description.replace(/\n/g, "<br>") }}
          />
        </section>

        {offer.source_url && (
          <div className="mt-8">
            <a
              href={offer.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
              aria-label={`Voir l'offre originale sur ${offer.source}`}
            >
              {"Voir l'offre originale"}
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        )}
      </article>
    </div>
  );
}
