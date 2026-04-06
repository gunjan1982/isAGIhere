import { useQuery } from "@tanstack/react-query";
import { useUser, Show } from "@clerk/react";
import { Link } from "wouter";
import {
  ShieldCheck, Users, Eye, TrendingUp, LogIn, Loader2,
  Calendar, UserCheck, BarChart2, Activity, RefreshCw, ExternalLink,
  Inbox, CheckCircle, XCircle, Mail, Send, FlaskConical
} from "lucide-react";
import { useState } from "react";

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
  const { data: overview, isLoading: ovLoading, refetch: refetchOverview, error: ovError } =
    useQuery<Overview>({
      queryKey: ["admin-overview"],
      queryFn: async () => {
        const res = await fetch(`${BASE}/api/admin/overview`, { credentials: "include" });
        if (res.status === 401) throw Object.assign(new Error("NOT_AUTHED"), { status: 401 });
        if (res.status === 403) throw Object.assign(new Error("OWNER_ONLY"), { status: 403 });
        if (!res.ok) throw new Error("Failed");
        return res.json();
      },
      refetchInterval: 60_000,
      retry: 3,
      retryDelay: 1500,
    });

  const isOwnerDenied = (ovError as any)?.status === 403;
  const isNotAuthed  = (ovError as any)?.status === 401;

  const { data: usersData, isLoading: usersLoading } =
    useQuery<{ users: AdminUser[]; total: number }>({
      queryKey: ["admin-users"],
      queryFn: async () => {
        const res = await fetch(`${BASE}/api/admin/users?limit=100`, { credentials: "include" });
        if (!res.ok) throw new Error("Failed");
        return res.json();
      },
      enabled: !isOwnerDenied && !isNotAuthed && !!overview,
      retry: 2,
    });

  const { data: pages, isLoading: pagesLoading } =
    useQuery<PagesData>({
      queryKey: ["admin-pages"],
      queryFn: async () => {
        const res = await fetch(`${BASE}/api/admin/pages`, { credentials: "include" });
        if (!res.ok) throw new Error("Failed");
        return res.json();
      },
      enabled: !isOwnerDenied && !isNotAuthed && !!overview,
      retry: 2,
    });

  const isLoading = ovLoading || (!!overview && (usersLoading || pagesLoading));

  // Not the owner
  if (isOwnerDenied) {
    return (
      <div className="border border-destructive/30 bg-destructive/5 p-12 flex flex-col items-center gap-4 text-center">
        <ShieldCheck className="h-12 w-12 text-destructive/40" />
        <div className="space-y-2">
          <p className="font-mono font-bold text-destructive">ACCESS_DENIED</p>
          <p className="text-sm text-muted-foreground font-mono">This panel is restricted to gunjan1982@gmail.com.</p>
        </div>
      </div>
    );
  }

  // Auth not ready yet — happens briefly after page load; retries automatically
  if (isNotAuthed) {
    return (
      <div className="border border-border/40 bg-secondary/10 p-12 flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <div className="space-y-2">
          <p className="font-mono font-bold">ESTABLISHING_SESSION...</p>
          <p className="text-sm text-muted-foreground font-mono">Waiting for authentication. This refreshes automatically.</p>
        </div>
        <button
          onClick={() => refetchOverview()}
          className="text-xs font-mono text-primary border border-primary/30 px-4 py-1.5 hover:bg-primary/10 transition-colors"
        >
          RETRY_NOW
        </button>
      </div>
    );
  }

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

      {/* ── Weekly Digest ── */}
      <DigestPanel />

      {/* ── Submissions ── */}
      <SubmissionsPanel />

    </div>
  );
}

function DigestPanel() {
  const [sending, setSending] = useState<"test" | "all" | null>(null);
  const [result, setResult] = useState<{ sent?: number; errors?: number; total?: number; to?: string; message?: string } | null>(null);
  const [error, setError] = useState("");

  const { data: preview } = useQuery({
    queryKey: ["digest-preview"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/digest/preview`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
  });

  async function send(type: "test" | "all") {
    setSending(type);
    setResult(null);
    setError("");
    try {
      const res = await fetch(`${BASE}/api/digest/send${type === "test" ? "-test" : ""}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      setResult(data);
    } catch {
      setError("Network error");
    } finally {
      setSending(null);
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="font-mono text-xs font-bold tracking-widest text-primary border-b border-border/40 pb-1 flex items-center gap-2">
        <Mail className="h-3.5 w-3.5" /> WEEKLY_DIGEST
      </h2>

      {preview && (
        <div className="grid grid-cols-3 gap-3">
          <div className="border border-border/50 bg-card p-3 text-center space-y-1">
            <p className="text-xl font-bold font-mono text-primary">{preview.stats?.totalStories ?? 0}</p>
            <p className="text-[9px] font-mono text-muted-foreground tracking-wider">STORIES_THIS_WEEK</p>
          </div>
          <div className="border border-border/50 bg-card p-3 text-center space-y-1">
            <p className="text-xl font-bold font-mono text-primary">{preview.stats?.sourcesActive ?? 0}</p>
            <p className="text-[9px] font-mono text-muted-foreground tracking-wider">SOURCES_ACTIVE</p>
          </div>
          <div className="border border-border/50 bg-card p-3 text-center space-y-1">
            <p className="text-xl font-bold font-mono text-primary">{preview.topStories?.length ?? 0}</p>
            <p className="text-[9px] font-mono text-muted-foreground tracking-wider">TOP_STORIES</p>
          </div>
        </div>
      )}

      {preview?.weekLabel && (
        <p className="text-xs font-mono text-muted-foreground">
          Digest period: <span className="text-foreground">{preview.weekLabel}</span>
        </p>
      )}

      {result && (
        <div className="border border-green-500/30 bg-green-500/5 p-3 text-xs font-mono text-green-400 space-y-1">
          <p>✓ DIGEST_SENT</p>
          {result.sent !== undefined && <p>Sent: {result.sent} · Errors: {result.errors ?? 0} · Total subscribers: {result.total ?? result.sent}</p>}
          {result.to && <p>Test sent to: {result.to}</p>}
          {result.message && <p>{result.message}</p>}
        </div>
      )}
      {error && <p className="text-xs font-mono text-destructive">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={() => send("test")}
          disabled={!!sending}
          className="flex items-center gap-1.5 text-xs font-mono border border-border/50 hover:border-primary/40 text-muted-foreground hover:text-primary px-3 py-2 transition-colors disabled:opacity-40"
        >
          {sending === "test" ? <Loader2 className="h-3 w-3 animate-spin" /> : <FlaskConical className="h-3 w-3" />}
          SEND_TEST_TO_ME
        </button>
        <button
          onClick={() => send("all")}
          disabled={!!sending}
          className="flex items-center gap-1.5 text-xs font-mono bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 transition-colors disabled:opacity-40"
        >
          {sending === "all" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
          SEND_TO_ALL_FOLLOWERS
        </button>
      </div>
      <p className="text-[10px] font-mono text-muted-foreground/60">Digest is sent to all users who follow at least one person or source</p>
    </section>
  );
}

function SubmissionsPanel() {
  const { data: submissions, refetch, isLoading } = useQuery({
    queryKey: ["admin-submissions"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/submissions`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json() as Promise<Array<{ id: number; type: string; name: string; url?: string; description?: string; submitterEmail?: string; status: string; createdAt: string }>>;
    },
  });
  const [updating, setUpdating] = useState<number | null>(null);

  async function update(id: number, status: "approved" | "rejected") {
    setUpdating(id);
    try {
      await fetch(`${BASE}/api/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      await refetch();
    } finally {
      setUpdating(null);
    }
  }

  const pending = submissions?.filter(s => s.status === "pending") ?? [];
  const rest = submissions?.filter(s => s.status !== "pending") ?? [];

  return (
    <section className="space-y-4">
      <h2 className="font-mono text-xs font-bold tracking-widest text-primary border-b border-border/40 pb-1 flex items-center gap-2">
        <Inbox className="h-3.5 w-3.5" /> SUBMISSIONS
        {pending.length > 0 && (
          <span className="ml-auto text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 font-mono font-bold">
            {pending.length} PENDING
          </span>
        )}
      </h2>

      {isLoading ? (
        <p className="text-xs font-mono text-muted-foreground animate-pulse">Loading...</p>
      ) : pending.length === 0 && rest.length === 0 ? (
        <p className="text-xs font-mono text-muted-foreground border border-border/30 p-4 text-center">No submissions yet.</p>
      ) : (
        <div className="space-y-2">
          {[...pending, ...rest].map(s => (
            <div key={s.id} className={`border p-3 flex flex-col gap-1 ${s.status === "pending" ? "border-primary/30 bg-primary/5" : s.status === "approved" ? "border-green-500/20 bg-green-500/5" : "border-border/30 bg-secondary/10 opacity-60"}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono uppercase border border-border/50 px-1.5 py-0.5 text-muted-foreground">{s.type}</span>
                  <span className="font-bold text-sm">{s.name}</span>
                  {s.url && (
                    <a href={s.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                {s.status === "pending" && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => update(s.id, "approved")}
                      disabled={updating === s.id}
                      className="flex items-center gap-1 text-[10px] font-mono text-green-400 hover:text-green-300 border border-green-500/30 hover:border-green-500/60 px-2 py-1 transition-colors disabled:opacity-40"
                    >
                      <CheckCircle className="h-3 w-3" /> APPROVE
                    </button>
                    <button
                      onClick={() => update(s.id, "rejected")}
                      disabled={updating === s.id}
                      className="flex items-center gap-1 text-[10px] font-mono text-destructive/80 hover:text-destructive border border-destructive/30 hover:border-destructive/60 px-2 py-1 transition-colors disabled:opacity-40"
                    >
                      <XCircle className="h-3 w-3" /> REJECT
                    </button>
                  </div>
                )}
                {s.status !== "pending" && (
                  <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 ${s.status === "approved" ? "text-green-400 border border-green-500/30" : "text-muted-foreground border border-border/30"}`}>
                    {s.status}
                  </span>
                )}
              </div>
              {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
              {s.submitterEmail && <p className="text-[10px] font-mono text-muted-foreground/60">from: {s.submitterEmail}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
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
