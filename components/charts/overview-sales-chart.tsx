"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

export type OverviewSalesDatum = { name: string; value: number };

type Props = {
  data: OverviewSalesDatum[];
};

/** Utilisé avec `dynamic(..., { ssr: false })` pour éviter mesures ResponsiveContainer au build. */
export function OverviewSalesChart({ data }: Props) {
  return (
    <div className="h-[240px] w-full min-h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barSize={40}>
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9ca3af", fontSize: 10, fontWeight: 700 }}
            dy={10}
          />
          <Tooltip
            cursor={{ fill: "#f3f4f6" }}
            contentStyle={{
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
          />
          <Bar dataKey="value" radius={[6, 6, 6, 6]}>
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={index === 4 ? "#4f46e5" : "#e0e7ff"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
