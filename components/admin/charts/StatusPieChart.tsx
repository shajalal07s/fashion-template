"use client";

import { ResponsivePie } from "@nivo/pie";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { STATUS_COLORS } from "@/components/admin/charts/nivo-theme";
import { useNivoTheme } from "@/components/admin/charts/use-nivo-theme";
import type { StatusSlice } from "@/features/admin/analytics";

export function StatusPieChart({ data, unitLabel }: { data: StatusSlice[]; unitLabel?: string }) {
  const t = useTranslations("Dashboard.admin");
  const nivoTheme = useNivoTheme();
  const { resolvedTheme } = useTheme();
  const labelColor = resolvedTheme === "dark" ? "#ffffff" : "#1a0d00";
  const unit = unitLabel ?? t("charts.ordersUnit");

  return (
    <div className="h-[300px] w-full md:h-[340px]">
      <ResponsivePie
        data={data}
        theme={nivoTheme}
        margin={{ top: 24, right: 24, bottom: 72, left: 24 }}
        innerRadius={0.55}
        padAngle={2}
        cornerRadius={0}
        colors={({ id }) => STATUS_COLORS[String(id)] ?? "#f8ac0c"}
        borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
        borderWidth={1}
        arcLinkLabelsSkipAngle={12}
        arcLinkLabelsTextColor={labelColor}
        arcLinkLabelsThickness={1}
        arcLinkLabelsColor={{ from: "color" }}
        arcLabelsSkipAngle={14}
        arcLabelsTextColor="#ffffff"
        legends={[
          {
            anchor: "bottom",
            direction: "row",
            justify: false,
            translateY: 56,
            itemWidth: 92,
            itemHeight: 18,
            itemTextColor: labelColor,
            symbolSize: 12,
            symbolShape: "square",
          },
        ]}
        tooltip={({ datum }) => (
          <div className="border border-border bg-card px-3 py-2 text-xs shadow-md">
            <p className="font-semibold text-foreground">{datum.label}</p>
            <p className="font-bold text-secondary">
              {datum.value} {unit}
            </p>
          </div>
        )}
      />
    </div>
  );
}
