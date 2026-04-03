import { useQuery } from "@tanstack/react-query";
import { useUser, Show } from "@clerk/react";
import { Link } from "wouter";
import { BarChart2, TrendingUp, Eye, Calendar, Loader2, LogIn } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface AnalyticsStats {
  total: number;
  today: number;
  last7Days: number;
  last30Days: number;
  topPages: { path: string; views: number }[];
  daily: { day: string; views: string; sessions: string }[];
}

const PAGE_LABELS: Record<string, string> = {
  "/": "Home",
  "/people": "People",
  "/feed": "Feed",
  "/learn": "Learn",
  "/sources": "Sources",
  "/communities": "Communities",
  "/agi": "Is AGI Here?",
  "/my-hub": "My Hub",
};

function pageLabel(path: string) {
  return PAGE_LABELS[path] ?? path;
}

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="border border-border/50 bg-card p-5 space-y-1">
      <div className="text-[10px] font-mono tracking-widest text-muted-foreground">{label}</div>
      <div className="text-4xl font-bold font-mono tabular-nums text-primary">{value.toLocaleString()}</div>
      {sub && <div className="text-xs font-mono text-muted-foreground">{sub}</div>}
    </div>
  );
}

function MiniBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-foreground truncate max-w-[70%]">{label}</span>
        <span className="text-primary tabular-nums">{value.toLocaleString()}</span>
      </div>
      <div className="h-1.5 bg-border/30 w-full">
        <div className="h-full bg-primary/70 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SparkLine({ daily }: { daily: AnalyticsStats["daily"] }) {
  if (!daily || daily.length === 0) return null;
  const vals = daily.map(d => Number(d.views));
  const max = Math.max(...vals, 1);
  const W = 600;
  const H = 80;
  const padX = 8;
  const pts = vals.map((v, i) => {
    const x = padX + (i / Math.max(vals.length - 1, 1)) * (W - padX * 2);
    const y = H - 4 - ((v / max) * (H - 16));
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-xs font-bold tracking-widest text-primary">DAILY_VIEWS — LAST_30_DAYS</h3>
        <span className="text-[10px] font-mono text-muted-foreground">{daily[0]?.day} → {daily[daily.length - 1]?.day}</span>
      </div>
      <div className="border border-border/30 bg-secondary/10 p-4 overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map(f => (
            <line key={f} x1={0} y1={H - 4 - f * (H - 16)} x2={W} y2={H - 4 - f * (H - 16)}
              stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
          ))}
          {/* Area fill */}
          <polygon
            points={`${padX},${H} ${pts} ${W - padX},${H}`}
            fill="hsl(var(--primary))"
            fillOpacity="0.12"
          />
          {/* Line */}
          <polyline points={pts} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinejoin="round" />
          {/* Dots */}
          {vals.map((v, i) => {
            const x = padX + (i / Math.max(vals.length - 1, 1)) * (W - padX * 2);
            const y = H - 4 - ((v / max) * (H - 16));
            return <circle key={i} cx={x} cy={y} r="3" fill="hsl(var(--primary))" />;
          })}
        </svg>
        {/* X axis labels */}
        <div className="flex justify-between mt-1 px-1">
          {[daily[0], daily[Math.floor(daily.length / 2)], daily[daily.length - 1]].filter(Boolean).map((d, i) => (
            <span key={i} className="text-[9px] font-mono text-muted-foreground">
              {new Date(d.day).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { isSignedIn } = useUser();
  const { data, isLoading, isError } = useQuery<AnalyticsStats>({
    queryKey: ["analytics-stats"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/analytics/stats`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!isSignedIn,
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground font-mono gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> LOADING_TELEMETRY...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="border border-destructive/30 bg-destructive/10 text-destructive p-4 font-mono text-sm">
        ERR: Failed to load analytics data.
      </div>
    );
  }

  const maxPageViews = Math.max(...(data.topPages?.map(p => Number(p.views)) ?? [1]), 1);

  return (
    <div className="space-y-8">
      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="TODAY" value={data.today} sub="page views" />
        <StatCard label="LAST_7_DAYS" value={data.last7Days} sub="page views" />
        <StatCard label="LAST_30_DAYS" value={data.last30Days} sub="page views" />
        <StatCard label="ALL_TIME" value={data.total} sub="total views" />
      </div>

      {/* Sparkline chart */}
      {data.daily?.length > 0 && <SparkLine daily={data.daily} />}

      {/* Top pages */}
      {data.topPages?.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-mono text-xs font-bold tracking-widest text-primary border-b border-border/40 pb-2">
            TOP_PAGES — LAST_30_DAYS
          </h3>
          <div className="space-y-3">
            {data.topPages.map(p => (
              <MiniBar
                key={p.path}
                value={Number(p.views)}
                max={maxPageViews}
                label={`${pageLabel(p.path)}  (${p.path})`}
              />
            ))}
          </div>
        </div>
      )}

      {data.total === 0 && (
        <div className="border border-border/40 bg-secondary/10 p-8 text-center font-mono text-muted-foreground space-y-2">
          <Eye className="h-8 w-8 mx-auto opacity-20" />
          <p>NO_DATA_YET — tracking is live and recording new visits now.</p>
        </div>
      )}
    </div>
  );
}

export default function Analytics() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2 border-b border-border/50 pb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold font-mono flex items-center gap-3">
            <BarChart2 className="h-8 w-8 text-primary" />
            /analytics
          </h1>
          <span className="flex items-center gap-1.5 text-xs font-mono text-primary border border-primary/30 bg-primary/10 px-2 py-0.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
            </span>
            LIVE
          </span>
        </div>
        <p className="text-muted-foreground font-mono text-sm">
          VISITOR_TELEMETRY — page views tracked in real time. Auto-refreshes every 60s.
        </p>
      </div>

      <Show when="signed-in">
        <Dashboard />
      </Show>

      <Show when="signed-out">
        <div className="border border-border/50 bg-secondary/10 p-12 flex flex-col items-center gap-6 text-center">
          <LogIn className="h-12 w-12 text-muted-foreground/30" />
          <div className="space-y-2">
            <p className="font-mono font-bold">SIGN_IN_REQUIRED</p>
            <p className="text-sm text-muted-foreground font-mono">Analytics are only visible to signed-in users.</p>
          </div>
          <Link href="/sign-in" className="bg-primary text-primary-foreground font-mono text-sm px-5 py-2 hover:bg-primary/90 transition-colors">
            SIGN_IN
          </Link>
        </div>
      </Show>
    </div>
  );
}
