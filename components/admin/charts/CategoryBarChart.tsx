"use client";

import { ResponsiveBar } from "@nivo/bar";
import { useFormatter, useTranslations } from "next-intl";
import { BRAND_COLORS } from "@/components/admin/charts/nivo-theme";
import { useNivoTheme } from "@/components/admin/charts/use-nivo-theme";
import type { CategorySales } from "@/features/admin/analytics";

export function CategoryBarChart({ data }: { data: CategorySales[] }) {
  const t = useTranslations("Dashboard.admin");
  const format = useFormatter();
  const nivoTheme = useNivoTheme();
  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  return (
    <div className="h-[300px] w-full md:h-[340px]">
      <ResponsiveBar
        data={data}
        keys={["sales"]}
        indexBy="category"
        theme={nivoTheme}
        margin={{ top: 16, right: 16, bottom: 44, left: 64 }}
        padding={0.35}
        borderRadius={0}
        colors={BRAND_COLORS}
        colorBy="indexValue"
        borderColor={{ from: "color", modifiers: [["darker", 0.3]] }}
        enableGridX={false}
        axisBottom={{
          tickSize: 0,
          tickPadding: 12,
          legend: t("charts.category"),
          legendOffset: 34,
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
        labelTextColor="#1a0d00"
        tooltip={({ indexValue, value }) => (
          <div className="border border-border bg-card px-3 py-2 text-xs shadow-md">
            <p className="font-semibold text-foreground">{String(indexValue)}</p>
            <p className="font-bold text-secondary">{money(Number(value))}</p>
          </div>
        )}
      />
    </div>
  );
}
