"use client";

interface LineChartProps {
  data: { date: string; count: number }[];
  title: string;
}

export function LineChart({ data, title }: LineChartProps) {
  if (data.length === 0) {
    return (
      <figure className="flex flex-col gap-3 p-5 rounded-xl border border-zinc-800 bg-zinc-900" aria-label={title}>
        <figcaption className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{title}</figcaption>
        <p className="text-sm text-zinc-600 text-center py-6">Aucune donnée disponible</p>
      </figure>
    );
  }

  const max = Math.max(...data.map((d) => d.count), 1);
  const width = 400;
  const height = 120;
  const pad = { top: 8, right: 8, bottom: 20, left: 32 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  const points = data.map((d, i) => {
    const x = pad.left + (i / Math.max(data.length - 1, 1)) * chartW;
    const y = pad.top + chartH - (d.count / max) * chartH;
    return `${x},${y}`;
  });

  const polyline = points.join(" ");
  const areaPoints = [
    `${pad.left},${pad.top + chartH}`,
    ...points,
    `${pad.left + chartW},${pad.top + chartH}`,
  ].join(" ");

  const labels = data
    .filter((_, i) => i % Math.ceil(data.length / 5) === 0 || i === data.length - 1)
    .map((d) => {
      const idx = data.indexOf(d);
      const x = pad.left + (idx / Math.max(data.length - 1, 1)) * chartW;
      const label = new Date(d.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
      return { x, label };
    });

  return (
    <figure
      className="flex flex-col gap-3 p-5 rounded-xl border border-zinc-800 bg-zinc-900"
      aria-label={title}
    >
      <figcaption className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
        {title}
      </figcaption>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        aria-hidden="true"
        role="presentation"
      >
        <polygon
          points={areaPoints}
          fill="rgba(59,130,246,0.1)"
        />
        <polyline
          points={polyline}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {labels.map(({ x, label }) => (
          <text
            key={label}
            x={x}
            y={height - 4}
            textAnchor="middle"
            fill="#52525b"
            fontSize="9"
          >
            {label}
          </text>
        ))}
        {[0, 0.5, 1].map((ratio) => (
          <text
            key={ratio}
            x={pad.left - 4}
            y={pad.top + chartH - ratio * chartH + 3}
            textAnchor="end"
            fill="#52525b"
            fontSize="9"
          >
            {Math.round(ratio * max)}
          </text>
        ))}
      </svg>
    </figure>
  );
}
