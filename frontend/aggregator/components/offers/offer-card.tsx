"use client";

import Link from "next/link";
import type { OfferListItem } from "@/lib/types";
import { ContractBadge, RemoteBadge } from "@/components/ui/badge";

interface OfferCardProps {
  offer: OfferListItem;
  bookmarked?: boolean;
  onToggleBookmark?: (id: string) => void;
}

export function OfferCard({
  offer,
  bookmarked = false,
  onToggleBookmark,
}: OfferCardProps) {
  return (
    <article
      className="group flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-700 transition-colors"
      aria-label={`Offre : ${offer.title}${offer.company ? ` chez ${offer.company}` : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <Link
            href={`/offers/${offer.id}`}
            className="text-sm font-semibold text-white hover:text-blue-400 transition-colors line-clamp-2 leading-snug"
          >
            {offer.title}
          </Link>
          {offer.company && (
            <p className="mt-1 text-xs text-zinc-400 font-medium">
              {offer.company}
            </p>
          )}
        </div>

        {onToggleBookmark && (
          <button
            onClick={() => onToggleBookmark(offer.id)}
            aria-label={
              bookmarked ? "Retirer des favoris" : "Ajouter aux favoris"
            }
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

      {offer.location_city && (
        <div className="flex items-center gap-1 text-xs text-zinc-500">
          <svg
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {offer.location_city}
        </div>
      )}

      <div className="flex items-center gap-2">
        <ContractBadge type={offer.contract_type} />
        <RemoteBadge policy={offer.remote_policy} />
      </div>
    </article>
  );
}
