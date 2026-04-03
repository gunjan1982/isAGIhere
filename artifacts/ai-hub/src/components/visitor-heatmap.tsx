import { useQuery } from "@tanstack/react-query";
import { Activity, Rocket } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// Go-live date
const GO_LIVE_DATE = "2026-04-04";

interface HeatmapDay {
  day: string;
  views: string | number;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getColorClass(views: number, max: number, isGoLive: boolean): string {
  if (isGoLive && views === 0) return "bg-primary/30 ring-1 ring-primary/60";
  if (views === 0) return "bg-border/20";
  const ratio = views / max;
  if (ratio < 0.15) return "bg-primary/20";
  if (ratio < 0.35) return "bg-primary/40";
  if (ratio < 0.6)  return "bg-primary/65";
  if (ratio < 0.85) return "bg-primary/85";
  return "bg-primary";
}

function buildGrid(days: HeatmapDay[]) {
  const map = new Map<string, number>();
  for (const d of days) {
    map.set(d.day as string, Number(d.views));
  }

  // Last 30 days, aligned to Sunday at the start
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - 29);
  // Align back to the nearest Sunday on or before start
  start.setDate(start.getDate() - start.getDay());

  const weeks: { date: Date; views: number }[][] = [];
  let current = new Date(start);

  while (current <= today) {
    const week: { date: Date; views: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const iso = current.toISOString().slice(0, 10);
      week.push({ date: new Date(current), views: map.get(iso) ?? 0 });
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }

  return weeks;
}

function getMonthLabels(weeks: { date: Date; views: number }[][]) {
  const labels: { label: string; col: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, i) => {
    const month = week[0].date.getMonth();
    if (month !== lastMonth) {
      labels.push({ label: MONTHS[month], col: i });
      lastMonth = month;
    }
  });
  return labels;
}

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function VisitorHeatmap() {
  const { data, isLoading } = useQuery<{ days: HeatmapDay[] }>({
    queryKey: ["heatmap"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/analytics/heatmap`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const weeks = data ? buildGrid(data.days) : [];
  const allViews = weeks.flatMap(w => w.map(d => d.views));
  const max = Math.max(...allViews, 1);
  const total = allViews.reduce((a, b) => a + b, 0);
  const monthLabels = getMonthLabels(weeks);

  // Find go-live week/day index for the marker label
  let goLiveWeekIdx = -1;
  weeks.forEach((week, wi) => {
    week.forEach(({ date }) => {
      if (date.toISOString().slice(0, 10) === GO_LIVE_DATE) {
        goLiveWeekIdx = wi;
      }
    });
  });

  return (
    <section className="space-y-4 pt-8 border-t border-border/50">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold font-mono text-foreground flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          VISITOR_ACTIVITY
        </h2>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs font-mono text-primary border border-primary/30 bg-primary/10 px-2 py-0.5">
            <Rocket className="h-3 w-3" />
            GO_LIVE: Apr 4, 2026
          </span>
          <span className="text-xs font-mono text-muted-foreground tabular-nums">
            {total.toLocaleString()} VIEWS — LAST_30_DAYS
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="border border-border/30 bg-card p-6 h-32 animate-pulse" />
      ) : (
        <div className="border border-border/30 bg-card p-5 overflow-x-auto">
          <div className="inline-block min-w-full">

            {/* Go-live label row above grid */}
            {goLiveWeekIdx >= 0 && (
              <div className="flex gap-[3px] mb-0.5 pl-8">
                {weeks.map((_, i) => (
                  <div key={i} className="w-[11px] shrink-0 flex justify-center">
                    {i === goLiveWeekIdx && (
                      <span className="text-[9px] text-primary font-mono leading-none">🚀</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Month labels */}
            <div className="flex gap-[3px] mb-1 pl-8">
              {weeks.map((_, i) => {
                const label = monthLabels.find(m => m.col === i);
                return (
                  <div key={i} className="w-[11px] shrink-0 text-[9px] font-mono text-muted-foreground">
                    {label ? label.label : ""}
                  </div>
                );
              })}
            </div>

            {/* Grid: 7 rows (days) × N cols (weeks) */}
            <div className="flex gap-1">
              {/* Day labels */}
              <div className="flex flex-col gap-[3px] pr-1">
                {DAYS.map((day, i) => (
                  <div
                    key={day}
                    className={`h-[11px] w-6 text-[9px] font-mono text-muted-foreground flex items-center ${i % 2 === 0 ? "opacity-0" : ""}`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Weeks */}
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map(({ date, views }, di) => {
                    const isoDate = date.toISOString().slice(0, 10);
                    const isToday = isoDate === new Date().toISOString().slice(0, 10);
                    const isGoLive = isoDate === GO_LIVE_DATE;
                    const isFuture = date > new Date();

                    const tooltip = isGoLive
                      ? `🚀 GO LIVE — ${formatDate(isoDate)}: ${views} view${views !== 1 ? "s" : ""}`
                      : `${formatDate(isoDate)}: ${views} view${views !== 1 ? "s" : ""}`;

                    return (
                      <div
                        key={di}
                        title={tooltip}
                        className={`
                          h-[11px] w-[11px] rounded-[2px] transition-opacity cursor-default
                          ${isFuture ? "opacity-0" : ""}
                          ${getColorClass(views, max, isGoLive)}
                          ${isToday ? "ring-1 ring-primary ring-offset-1 ring-offset-card" : ""}
                          ${isGoLive ? "ring-1 ring-primary ring-offset-1 ring-offset-card" : ""}
                          hover:opacity-75
                        `}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Legend + go-live key */}
            <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground">
                <span className="text-primary">🚀</span>
                <span>= site went live</span>
                <span className="ml-1">·</span>
                <span className="ml-1">ring = today</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-muted-foreground">LESS</span>
                {[0, 0.1, 0.3, 0.6, 1].map((r, i) => (
                  <div
                    key={i}
                    className={`h-[11px] w-[11px] rounded-[2px] ${getColorClass(r * max, max, false)}`}
                  />
                ))}
                <span className="text-[9px] font-mono text-muted-foreground">MORE</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </section>
  );
}
