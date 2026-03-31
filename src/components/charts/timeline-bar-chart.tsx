"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type BarEntry = {
  label: string;
  value: number;
};

function CustomTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  unit?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-[var(--foreground)]">{label}</p>
      <p className="text-[var(--ink-soft)]">
        {payload[0].value.toLocaleString("fr-MA")}
        {unit ? ` ${unit}` : ""}
      </p>
    </div>
  );
}

export function TimelineBarChart({
  data,
  unit,
}: {
  data: BarEntry[];
  unit?: string;
}) {
  if (data.length === 0) return null;

  return (
    <div className="w-full" style={{ height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--line)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--ink-soft)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--ink-soft)" }}
            axisLine={false}
            tickLine={false}
            width={46}
          />
          <Tooltip content={<CustomTooltip unit={unit} />} />
          <Bar
            dataKey="value"
            fill="var(--accent)"
            radius={[6, 6, 0, 0]}
            animationDuration={600}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
