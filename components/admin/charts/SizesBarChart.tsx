"use client";

import { ResponsiveBar } from "@nivo/bar";
import { useTranslations } from "next-intl";
import { BRAND_COLORS } from "@/components/admin/charts/nivo-theme";
import { useNivoTheme } from "@/components/admin/charts/use-nivo-theme";

export interface SizeDatum {
  size: string;
  products: number;
  stock: number;
  [key: string]: string | number;
}

export function SizesBarChart({ data }: { data: SizeDatum[] }) {
  const t = useTranslations("Dashboard.admin");
  const nivoTheme = useNivoTheme();

  return (
    <div className="h-[280px] w-full md:h-[320px]">
      <ResponsiveBar
        data={data}
        keys={["products"]}
        indexBy="size"
        theme={nivoTheme}
        margin={{ top: 16, right: 16, bottom: 44, left: 48 }}
        padding={0.4}
        borderRadius={0}
        colors={BRAND_COLORS}
        colorBy="indexValue"
        borderColor={{ from: "color", modifiers: [["darker", 0.3]] }}
        enableGridX={false}
        axisBottom={{
          tickSize: 0,
          tickPadding: 12,
          legend: t("attributes.chartSize"),
          legendOffset: 34,
          legendPosition: "middle",
        }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 10,
          tickValues: 5,
        }}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor="#1a0d00"
        tooltip={({ indexValue, data: datum }) => (
          <div className="border border-border bg-card px-3 py-2 text-xs shadow-md">
            <p className="font-semibold text-foreground">{String(indexValue)}</p>
            <p className="text-muted-foreground">
              {t("attributes.colProducts")}:{" "}
              <span className="font-bold text-secondary">{(datum as SizeDatum).products}</span>
            </p>
            <p className="text-muted-foreground">
              {t("attributes.colStock")}:{" "}
              <span className="font-bold text-secondary">{(datum as SizeDatum).stock}</span>
            </p>
          </div>
        )}
      />
    </div>
  );
}
