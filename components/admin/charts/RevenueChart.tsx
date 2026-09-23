"use client";

import { ResponsiveLine } from "@nivo/line";
import { useFormatter, useTranslations } from "next-intl";
import { useNivoTheme } from "@/components/admin/charts/use-nivo-theme";
import type { RevenuePoint } from "@/features/admin/analytics";

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const t = useTranslations("Dashboard.admin");
  const format = useFormatter();
  const nivoTheme = useNivoTheme();
  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  return (
    <div className="h-[300px] w-full md:h-[340px]">
      <ResponsiveLine
        data={[{ id: t("charts.revenueSeries"), data }]}
        theme={nivoTheme}
        margin={{ top: 16, right: 16, bottom: 44, left: 64 }}
        xScale={{ type: "point" }}
        yScale={{ type: "linear", min: 0, max: "auto", stacked: false }}
        curve="monotoneX"
        colors={["#ff8000"]}
        lineWidth={3}
        pointSize={7}
        pointColor="#ffffff"
        pointBorderWidth={2}
        pointBorderColor="#ff8000"
        enableArea
        areaOpacity={0.12}
        defs={[
          {
            id: "revenueGradient",
            type: "linearGradient",
            colors: [
              { offset: 0, color: "#ff8000", opacity: 0.35 },
              { offset: 100, color: "#ff8000", opacity: 0 },
            ],
          },
        ]}
        fill={[{ match: "*", id: "revenueGradient" }]}
        enableGridX={false}
        axisBottom={{
          tickSize: 0,
          tickPadding: 12,
          legend: t("charts.month"),
          legendOffset: 34,
          legendPosition: "middle",
        }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 10,
          tickValues: 5,
          format: (v: number) =>
            v >= 1000 ? `${Math.round(v / 1000)}k` : String(Math.round(v)),
          legend: t("charts.revenueAxis"),
          legendOffset: -52,
          legendPosition: "middle",
        }}
        tooltip={({ point }) => (
          <div className="border border-border bg-card px-3 py-2 text-xs shadow-md">
            <p className="font-semibold text-foreground">{String(point.data.x)}</p>
            <p className="font-bold text-secondary">{money(Number(point.data.y))}</p>
          </div>
        )}
        useMesh
      />
    </div>
  );
}
