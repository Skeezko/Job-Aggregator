"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as api from "@/lib/api";
import type { OfferListItem, User } from "@/lib/types";
import { useAuth } from "@/context/auth-context";
import { StatCard } from "@/components/dashboard/stat-card";

type Tab = "overview" | "offers" | "users";

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [offers, setOffers] = useState<OfferListItem[] | null>(null);
  const [users, setUsers] = useState<User[] | null>(null);
  const [actionLoading, setActionLoading] = useState<string>("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?redirect=/admin");
      return;
    }
    if (user.role !== "admin") {
      router.replace("/offers");
      return;
    }
    Promise.all([
      api.listUsers().then(setUsers),
      api.getOffers({ limit: 100 }).then(setOffers),
    ]).catch(() => setError("Erreur de chargement des données admin."));
  }, [user, authLoading, router]);

  async function handleDisable(offerId: string) {
    setActionLoading(offerId);
    try {
      await api.disableOffer(offerId);
      setOffers((prev) =>
        prev ? prev.filter((o) => o.id !== offerId) : prev
      );
    } catch {
      setError("Impossible de désactiver cette offre.");
    } finally {
      setActionLoading("");
    }
  }

  if (authLoading || (!offers && !users && !error)) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div
          className="h-8 w-48 bg-zinc-800 rounded animate-pulse mb-6"
          aria-hidden="true"
        />
        <p className="sr-only">Chargement du panneau admin…</p>
      </div>
    );
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "Vue d'ensemble" },
    { id: "offers", label: "Offres" },
    { id: "users", label: "Utilisateurs" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Administration</h1>
        <p className="mt-1 text-sm text-zinc-400">Gestion de la plateforme</p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          {error}
        </div>
      )}

      <nav
        aria-label="Onglets administration"
        className="flex gap-1 mb-6 border-b border-zinc-800"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            aria-selected={tab === t.id}
            role="tab"
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? "border-blue-500 text-white"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "overview" && (
        <section aria-label="Statistiques d'administration">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Utilisateurs"
              value={users?.length ?? "—"}
              color="text-blue-400"
            />
            <StatCard
              label="Admins"
              value={
                users?.filter((u) => u.role === "admin").length ?? "—"
              }
              color="text-orange-400"
            />
            <StatCard
              label="Offres (échantillon)"
              value={offers?.length ?? "—"}
              sub="actives"
              color="text-green-400"
            />
          </div>
        </section>
      )}

      {tab === "offers" && (
        <section aria-label="Modération des offres">
          <div className="rounded-xl border border-zinc-800 overflow-hidden">
            <table
              className="w-full text-sm"
              role="table"
              aria-label="Liste des offres à modérer"
            >
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900">
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase"
                  >
                    Titre
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase hidden sm:table-cell"
                  >
                    Entreprise
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase hidden sm:table-cell"
                  >
                    Ville
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {(offers ?? []).map((offer) => (
                  <tr
                    key={offer.id}
                    className="border-b border-zinc-800/50 hover:bg-zinc-900/50"
                  >
                    <td className="px-4 py-3 text-zinc-200 max-w-xs truncate">
                      {offer.title}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 hidden sm:table-cell">
                      {offer.company ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 hidden sm:table-cell">
                      {offer.location_city ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDisable(offer.id)}
                        disabled={actionLoading === offer.id}
                        className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                        aria-label={`Désactiver l'offre ${offer.title}`}
                      >
                        Désactiver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!offers && (
              <div className="py-8 text-center text-sm text-zinc-500">
                Chargement…
              </div>
            )}
          </div>
        </section>
      )}

      {tab === "users" && (
        <section aria-label="Liste des utilisateurs">
          <div className="rounded-xl border border-zinc-800 overflow-hidden">
            <table
              className="w-full text-sm"
              role="table"
              aria-label="Liste des utilisateurs"
            >
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900">
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase"
                  >
                    Nom
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase hidden sm:table-cell"
                  >
                    Email
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase"
                  >
                    Rôle
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase hidden sm:table-cell"
                  >
                    Créé le
                  </th>
                </tr>
              </thead>
              <tbody>
                {(users ?? []).map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-zinc-800/50 hover:bg-zinc-900/50"
                  >
                    <td className="px-4 py-3 text-zinc-200">
                      {u.firstname} {u.lastname}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 hidden sm:table-cell">
                      {u.email}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium ${u.role === "admin" ? "text-orange-400" : "text-zinc-400"}`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 hidden sm:table-cell">
                      {new Date(u.created_at).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!users && (
              <div className="py-8 text-center text-sm text-zinc-500">
                Chargement…
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
