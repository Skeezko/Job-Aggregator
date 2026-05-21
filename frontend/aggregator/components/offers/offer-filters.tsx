"use client";

import { useCallback } from "react";
import type {
  ContractType,
  OffersFilter,
  RemotePolicy,
} from "@/lib/types";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface OfferFiltersProps {
  filters: OffersFilter;
  onChange: (f: OffersFilter) => void;
  onReset: () => void;
}

const CONTRACT_TYPES: { value: ContractType; label: string }[] = [
  { value: "full_time", label: "CDI" },
  { value: "internship", label: "Stage" },
  { value: "apprenticeship", label: "Alternance" },
  { value: "freelance", label: "Freelance" },
];

const REMOTE_POLICIES: { value: RemotePolicy; label: string }[] = [
  { value: "onsite", label: "Sur site" },
  { value: "hybrid", label: "Hybride" },
  { value: "remote", label: "Remote" },
];

export function OfferFilters({ filters, onChange, onReset }: OfferFiltersProps) {
  const set = useCallback(
    (key: keyof OffersFilter, value: string | number | undefined) =>
      onChange({ ...filters, [key]: value || undefined, offset: 0 }),
    [filters, onChange]
  );

  return (
    <aside
      aria-label="Filtres de recherche"
      className="flex flex-col gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900"
    >
      <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
        Filtres
      </h2>

      <Input
        label="Ville"
        placeholder="Paris, Lyon…"
        value={filters.city ?? ""}
        onChange={(e) => set("city", e.target.value)}
        aria-label="Filtrer par ville"
      />

      <Select
        label="Type de contrat"
        value={filters.contract_type ?? ""}
        onChange={(e) =>
          set("contract_type", e.target.value as ContractType | "")
        }
      >
        <option value="">Tous les contrats</option>
        {CONTRACT_TYPES.map((ct) => (
          <option key={ct.value} value={ct.value}>
            {ct.label}
          </option>
        ))}
      </Select>

      <Select
        label="Télétravail"
        value={filters.remote_policy ?? ""}
        onChange={(e) =>
          set("remote_policy", e.target.value as RemotePolicy | "")
        }
      >
        <option value="">Indifférent</option>
        {REMOTE_POLICIES.map((rp) => (
          <option key={rp.value} value={rp.value}>
            {rp.label}
          </option>
        ))}
      </Select>

      <Button
        variant="ghost"
        size="sm"
        onClick={onReset}
        className="w-full"
        aria-label="Réinitialiser tous les filtres"
      >
        Réinitialiser
      </Button>
    </aside>
  );
}
