"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as api from "@/lib/api";
import type { AdminStats, AuditLog, Offer, PaginatedResponse, User } from "@/lib/types";
import { useAuth } from "@/context/auth-context";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Tab = "overview" | "offers" | "users" | "audit";

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [offers, setOffers] = useState<PaginatedResponse<Offer> | null>(null);
  const [users, setUsers] = useState<PaginatedResponse<User> | null>(null);
  const [auditLog, setAuditLog] = useState<PaginatedResponse<AuditLog> | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string>("");
  const [ingesting, setIngesting] = useState(false);
  const [ingestMsg, setIngestMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/login?redirect=/admin"); return; }
    if (user.role !== "admin") { router.replace("/dashboard"); return; }
    api.getAdminStats().then(setStats).catch(() => setError("Erreur chargement stats.")).finally(() => setLoading(false));
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    if (tab === "offers" && !offers) {
      api.getOffers({ page: 1, limit: 20 }).then((r) => setOffers(r as PaginatedResponse<Offer>)).catch(() => {});
    }
    if (tab === "users" && !users) {
      api.getUsers(1, 20).then(setUsers).catch(() => {});
    }
    if (tab === "audit" && !auditLog) {
      api.getAuditLog(1, 20).then(setAuditLog).catch(() => {});
    }
  }, [tab, user, offers, users, auditLog]);

  async function handleModerate(offerId: string, status: "active" | "archived" | "flagged") {
    setActionLoading(offerId);
    try {
      const updated = await api.moderateOffer(offerId, status);
      setOffers((prev) =>
        prev
          ? { ...prev, data: prev.data.map((o) => (o.id === offerId ? updated : o)) }
          : null
      );
    } finally {
      setActionLoading("");
    }
  }

  async function handleToggleUser(userId: string, is_active: boolean) {
    setActionLoading(userId);
    try {
      const updated = await api.toggleUserActive(userId, is_active);
      setUsers((prev) =>
        prev
          ? { ...prev, data: prev.data.map((u) => (u.id === userId ? updated : u)) }
          : null
      );
    } finally {
      setActionLoading("");
    }
  }

  async function handleIngest() {
    setIngesting(true);
    setIngestMsg("");
    try {
      const res = await api.triggerIngestion();
      setIngestMsg(res.message);
    } catch {
      setIngestMsg("Erreur lors du déclenchement.");
    } finally {
      setIngesting(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse mb-6" aria-hidden="true" />
        <p className="sr-only">Chargement du panneau admin…</p>
      </div>
    );
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "Vue d'ensemble" },
    { id: "offers", label: "Offres" },
    { id: "users", label: "Utilisateurs" },
    { id: "audit", label: "Journal d'audit" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Administration</h1>
          <p className="mt-1 text-sm text-zinc-400">Gestion de la plateforme</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            loading={ingesting}
            onClick={handleIngest}
            aria-label="Déclencher une ingestion manuelle des données"
          >
            Ingérer les données
          </Button>
          {ingestMsg && (
            <span className="text-xs text-green-400">{ingestMsg}</span>
          )}
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-md border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <nav aria-label="Onglets administration" className="flex gap-1 mb-6 border-b border-zinc-800">
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

      {tab === "overview" && stats && (
        <section aria-label="Statistiques d'administration">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Utilisateurs" value={stats.total_users} sub={`${stats.active_users} actifs`} color="text-blue-400" />
            <StatCard label="Offres totales" value={stats.total_offers} color="text-green-400" />
            <StatCard label="Offres signalées" value={stats.flagged_offers} color="text-red-400" />
            <StatCard
              label="Dernière ingestion"
              value={stats.last_ingestion ? new Date(stats.last_ingestion).toLocaleDateString("fr-FR") : "Jamais"}
              color="text-zinc-400"
            />
          </div>
        </section>
      )}

      {tab === "offers" && (
        <section aria-label="Modération des offres">
          <div className="rounded-xl border border-zinc-800 overflow-hidden">
            <table className="w-full text-sm" role="table" aria-label="Liste des offres à modérer">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900">
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Titre</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase hidden sm:table-cell">Entreprise</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Statut</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(offers?.data ?? []).map((offer) => (
                  <tr key={offer.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50">
                    <td className="px-4 py-3 text-zinc-200 max-w-xs truncate">{offer.title}</td>
                    <td className="px-4 py-3 text-zinc-400 hidden sm:table-cell">{offer.company}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={offer.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {offer.status !== "active" && (
                          <button
                            onClick={() => handleModerate(offer.id, "active")}
                            disabled={actionLoading === offer.id}
                            className="text-xs text-green-400 hover:text-green-300 disabled:opacity-50"
                            aria-label={`Activer l'offre ${offer.title}`}
                          >
                            Activer
                          </button>
                        )}
                        {offer.status !== "flagged" && (
                          <button
                            onClick={() => handleModerate(offer.id, "flagged")}
                            disabled={actionLoading === offer.id}
                            className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                            aria-label={`Signaler l'offre ${offer.title}`}
                          >
                            Signaler
                          </button>
                        )}
                        {offer.status !== "archived" && (
                          <button
                            onClick={() => handleModerate(offer.id, "archived")}
                            disabled={actionLoading === offer.id}
                            className="text-xs text-zinc-400 hover:text-zinc-300 disabled:opacity-50"
                            aria-label={`Archiver l'offre ${offer.title}`}
                          >
                            Archiver
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!offers && (
              <div className="py-8 text-center text-sm text-zinc-500">Chargement…</div>
            )}
          </div>
        </section>
      )}

      {tab === "users" && (
        <section aria-label="Gestion des utilisateurs">
          <div className="rounded-xl border border-zinc-800 overflow-hidden">
            <table className="w-full text-sm" role="table" aria-label="Liste des utilisateurs">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900">
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Nom</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase hidden sm:table-cell">Email</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Rôle</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(users?.data ?? []).map((u) => (
                  <tr key={u.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50">
                    <td className="px-4 py-3 text-zinc-200">{u.name ?? "—"}</td>
                    <td className="px-4 py-3 text-zinc-400 hidden sm:table-cell">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${u.role === "admin" ? "text-orange-400" : "text-zinc-400"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.id !== user?.id && (
                        <button
                          onClick={() => handleToggleUser(u.id, !u.is_active)}
                          disabled={actionLoading === u.id}
                          className={`text-xs disabled:opacity-50 ${u.is_active ? "text-red-400 hover:text-red-300" : "text-green-400 hover:text-green-300"}`}
                          aria-label={u.is_active ? `Désactiver ${u.email}` : `Activer ${u.email}`}
                        >
                          {u.is_active ? "Désactiver" : "Activer"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!users && (
              <div className="py-8 text-center text-sm text-zinc-500">Chargement…</div>
            )}
          </div>
        </section>
      )}

      {tab === "audit" && (
        <section aria-label="Journal d'audit">
          <div className="rounded-xl border border-zinc-800 overflow-hidden">
            <table className="w-full text-sm" role="table" aria-label="Journal des actions">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900">
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Action</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase hidden sm:table-cell">Cible</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {(auditLog?.data ?? []).map((log) => (
                  <tr key={log.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50">
                    <td className="px-4 py-3 text-zinc-300 font-mono text-xs">{log.action}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs hidden sm:table-cell">{log.target_type}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">
                      <time dateTime={log.created_at}>
                        {new Date(log.created_at).toLocaleString("fr-FR")}
                      </time>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!auditLog && (
              <div className="py-8 text-center text-sm text-zinc-500">Chargement…</div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
