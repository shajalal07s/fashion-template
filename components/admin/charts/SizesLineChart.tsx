"use client";

import { ResponsiveLine } from "@nivo/line";
import { useTranslations } from "next-intl";
import { useNivoTheme } from "@/components/admin/charts/use-nivo-theme";
import type { SizeDatum } from "@/components/admin/charts/SizesBarChart";

export function SizesLineChart({ data }: { data: SizeDatum[] }) {
  const t = useTranslations("Dashboard.admin");
  const nivoTheme = useNivoTheme();

  const series = [
    {
      id: t("attributes.colProducts"),
      data: data.map((d) => ({ x: d.size, y: d.products })),
    },
  ];
  const stockOf = (size: string) => data.find((d) => d.size === size)?.stock ?? 0;

  return (
    <div className="h-[280px] w-full md:h-[320px]">
      <ResponsiveLine
        data={series}
        theme={nivoTheme}
        margin={{ top: 16, right: 16, bottom: 44, left: 48 }}
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
            id: "sizesGradient",
            type: "linearGradient",
            colors: [
              { offset: 0, color: "#ff8000", opacity: 0.35 },
              { offset: 100, color: "#ff8000", opacity: 0 },
            ],
          },
        ]}
        fill={[{ match: "*", id: "sizesGradient" }]}
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
        tooltip={({ point }) => (
          <div className="border border-border bg-card px-3 py-2 text-xs shadow-md">
            <p className="font-semibold text-foreground">{String(point.data.x)}</p>
            <p className="text-muted-foreground">
              {t("attributes.colProducts")}:{" "}
              <span className="font-bold text-secondary">{Number(point.data.y)}</span>
            </p>
            <p className="text-muted-foreground">
              {t("attributes.colStock")}:{" "}
              <span className="font-bold text-secondary">{stockOf(String(point.data.x))}</span>
            </p>
          </div>
        )}
        useMesh
      />
    </div>
  );
}
