"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

export type SalesPerformanceDatum = { name: string; value: number };

type Props = {
  data: SalesPerformanceDatum[];
};

/** Utilisé avec `dynamic(..., { ssr: false })` pour éviter mesures ResponsiveContainer au build. */
export function SalesPerformanceChart({ data }: Props) {
  return (
    <div className="h-48 w-full min-h-[12rem] relative">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fontWeight: 700, fill: "#9ca3af" }}
            dy={10}
          />
          <Tooltip
            cursor={{ fill: "transparent" }}
            contentStyle={{
              borderRadius: "12px",
              border: "none",
              boxShadow:
                "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
            }}
          />
          <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={32}>
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={index === 2 ? "#4f46e5" : "#e5e7eb"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
