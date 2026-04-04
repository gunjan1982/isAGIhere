import { useQuery } from "@tanstack/react-query";
import { useUser, Show } from "@clerk/react";
import { Link } from "wouter";
import {
  ShieldCheck, Users, Eye, TrendingUp, LogIn, Loader2,
  Calendar, UserCheck, BarChart2, Activity, RefreshCw, ExternalLink
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Overview {
  totalUsers: number;
  newLast7Days: number;
  newLast30Days: number;
  viewsToday: number;
  viewsLast7: number;
  viewsLast30: number;
  viewsTotal: number;
}

interface AdminUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  username: string | null;
  createdAt: number;
  lastSignInAt: number | null;
}

interface PagesData {
  allTime: { path: string; views: number }[];
  last7: { path: string; views: number }[];
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
  "/analytics": "Analytics",
  "/admin": "Admin",
};

function pageLabel(path: string) {
  return PAGE_LABELS[path] ?? path;
}

function fmt(n: number) { return n.toLocaleString(); }

function timeAgo(ms: number | null): string {
  if (!ms) return "—";
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function StatCard({
  label, value, sub, color = false
}: { label: string; value: number | string; sub?: string; color?: boolean }) {
  return (
    <div className="border border-border/50 bg-card p-5 space-y-1">
      <div className="text-[10px] font-mono tracking-widest text-muted-foreground">{label}</div>
      <div className={`text-3xl font-bold font-mono tabular-nums ${color ? "text-primary" : "text-foreground"}`}>
        {typeof value === "number" ? fmt(value) : value}
      </div>
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
        <span className="text-primary tabular-nums">{fmt(value)}</span>
      </div>
      <div className="h-1.5 bg-border/30 w-full">
        <div className="h-full bg-primary/70 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SparkLine({ daily }: { daily: PagesData["daily"] }) {
  if (!daily || daily.length === 0) return null;
  const vals = daily.map(d => Number(d.views));
  const max = Math.max(...vals, 1);
  const W = 600; const H = 64;
  const padX = 8;
  const pts = vals.map((v, i) => {
    const x = padX + (i / Math.max(vals.length - 1, 1)) * (W - padX * 2);
    const y = H - 4 - ((v / max) * (H - 16));
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="border border-border/30 bg-secondary/10 p-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
        {[0.5].map(f => (
          <line key={f} x1={0} y1={H - 4 - f * (H - 16)} x2={W} y2={H - 4 - f * (H - 16)}
            stroke="currentColor" strokeOpacity="0.06" strokeWidth="1" />
        ))}
        <polygon points={`${padX},${H} ${pts} ${W - padX},${H}`}
          fill="hsl(var(--primary))" fillOpacity="0.12" />
        <polyline points={pts} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinejoin="round" />
      </svg>
      <div className="flex justify-between mt-1 px-1">
        {[daily[0], daily[daily.length - 1]].filter(Boolean).map((d, i) => (
          <span key={i} className="text-[9px] font-mono text-muted-foreground">
            {new Date(d.day).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        ))}
      </div>
    </div>
  );
}

function AdminDashboard() {
  const { data: overview, isLoading: ovLoading, refetch: refetchOverview } =
    useQuery<Overview>({
      queryKey: ["admin-overview"],
      queryFn: async () => {
        const res = await fetch(`${BASE}/api/admin/overview`, { credentials: "include" });
        if (!res.ok) throw new Error("Failed");
        return res.json();
      },
      refetchInterval: 60_000,
    });

  const { data: usersData, isLoading: usersLoading } =
    useQuery<{ users: AdminUser[]; total: number }>({
      queryKey: ["admin-users"],
      queryFn: async () => {
        const res = await fetch(`${BASE}/api/admin/users?limit=100`, { credentials: "include" });
        if (!res.ok) throw new Error("Failed");
        return res.json();
      },
    });

  const { data: pages, isLoading: pagesLoading } =
    useQuery<PagesData>({
      queryKey: ["admin-pages"],
      queryFn: async () => {
        const res = await fetch(`${BASE}/api/admin/pages`, { credentials: "include" });
        if (!res.ok) throw new Error("Failed");
        return res.json();
      },
    });

  const isLoading = ovLoading || usersLoading || pagesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground font-mono gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> LOADING_ADMIN_DATA...
      </div>
    );
  }

  const maxAllTime = Math.max(...(pages?.allTime?.map(p => Number(p.views)) ?? [1]), 1);
  const maxLast7   = Math.max(...(pages?.last7?.map(p => Number(p.views)) ?? [1]), 1);

  return (
    <div className="space-y-10">

      {/* ── Overview stats ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-xs font-bold tracking-widest text-primary border-b border-border/40 pb-1 flex-1 mr-4">
            OVERVIEW
          </h2>
          <button
            onClick={() => refetchOverview()}
            className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="h-3 w-3" /> REFRESH
          </button>
        </div>

        {/* Members */}
        <div>
          <p className="text-[9px] font-mono text-muted-foreground tracking-widest mb-2 flex items-center gap-1">
            <Users className="h-3 w-3" /> MEMBERS
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard label="TOTAL_MEMBERS" value={overview?.totalUsers ?? 0} sub="all time" color />
            <StatCard label="NEW_LAST_7_DAYS" value={overview?.newLast7Days ?? 0} sub="signups" />
            <StatCard label="NEW_LAST_30_DAYS" value={overview?.newLast30Days ?? 0} sub="signups" />
          </div>
        </div>

        {/* Traffic */}
        <div>
          <p className="text-[9px] font-mono text-muted-foreground tracking-widest mb-2 flex items-center gap-1">
            <Eye className="h-3 w-3" /> TRAFFIC
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="TODAY" value={overview?.viewsToday ?? 0} sub="page views" color />
            <StatCard label="LAST_7_DAYS" value={overview?.viewsLast7 ?? 0} sub="page views" />
            <StatCard label="LAST_30_DAYS" value={overview?.viewsLast30 ?? 0} sub="page views" />
            <StatCard label="ALL_TIME" value={overview?.viewsTotal ?? 0} sub="total views" />
          </div>
        </div>
      </section>

      {/* ── Daily activity sparkline ── */}
      {pages?.daily && pages.daily.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-mono text-xs font-bold tracking-widest text-primary border-b border-border/40 pb-1">
            DAILY_TRAFFIC — LAST_30_DAYS
          </h2>
          <SparkLine daily={pages.daily} />
        </section>
      )}

      {/* ── Members table ── */}
      <section className="space-y-4">
        <h2 className="font-mono text-xs font-bold tracking-widest text-primary border-b border-border/40 pb-1">
          MEMBER_ROSTER — {usersData?.total ?? 0} TOTAL
        </h2>

        {!usersData?.users?.length ? (
          <div className="border border-border/30 p-8 text-center font-mono text-muted-foreground text-sm">
            NO_MEMBERS_YET — share the site to get your first signup.
          </div>
        ) : (
          <div className="border border-border/30 overflow-x-auto">
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="border-b border-border/30 bg-secondary/20">
                  <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground tracking-widest">USER</th>
                  <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground tracking-widest hidden md:table-cell">EMAIL</th>
                  <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground tracking-widest">JOINED</th>
                  <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground tracking-widest hidden sm:table-cell">LAST_SEEN</th>
                </tr>
              </thead>
              <tbody>
                {usersData.users.map((u, i) => {
                  const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || "—";
                  const initials = (u.firstName?.[0] ?? u.email?.[0] ?? "?").toUpperCase();
                  return (
                    <tr
                      key={u.id}
                      className={`border-b border-border/20 hover:bg-secondary/10 transition-colors ${i === 0 ? "bg-primary/5" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {u.imageUrl ? (
                            <img src={u.imageUrl} alt="" className="h-7 w-7 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-[11px] text-primary font-bold">
                              {initials}
                            </div>
                          )}
                          <div>
                            <div className="text-foreground text-xs leading-tight">{name}</div>
                            {i === 0 && (
                              <div className="text-[9px] text-primary mt-0.5">FIRST_MEMBER</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                        {u.email ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {fmtDate(u.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">
                        {timeAgo(u.lastSignInAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-[10px] font-mono text-muted-foreground">
          Full user management →{" "}
          <a
            href="https://dashboard.clerk.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            dashboard.clerk.com <ExternalLink className="h-3 w-3" />
          </a>
        </p>
      </section>

      {/* ── Top pages ── */}
      {pages && (
        <section className="space-y-6">
          <h2 className="font-mono text-xs font-bold tracking-widest text-primary border-b border-border/40 pb-1">
            TOP_PAGES
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <p className="text-[9px] font-mono text-muted-foreground tracking-widest flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> ALL_TIME
              </p>
              {pages.allTime.map(p => (
                <MiniBar key={p.path} value={Number(p.views)} max={maxAllTime}
                  label={`${pageLabel(p.path)}  (${p.path})`} />
              ))}
            </div>
            <div className="space-y-3">
              <p className="text-[9px] font-mono text-muted-foreground tracking-widest flex items-center gap-1">
                <Calendar className="h-3 w-3" /> LAST_7_DAYS
              </p>
              {pages.last7.length === 0 ? (
                <p className="text-xs font-mono text-muted-foreground">No data yet.</p>
              ) : (
                pages.last7.map(p => (
                  <MiniBar key={p.path} value={Number(p.views)} max={maxLast7}
                    label={`${pageLabel(p.path)}  (${p.path})`} />
                ))
              )}
            </div>
          </div>
        </section>
      )}

    </div>
  );
}

export default function Admin() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-border/50 pb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold font-mono flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
            /admin
          </h1>
          <span className="text-[10px] font-mono text-primary border border-primary/30 bg-primary/10 px-2 py-0.5 tracking-widest">
            OWNER_ONLY
          </span>
        </div>
        <p className="text-muted-foreground font-mono text-sm">
          SITE_CONTROL_PANEL — members, traffic, and page performance.
        </p>
      </div>

      <Show when="signed-in">
        <AdminDashboard />
      </Show>

      <Show when="signed-out">
        <div className="border border-border/50 bg-secondary/10 p-12 flex flex-col items-center gap-6 text-center">
          <LogIn className="h-12 w-12 text-muted-foreground/30" />
          <div className="space-y-2">
            <p className="font-mono font-bold">SIGN_IN_REQUIRED</p>
            <p className="text-sm text-muted-foreground font-mono">Admin panel is only accessible when signed in.</p>
          </div>
          <Link href="/sign-in"
            className="bg-primary text-primary-foreground font-mono text-sm px-5 py-2 hover:bg-primary/90 transition-colors">
            SIGN_IN
          </Link>
        </div>
      </Show>
    </div>
  );
}
