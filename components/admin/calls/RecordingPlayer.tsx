"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDuration, type Recording } from "@/features/admin/calls";

export function RecordingPlayer({ recording }: { recording: Recording }) {
  const t = useTranslations("Dashboard.calls");
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, []);

  useEffect(() => {
    if (!playing) {
      if (timer.current) window.clearInterval(timer.current);
      return;
    }
    timer.current = window.setInterval(() => {
      setElapsed((s) => {
        if (s + 1 >= recording.durationSec) {
          setPlaying(false);
          return recording.durationSec;
        }
        return s + 1;
      });
    }, 1000);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [playing, recording.durationSec]);

  const pct = recording.durationSec > 0 ? (elapsed / recording.durationSec) * 100 : 0;
  const bars = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => 20 + Math.round(60 * Math.abs(Math.sin(i * 1.7)))),
    []
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Button
          size="icon"
          className="size-12 shrink-0 rounded-full"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause" : t("playAction")}
        >
          {playing ? (
            <Pause className="size-5" aria-hidden="true" />
          ) : (
            <Play className="size-5" aria-hidden="true" />
          )}
        </Button>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex h-10 items-center gap-[3px]" aria-hidden="true">
            {bars.map((h, i) => (
              <span
                key={i}
                style={{ height: `${h}%` }}
                className={cn(
                  "w-full rounded-sm",
                  (i / bars.length) * 100 <= pct ? "bg-secondary" : "bg-border"
                )}
              />
            ))}
          </div>
          <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
            <span>{formatDuration(elapsed)}</span>
            <span>{formatDuration(recording.durationSec)}</span>
          </div>
        </div>
      </div>
      <div className="h-1.5 w-full bg-muted">
        <div className="h-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
