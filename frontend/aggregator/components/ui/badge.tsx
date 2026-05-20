import type { ContractType, OfferStatus } from "@/lib/types";

const contractLabels: Record<ContractType, string> = {
  cdi: "CDI",
  cdd: "CDD",
  stage: "Stage",
  apprentissage: "Alternance",
  freelance: "Freelance",
  interim: "Intérim",
  other: "Autre",
};

const contractColors: Record<ContractType, string> = {
  cdi: "bg-green-500/10 text-green-400 border-green-500/20",
  cdd: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  stage: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  apprentissage: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  freelance: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  interim: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  other: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const statusColors: Record<OfferStatus, string> = {
  active: "bg-green-500/10 text-green-400 border-green-500/20",
  closed: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  archived: "bg-zinc-700/40 text-zinc-500 border-zinc-700/40",
  flagged: "bg-red-500/10 text-red-400 border-red-500/20",
};

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${className}`}
    >
      {children}
    </span>
  );
}

export function ContractBadge({ type }: { type: ContractType | null }) {
  if (!type) return null;
  return (
    <Badge className={contractColors[type]}>{contractLabels[type]}</Badge>
  );
}

export function StatusBadge({ status }: { status: OfferStatus }) {
  const labels: Record<OfferStatus, string> = {
    active: "Actif",
    closed: "Fermé",
    archived: "Archivé",
    flagged: "Signalé",
  };
  return <Badge className={statusColors[status]}>{labels[status]}</Badge>;
}
