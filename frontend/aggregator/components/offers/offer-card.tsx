"use client";

import Link from "next/link";
import type { Offer } from "@/lib/types";
import { ContractBadge } from "@/components/ui/badge";

function formatSalary(offer: Offer): string | null {
  if (offer.salary_min == null && offer.salary_max == null) return null;
  const cur = offer.salary_currency ?? "EUR";
  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 0,
    }).format(n);
  const period = offer.salary_period === "year" ? "/an" : offer.salary_period === "month" ? "/mois" : "";
  if (offer.salary_min != null && offer.salary_max != null)
    return `${fmt(offer.salary_min)} – ${fmt(offer.salary_max)}${period}`;
  if (offer.salary_min != null) return `Dès ${fmt(offer.salary_min)}${period}`;
  return `Jusqu'à ${fmt(offer.salary_max!)}${period}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days} jours`;
  if (days < 30) return `Il y a ${Math.floor(days / 7)} sem.`;
  return `Il y a ${Math.floor(days / 30)} mois`;
}

interface OfferCardProps {
  offer: Offer;
  bookmarked?: boolean;
  onToggleBookmark?: (id: string) => void;
}

export function OfferCard({
  offer,
  bookmarked = false,
  onToggleBookmark,
}: OfferCardProps) {
  const salary = formatSalary(offer);

  return (
    <article
      className="group flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-700 transition-colors"
      aria-label={`Offre : ${offer.title} chez ${offer.company}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <Link
            href={`/offers/${offer.id}`}
            className="text-sm font-semibold text-white hover:text-blue-400 transition-colors line-clamp-2 leading-snug"
          >
            {offer.title}
          </Link>
          <p className="mt-1 text-xs text-zinc-400 font-medium">{offer.company}</p>
        </div>

        {onToggleBookmark && (
          <button
            onClick={() => onToggleBookmark(offer.id)}
            aria-label={bookmarked ? "Retirer des favoris" : "Ajouter aux favoris"}
            aria-pressed={bookmarked}
            className="shrink-0 p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
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
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        {offer.location && (
          <span className="flex items-center gap-1">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {offer.location}
          </span>
        )}
        {salary && (
          <span className="flex items-center gap-1 text-green-400">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {salary}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ContractBadge type={offer.contract_type} />
          {offer.ai_category && (
            <span className="inline-flex items-center px-2 py-0.5 text-xs rounded border bg-violet-500/10 text-violet-400 border-violet-500/20">
              {offer.ai_category}
            </span>
          )}
        </div>
        <time
          dateTime={offer.posted_at}
          className="text-xs text-zinc-600"
          title={new Date(offer.posted_at).toLocaleDateString("fr-FR")}
        >
          {timeAgo(offer.posted_at)}
        </time>
      </div>
    </article>
  );
}
