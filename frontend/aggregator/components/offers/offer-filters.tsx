"use client";

import { useCallback } from "react";
import type { ContractType, OffersFilter } from "@/lib/types";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface OfferFiltersProps {
  filters: OffersFilter;
  onChange: (f: OffersFilter) => void;
  onReset: () => void;
}

const CONTRACT_TYPES: { value: ContractType; label: string }[] = [
  { value: "cdi", label: "CDI" },
  { value: "cdd", label: "CDD" },
  { value: "stage", label: "Stage" },
  { value: "apprentissage", label: "Alternance" },
  { value: "freelance", label: "Freelance" },
  { value: "interim", label: "Intérim" },
];

export function OfferFilters({ filters, onChange, onReset }: OfferFiltersProps) {
  const set = useCallback(
    (key: keyof OffersFilter, value: string | number | undefined) =>
      onChange({ ...filters, [key]: value || undefined, page: 1 }),
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
        label="Recherche"
        placeholder="Titre, entreprise…"
        value={filters.search ?? ""}
        onChange={(e) => set("search", e.target.value)}
        aria-label="Rechercher des offres"
      />

      <Input
        label="Localisation"
        placeholder="Paris, Remote…"
        value={filters.location ?? ""}
        onChange={(e) => set("location", e.target.value)}
      />

      <Select
        label="Type de contrat"
        value={filters.contract_type ?? ""}
        onChange={(e) => set("contract_type", e.target.value)}
      >
        <option value="">Tous les contrats</option>
        {CONTRACT_TYPES.map((ct) => (
          <option key={ct.value} value={ct.value}>
            {ct.label}
          </option>
        ))}
      </Select>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-medium text-zinc-300">
          Salaire (€/an)
        </legend>
        <div className="flex gap-2">
          <Input
            placeholder="Min"
            type="number"
            min={0}
            step={5000}
            value={filters.salary_min ?? ""}
            onChange={(e) =>
              set(
                "salary_min",
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            aria-label="Salaire minimum"
          />
          <Input
            placeholder="Max"
            type="number"
            min={0}
            step={5000}
            value={filters.salary_max ?? ""}
            onChange={(e) =>
              set(
                "salary_max",
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            aria-label="Salaire maximum"
          />
        </div>
      </fieldset>

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
