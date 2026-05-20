"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as api from "@/lib/api";
import type { DashboardStats } from "@/lib/types";
import { useAuth } from "@/context/auth-context";
import { StatCard } from "@/components/dashboard/stat-card";
import { BarChart } from "@/components/dashboard/bar-chart";
import { LineChart } from "@/components/dashboard/line-chart";

const CONTRACT_LABELS: Record<string, string> = {
  cdi: "CDI",
  cdd: "CDD",
  stage: "Stage",
  apprentissage: "Alternance",
  freelance: "Freelance",
  interim: "Intérim",
  other: "Autre",
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?redirect=/dashboard");
      return;
    }
    api
      .getDashboardStats()
      .then(setStats)
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
            <div key={i} className="h-28 bg-zinc-900 rounded-xl border border-zinc-800 animate-pulse" aria-hidden="true" />
          ))}
        </div>
        <p className="sr-only">Chargement du dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div role="alert" className="rounded-md border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const contractData = stats.by_contract_type.map((d) => ({
    label: CONTRACT_LABELS[d.contract_type] ?? d.contract_type,
    value: d.count,
  }));

  const locationData = stats.by_location
    .slice(0, 8)
    .map((d) => ({ label: d.location, value: d.count }));

  const companyData = stats.by_company
    .slice(0, 8)
    .map((d) => ({ label: d.company, value: d.count }));

  const aiCategoryData = stats.ai_categories
    .slice(0, 8)
    .map((d) => ({ label: d.category, value: d.count }));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          Bonjour{user?.name ? `, ${user.name}` : ""} 👋
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          {"Voici une vue d'ensemble du marché tech en France."}
        </p>
      </div>

      {/* KPI cards — data feature */}
      <section aria-label="Statistiques clés" className="mb-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Offres totales"
            value={stats.total_offers.toLocaleString("fr-FR")}
            sub="toutes sources"
            color="text-blue-400"
          />
          <StatCard
            label="Offres actives"
            value={stats.active_offers.toLocaleString("fr-FR")}
            sub="en ce moment"
            color="text-green-400"
          />
          <StatCard
            label="Entreprises"
            value={stats.by_company.length.toLocaleString("fr-FR")}
            sub="qui recrutent"
            color="text-violet-400"
          />
          <StatCard
            label="Catégories IA"
            value={stats.ai_categories.length.toLocaleString("fr-FR")}
            sub="détectées automatiquement"
            color="text-orange-400"
          />
        </div>
      </section>

      {/* Trend chart */}
      <section aria-label="Tendances de publication" className="mb-6">
        <LineChart
          data={stats.offers_over_time}
          title="Offres publiées dans le temps"
        />
      </section>

      {/* Charts grid — data feature + AI feature */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <BarChart
          data={contractData}
          title="Répartition par type de contrat"
          color="bg-blue-500"
        />
        <BarChart
          data={locationData}
          title="Top localisations"
          color="bg-green-500"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* AI feature output */}
        <section
          aria-label="Catégories IA"
          className="flex flex-col gap-3 p-5 rounded-xl border border-violet-500/20 bg-violet-500/5"
        >
          <h2 className="text-xs font-semibold text-violet-400 uppercase tracking-wider">
            {"Catégories détectées par l'IA"}
          </h2>
          <p className="text-xs text-zinc-500">
            Classification automatique des offres par domaine technique.
          </p>
          <ul className="flex flex-col gap-2" role="list">
            {aiCategoryData.map((d) => {
              const max = Math.max(...aiCategoryData.map((x) => x.value), 1);
              return (
                <li key={d.label} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 text-xs text-zinc-300 truncate" title={d.label}>
                    {d.label}
                  </span>
                  <div className="flex-1 h-4 bg-zinc-800 rounded overflow-hidden">
                    <div
                      className="h-full bg-violet-500 rounded"
                      style={{ width: `${(d.value / max) * 100}%` }}
                      aria-label={`${d.label}: ${d.value} offres`}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-xs text-zinc-500">
                    {d.value}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <BarChart
          data={companyData}
          title="Top entreprises qui recrutent"
          color="bg-orange-500"
        />
      </div>

      {/* Top keywords from AI */}
      {stats.top_keywords.length > 0 && (
        <section
          aria-label="Compétences les plus demandées"
          className="p-5 rounded-xl border border-zinc-800 bg-zinc-900"
        >
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Compétences les plus demandées (IA)
          </h2>
          <ul className="flex flex-wrap gap-2" role="list">
            {stats.top_keywords.slice(0, 20).map((kw) => (
              <li key={kw.keyword}>
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700"
                  title={`${kw.count} offres`}
                >
                  {kw.keyword}
                  <span className="text-zinc-600 text-[10px]">{kw.count}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

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
