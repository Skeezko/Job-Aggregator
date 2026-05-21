import type { ContractType, RemotePolicy } from "@/lib/types";

const contractLabels: Record<ContractType, string> = {
  internship: "Stage",
  apprenticeship: "Alternance",
  full_time: "CDI",
  freelance: "Freelance",
  unknown: "—",
};

const contractColors: Record<ContractType, string> = {
  internship: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  apprenticeship: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  full_time: "bg-green-500/10 text-green-400 border-green-500/20",
  freelance: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  unknown: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const remoteLabels: Record<RemotePolicy, string> = {
  onsite: "Sur site",
  hybrid: "Hybride",
  remote: "Remote",
  unknown: "—",
};

const remoteColors: Record<RemotePolicy, string> = {
  onsite: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  hybrid: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  remote: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  unknown: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
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
  if (!type || type === "unknown") return null;
  return <Badge className={contractColors[type]}>{contractLabels[type]}</Badge>;
}

export function RemoteBadge({ policy }: { policy: RemotePolicy | null }) {
  if (!policy || policy === "unknown") return null;
  return <Badge className={remoteColors[policy]}>{remoteLabels[policy]}</Badge>;
}
