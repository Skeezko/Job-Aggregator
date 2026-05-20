"use client";

interface BarChartProps {
  data: { label: string; value: number }[];
  title: string;
  color?: string;
}

export function BarChart({ data, title, color = "bg-blue-500" }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <figure
      className="flex flex-col gap-3 p-5 rounded-xl border border-zinc-800 bg-zinc-900"
      aria-label={title}
    >
      <figcaption className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
        {title}
      </figcaption>
      <ul className="flex flex-col gap-2" role="list">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-xs text-zinc-400 truncate" title={d.label}>
              {d.label}
            </span>
            <div
              className="flex-1 h-5 bg-zinc-800 rounded overflow-hidden"
              role="presentation"
            >
              <div
                className={`h-full ${color} rounded transition-all`}
                style={{ width: `${(d.value / max) * 100}%` }}
                aria-label={`${d.label}: ${d.value}`}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-xs text-zinc-500">
              {d.value}
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
