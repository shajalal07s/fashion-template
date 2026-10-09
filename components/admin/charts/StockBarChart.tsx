"use client";

import { ResponsiveBar } from "@nivo/bar";
import { useTranslations } from "next-intl";
import { useNivoTheme } from "@/components/admin/charts/use-nivo-theme";

export interface StockDatum {
  product: string;
  stock: number;
  [key: string]: string | number;
}

export function StockBarChart({ data }: { data: StockDatum[] }) {
  const t = useTranslations("Dashboard.admin");
  const nivoTheme = useNivoTheme();

  return (
    <div className="h-[300px] w-full md:h-[340px]">
      <ResponsiveBar
        data={data}
        keys={["stock"]}
        indexBy="product"
        layout="horizontal"
        theme={nivoTheme}
        margin={{ top: 8, right: 24, bottom: 40, left: 132 }}
        padding={0.35}
        borderRadius={0}
        colors={["#ff8000"]}
        borderColor={{ from: "color", modifiers: [["darker", 0.3]] }}
        enableGridY={false}
        axisBottom={{
          tickSize: 0,
          tickPadding: 8,
          tickValues: 5,
          legend: t("inventory.stockUnit"),
          legendOffset: 32,
          legendPosition: "middle",
        }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 8,
        }}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor="#1a0d00"
        tooltip={({ indexValue, value }) => (
          <div className="border border-border bg-card px-3 py-2 text-xs shadow-md">
            <p className="font-semibold text-foreground">{String(indexValue)}</p>
            <p className="text-muted-foreground">
              {t("inventory.colStock")}:{" "}
              <span className="font-bold text-secondary">{Number(value)}</span>
            </p>
          </div>
        )}
      />
    </div>
  );
}
