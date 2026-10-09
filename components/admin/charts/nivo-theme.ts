export const BRAND_COLORS = ["#f8ac0c", "#ff8000", "#ff962e", "#1a0d00", "#c2410c"];

export const STATUS_COLORS: Record<string, string> = {
  Delivered: "#16a34a",
  Shipped: "#ff8000",
  Processing: "#f8ac0c",
  Pending: "#6b5d4a",
  Cancelled: "#dc2626",
  Completed: "#16a34a",
  Missed: "#ff8000",
  Failed: "#dc2626",
};

export const nivoTheme = {
  background: "transparent",
  text: {
    fontSize: 11,
    fill: "#6b5d4a",
    fontFamily: "inherit",
  },
  axis: {
    domain: { line: { stroke: "#f0e6d6", strokeWidth: 1 } },
    legend: { text: { fontSize: 12, fill: "#1a0d00", fontWeight: 600 } },
    ticks: {
      line: { stroke: "#f0e6d6", strokeWidth: 1 },
      text: { fontSize: 11, fill: "#6b5d4a" },
    },
  },
  grid: { line: { stroke: "#f0e6d6", strokeWidth: 1, strokeDasharray: "4 4" } },
  legends: { text: { fontSize: 11, fill: "#1a0d00" } },
  tooltip: {
    container: {
      background: "#ffffff",
      color: "#1a0d00",
      fontSize: 12,
      border: "1px solid #f0e6d6",
      boxShadow: "0 4px 16px rgba(26,13,0,0.08)",
    },
  },
};

export const nivoThemeDark = {
  background: "transparent",
  text: {
    fontSize: 11,
    fill: "#c4b19a",
    fontFamily: "inherit",
  },
  axis: {
    domain: { line: { stroke: "rgba(255,255,255,0.14)", strokeWidth: 1 } },
    legend: { text: { fontSize: 12, fill: "#ffffff", fontWeight: 600 } },
    ticks: {
      line: { stroke: "rgba(255,255,255,0.14)", strokeWidth: 1 },
      text: { fontSize: 11, fill: "#c4b19a" },
    },
  },
  grid: { line: { stroke: "rgba(255,255,255,0.08)", strokeWidth: 1, strokeDasharray: "4 4" } },
  legends: { text: { fontSize: 11, fill: "#ffffff" } },
  tooltip: {
    container: {
      background: "#2a1a05",
      color: "#ffffff",
      fontSize: 12,
      border: "1px solid rgba(255,255,255,0.14)",
      boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
    },
  },
};
