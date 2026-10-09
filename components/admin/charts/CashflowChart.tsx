"use client";

import { ResponsiveBar } from "@nivo/bar";
import { useFormatter } from "next-intl";
import { useNivoTheme } from "@/components/admin/charts/use-nivo-theme";
import type { CashflowPoint } from "@/features/admin/accounting";

export function CashflowChart({
  data,
  incomeLabel,
  expenseLabel,
}: {
  data: CashflowPoint[];
  incomeLabel: string;
  expenseLabel: string;
}) {
  const format = useFormatter();
  const nivoTheme = useNivoTheme();
  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  return (
    <div className="h-[300px] w-full md:h-[340px]">
      <ResponsiveBar
        data={data}
        keys={["income", "expense"]}
        indexBy="month"
        theme={nivoTheme}
        margin={{ top: 16, right: 16, bottom: 44, left: 64 }}
        padding={0.3}
        groupMode="grouped"
        borderRadius={0}
        colors={["#ff8000", "#1a0d00"]}
        borderColor={{ from: "color", modifiers: [["darker", 0.3]] }}
        enableGridX={false}
        axisBottom={{
          tickSize: 0,
          tickPadding: 12,
          legendPosition: "middle",
        }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 10,
          tickValues: 5,
          format: (v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(Math.round(v))),
        }}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor="#ffffff"
        legends={[
          {
            dataFrom: "keys",
            data: [
              { id: "income", label: incomeLabel, color: "#ff8000" },
              { id: "expense", label: expenseLabel, color: "#1a0d00" },
            ],
            anchor: "top-left",
            direction: "row",
            justify: false,
            translateY: -8,
            itemWidth: 110,
            itemHeight: 18,
            symbolSize: 12,
            symbolShape: "square",
          },
        ]}
        tooltip={({ id, value, indexValue }) => (
          <div className="border border-border bg-card px-3 py-2 text-xs shadow-md">
            <p className="font-semibold text-foreground">
              {indexValue} · {id === "income" ? incomeLabel : expenseLabel}
            </p>
            <p className="font-bold text-secondary">{money(Number(value))}</p>
          </div>
        )}
      />
    </div>
  );
}
