"use client";

import { useTranslations } from "next-intl";
import { Suspense, use, useState } from "react";
import {
  Check,
  Copy,
  Crosshair,
  ExternalLink,
  Loader2,
  MapPin,
  Minus,
  Navigation,
  Plus,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface MapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string | null;
  title?: string;
}

const MIN_ZOOM = 3;
const MAX_ZOOM = 20;
const TILE_ZOOM = 16;

interface GeoPoint {
  lat: number;
  lon: number;
  label: string;
}

const geoCache = new Map<string, Promise<GeoPoint | null>>();

function lookupGeo(query: string): Promise<GeoPoint | null> {
  const cached = geoCache.get(query);
  if (cached) return cached;
  const task = fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=0&q=${encodeURIComponent(query)}`,
    { headers: { Accept: "application/json" } }
  )
    .then((res) => (res.ok ? res.json() : []))
    .then((json) => {
      const first = Array.isArray(json) ? json[0] : null;
      return first
        ? { lat: Number(first.lat), lon: Number(first.lon), label: String(first.display_name ?? query) }
        : null;
    })
    .catch(() => null);
  geoCache.set(query, task);
  return task;
}

function tileXY(lat: number, lon: number, z: number) {
  const n = Math.pow(2, z);
  const x = ((lon + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return {
    xtile: Math.floor(x),
    ytile: Math.floor(y),
    xfrac: x - Math.floor(x),
    yfrac: y - Math.floor(y),
  };
}

function TargetSnapshot({ query }: { query: string }) {
  const geo = use(lookupGeo(query));
  if (!geo || !Number.isFinite(geo.lat) || !Number.isFinite(geo.lon)) return null;
  const { xtile, ytile, xfrac, yfrac } = tileXY(geo.lat, geo.lon, TILE_ZOOM);
  const src = `https://tile.openstreetmap.org/${TILE_ZOOM}/${xtile}/${ytile}.png`;
  return (
    <div className="flex flex-col gap-1.5 border border-border bg-card p-2.5">
      <p className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-muted-foreground uppercase">
        <Crosshair className="size-3.5 text-secondary" aria-hidden="true" />
        Exact Target · {geo.lat.toFixed(5)}, {geo.lon.toFixed(5)}
      </p>
      <div className="relative h-44 w-full overflow-hidden border border-border bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={query} loading="lazy" className="h-full w-full object-cover" />
        <MapPin
          className="absolute size-7 -translate-x-1/2 -translate-y-full text-secondary drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]"
          style={{ left: `${xfrac * 100}%`, top: `${yfrac * 100}%` }}
          aria-hidden="true"
          fill="currentColor"
        />
      </div>
      <p className="truncate text-[11px] text-muted-foreground">{geo.label}</p>
    </div>
  );
}

interface SearchHit {
  label: string;
}

async function searchPlaces(text: string): Promise<SearchHit[]> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=0&q=${encodeURIComponent(text)}`,
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) return [];
  const json = await res.json();
  if (!Array.isArray(json)) return [];
  return json
    .filter((j) => j?.display_name)
    .map((j) => ({ label: String(j.display_name) }));
}

export function MapDialog({ open, onOpenChange, query, title }: MapDialogProps) {
  const t = useTranslations("Dashboard.calls");
  const [zoom, setZoom] = useState(15);
  const [copied, setCopied] = useState(false);
  const [place, setPlace] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [searching, setSearching] = useState(false);
  const [hits, setHits] = useState<SearchHit[]>([]);

  const activeQuery = place ?? query;
  const src = activeQuery
    ? `https://maps.google.com/maps?q=${encodeURIComponent(activeQuery)}&z=${zoom}&output=embed`
    : "";
  const external = activeQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeQuery)}`
    : "#";
  const directions = activeQuery
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activeQuery)}`
    : "#";

  const close = (next: boolean) => {
    if (!next) {
      setZoom(15);
      setCopied(false);
      setPlace(null);
      setSearchText("");
      setHits([]);
      setSearching(false);
    }
    onOpenChange(next);
  };

  const copyLocation = async () => {
    if (!activeQuery) return;
    try {
      await navigator.clipboard.writeText(activeQuery);
      setCopied(true);
      toast.success(t("copied"));
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(t("copied"));
    }
  };

  const runSearch = async () => {
    const text = searchText.trim();
    if (!text) return;
    setSearching(true);
    try {
      setHits(await searchPlaces(text));
    } catch {
      setHits([]);
    }
    setSearching(false);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90vh] gap-3 overflow-y-auto p-4 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading text-base font-bold">
            <MapPin className="size-4 shrink-0 text-secondary" aria-hidden="true" />
            <span className="min-w-0 truncate">{title ?? activeQuery ?? ""}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder={t("searchPlace")}
            className="bg-card"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void runSearch();
              }
            }}
          />
          <button
            type="button"
            onClick={() => void runSearch()}
            aria-label={t("searchPlace")}
            className="flex size-8 shrink-0 items-center justify-center bg-secondary text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            disabled={searching || !searchText.trim()}
          >
            {searching ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Search className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>

        {hits.length > 0 ? (
          <div className="flex max-h-36 flex-col gap-1 overflow-y-auto border border-border bg-card p-1.5">
            {hits.map((hit) => (
              <button
                key={hit.label}
                type="button"
                onClick={() => {
                  setPlace(hit.label);
                  setHits([]);
                  setSearchText("");
                }}
                className="flex items-center gap-2 px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted"
              >
                <MapPin className="size-3.5 shrink-0 text-secondary" aria-hidden="true" />
                <span className="line-clamp-1">{hit.label}</span>
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex items-center gap-2 border border-border bg-card px-3 py-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center bg-secondary/15">
            <MapPin className="size-4 text-secondary" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{activeQuery ?? ""}</span>
          <button
            type="button"
            onClick={() => void copyLocation()}
            aria-label={activeQuery ?? ""}
            title={activeQuery ?? ""}
            className="flex size-8 shrink-0 items-center justify-center border border-border transition-colors hover:bg-muted hover:text-secondary"
          >
            {copied ? (
              <Check className="size-4 text-green-600" aria-hidden="true" />
            ) : (
              <Copy className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>

        <div className="relative">
          {activeQuery && open ? (
            <iframe
              key={`${activeQuery}-${zoom}`}
              src={src}
              title={title ?? activeQuery}
              loading="lazy"
              className="h-[380px] w-full border border-border md:h-[440px]"
            />
          ) : null}
          <div className="absolute top-2 right-2 flex flex-col overflow-hidden border border-border bg-card shadow-md">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + 1))}
              disabled={zoom >= MAX_ZOOM}
              aria-label="Zoom in"
              className="flex size-8 items-center justify-center transition-colors hover:bg-muted disabled:opacity-40"
            >
              <Plus className="size-4" aria-hidden="true" />
            </button>
            <span className="border-y border-border px-1 py-0.5 text-center font-mono text-[11px] font-bold">
              {zoom}
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - 1))}
              disabled={zoom <= MIN_ZOOM}
              aria-label="Zoom out"
              className="flex size-8 items-center justify-center transition-colors hover:bg-muted disabled:opacity-40"
            >
              <Minus className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {activeQuery && open ? (
          <Suspense
            fallback={
              <div className="h-24 animate-pulse border border-border bg-muted/40" aria-hidden="true" />
            }
          >
            <TargetSnapshot query={activeQuery} />
          </Suspense>
        ) : null}

        <div className="flex items-center justify-end gap-4">
          <a
            href={directions}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-secondary hover:underline"
          >
            <Navigation className="size-3.5" aria-hidden="true" />
            {t("directions")}
          </a>
          <a
            href={external}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-secondary hover:underline"
          >
            <ExternalLink className="size-3.5" aria-hidden="true" />
            {t("openInMaps")}
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
