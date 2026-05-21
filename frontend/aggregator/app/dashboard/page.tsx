"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as api from "@/lib/api";
import type { OfferListItem } from "@/lib/types";
import { useAuth } from "@/context/auth-context";
import { StatCard } from "@/components/dashboard/stat-card";
import { BarChart } from "@/components/dashboard/bar-chart";

const CONTRACT_LABELS: Record<string, string> = {
  full_time: "CDI",
  internship: "Stage",
  apprenticeship: "Alternance",
  freelance: "Freelance",
  unknown: "Autre",
};

const REMOTE_LABELS: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybride",
  onsite: "Sur site",
  unknown: "Non précisé",
};

function topN(
  items: OfferListItem[],
  key: (o: OfferListItem) => string | null,
  n: number
) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const v = key(item);
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([label, value]) => ({ label, value }));
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [offers, setOffers] = useState<OfferListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?redirect=/dashboard");
      return;
    }
    api
      .getOffers({ limit: 100 })
      .then(setOffers)
      .catch(() => setError("Impossible de charger les statistiques."))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="mb-6 animate-pulse">
          <div className="h-8 w-48 bg-zinc-800 rounded mb-2" aria-hidden="true" />
          <div className="h-4 w-72 bg-zinc-800 rounded" aria-hidden="true" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 bg-zinc-900 rounded-xl border border-zinc-800 animate-pulse"
              aria-hidden="true"
            />
          ))}
        </div>
        <p className="sr-only">Chargement du dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div
          role="alert"
          className="rounded-md border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          {error}
        </div>
      </div>
    );
  }

  const contractData = Object.entries(
    offers.reduce<Record<string, number>>((acc, o) => {
      const k = o.contract_type ?? "unknown";
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([k, v]) => ({ label: CONTRACT_LABELS[k] ?? k, value: v }))
    .sort((a, b) => b.value - a.value);

  const remoteData = Object.entries(
    offers.reduce<Record<string, number>>((acc, o) => {
      const k = o.remote_policy ?? "unknown";
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([k, v]) => ({ label: REMOTE_LABELS[k] ?? k, value: v }))
    .sort((a, b) => b.value - a.value);

  const citiesData = topN(offers, (o) => o.location_city, 8);
  const companiesData = topN(offers, (o) => o.company, 8);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Vue rapide du marché tech (échantillon de {offers.length} offres).
        </p>
      </div>

      <section aria-label="Statistiques clés" className="mb-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Offres analysées"
            value={offers.length.toLocaleString("fr-FR")}
            sub="dernier batch"
            color="text-blue-400"
          />
          <StatCard
            label="Entreprises"
            value={new Set(
              offers.map((o) => o.company).filter(Boolean)
            ).size.toLocaleString("fr-FR")}
            sub="distinctes"
            color="text-violet-400"
          />
          <StatCard
            label="Villes"
            value={new Set(
              offers.map((o) => o.location_city).filter(Boolean)
            ).size.toLocaleString("fr-FR")}
            sub="couvertes"
            color="text-green-400"
          />
          <StatCard
            label="Remote"
            value={
              offers.filter((o) => o.remote_policy === "remote").length
            }
            sub="offres 100% remote"
            color="text-emerald-400"
          />
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <BarChart
          data={contractData}
          title="Répartition par type de contrat"
          color="bg-blue-500"
        />
        <BarChart
          data={remoteData}
          title="Politique de télétravail"
          color="bg-emerald-500"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <BarChart
          data={citiesData}
          title="Top villes"
          color="bg-green-500"
        />
        <BarChart
          data={companiesData}
          title="Top entreprises qui recrutent"
          color="bg-orange-500"
        />
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/offers"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Voir toutes les offres →
        </Link>
      </div>
    </div>
  );
}
