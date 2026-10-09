"use client";

import { ResponsivePie } from "@nivo/pie";
import { useTranslations } from "next-intl";
import { useNivoTheme } from "@/components/admin/charts/use-nivo-theme";
import { useTheme } from "next-themes";

export interface SizeSlice {
  id: string;
  label: string;
  value: number;
  stock: number;
  color: string;
}

export function SizesPieChart({ data }: { data: SizeSlice[] }) {
  const t = useTranslations("Dashboard.admin");
  const nivoTheme = useNivoTheme();
  const { resolvedTheme } = useTheme();
  const labelColor = resolvedTheme === "dark" ? "#ffffff" : "#1a0d00";

  return (
    <div className="h-[280px] w-full md:h-[320px]">
      <ResponsivePie
        data={data}
        theme={nivoTheme}
        margin={{ top: 24, right: 24, bottom: 24, left: 24 }}
        innerRadius={0.55}
        padAngle={2}
        cornerRadius={0}
        colors={{ datum: "data.color" }}
        borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
        borderWidth={1}
        arcLinkLabelsSkipAngle={14}
        arcLinkLabelsTextColor={labelColor}
        arcLinkLabelsThickness={1}
        arcLinkLabelsColor={{ from: "color" }}
        arcLabelsSkipAngle={16}
        arcLabelsTextColor="#ffffff"
        tooltip={({ datum }) => (
          <div className="border border-border bg-card px-3 py-2 text-xs shadow-md">
            <p className="font-semibold text-foreground">{datum.label}</p>
            <p className="text-muted-foreground">
              {t("attributes.colProducts")}:{" "}
              <span className="font-bold text-secondary">{datum.value}</span>
            </p>
            <p className="text-muted-foreground">
              {t("attributes.colStock")}:{" "}
              <span className="font-bold text-secondary">{(datum.data as SizeSlice).stock}</span>
            </p>
          </div>
        )}
      />
    </div>
  );
}
