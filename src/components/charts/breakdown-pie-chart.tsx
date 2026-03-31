"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export type PieSlice = {
  name: string;
  value: number;
  color?: string;
};

const DEFAULT_COLORS = [
  "var(--accent)",
  "#60a5fa",
  "#fb923c",
  "#a78bfa",
  "#34d399",
  "#f472b6",
  "#facc15",
];

function formatMAD(value: number) {
  return `${value.toLocaleString("fr-MA")} MAD`;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: PieSlice }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-[var(--foreground)]">{item.name}</p>
      <p className="text-[var(--ink-soft)]">{formatMAD(item.value)}</p>
    </div>
  );
}

export function BreakdownPieChart({ data }: { data: PieSlice[] }) {
  const filtered = data.filter((d) => d.value > 0);
  if (filtered.length === 0) return null;

  return (
    <div className="w-full" style={{ height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={filtered}
            cx="50%"
            cy="46%"
            outerRadius={90}
            innerRadius={52}
            paddingAngle={3}
            dataKey="value"
            animationBegin={0}
            animationDuration={700}
          >
            {filtered.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={entry.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
            formatter={(value: string) => (
              <span style={{ color: "var(--ink-soft)" }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
