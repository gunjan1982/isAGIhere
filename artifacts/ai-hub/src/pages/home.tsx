import { useGetFeatured, useGetStats } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ArrowRight, Users, Radio, MessageSquare, TrendingUp, AlertCircle, Activity, ChevronRight, Film } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FeedCard } from "@/components/feed-card";
import { InterviewCard, type InterviewItem } from "@/components/interview-card";
import { useState, useEffect, useRef } from "react";
import { PREDICTIONS, computeComposite } from "@/lib/agi";
import { VisitorHeatmap } from "@/components/visitor-heatmap";
import { useQuery } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function useLatestInterviews() {
  return useQuery<{ items: InterviewItem[] }>({
    queryKey: ["latest-interviews"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/interviews?limit=6`);
      if (!res.ok) throw new Error("Failed to fetch interviews");
      return res.json();
    },
    staleTime: 5 * 60_000,
  });
}

function useAgiCountdown() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  const compositeDays = computeComposite(PREDICTIONS, midnight);
  const targetMs = midnight.getTime() + compositeDays * 24 * 60 * 60 * 1000;
  const diffMs = Math.max(0, targetMs - now.getTime());
  const totalSecs = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  return { days: pad(days, 3), hours: pad(hours), mins: pad(mins), secs: pad(secs) };
}

function formatNumber(num: number) {
  return new Intl.NumberFormat("en-US").format(num);
}

function useFeedStatus() {
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [minsAgo, setMinsAgo] = useState<number | null>(null);

  useEffect(() => {
    const fetchStatus = () => {
      fetch(`${import.meta.env.BASE_URL}api/feed/status`)
        .then((r) => r.json())
        .then((data: { lastRefreshedAt: string | null }) => {
          if (data.lastRefreshedAt) setLastRefreshedAt(new Date(data.lastRefreshedAt));
        })
        .catch(() => {});
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!lastRefreshedAt) return;
    const tick = () => setMinsAgo(Math.floor((Date.now() - lastRefreshedAt.getTime()) / 60_000));
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, [lastRefreshedAt]);

  return minsAgo;
}

function timeAgo(isoString: string | null) {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

type SpotlightPerson = {
  id: number;
  name: string;
  role: string;
  organization?: string;
  category: string;
  bio?: string;
  stance?: string;
  imageUrl?: string;
  feedItems: Array<{
    id: number;
    title: string;
    url: string;
    sourceName?: string;
    publishedAt: string | null;
  }>;
};

function PersonCard({ person }: { person: SpotlightPerson }) {
  const initials = person.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const categoryLabel = person.category.replace(/_/g, " ").toUpperCase();

  const items = person.feedItems;
  const scrollItems = items.length >= 3 ? [...items, ...items] : items;

  const ITEM_HEIGHT = 68;
  const tickerHeight = 204;
  const totalHeight = items.length * ITEM_HEIGHT;
  const duration = Math.max(12, items.length * 3);

  return (
    <div className="flex-shrink-0 w-72 border border-border/50 bg-card flex flex-col hover:border-primary/40 transition-colors">
      {/* Photo / Avatar */}
      <div className="relative w-full h-40 bg-secondary/60 overflow-hidden flex items-center justify-center">
        {person.imageUrl ? (
          <img
            src={person.imageUrl}
            alt={person.name}
            className="object-cover w-full h-full grayscale hover:grayscale-0 transition-all duration-500"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: "radial-gradient(ellipse at 60% 40%, hsl(43 100% 20% / 0.4) 0%, hsl(240 10% 8%) 70%)",
            }}
          >
            <span
              className="font-mono font-black text-primary/60 select-none"
              style={{ fontSize: "4rem", letterSpacing: "-0.05em" }}
            >
              {initials}
            </span>
          </div>
        )}
        <div className="absolute top-2 left-2">
          <Badge
            variant="outline"
            className="font-mono text-[9px] tracking-widest border-primary/40 bg-background/80 backdrop-blur text-primary"
          >
            {categoryLabel}
          </Badge>
        </div>
      </div>

      {/* Info */}
      <div className="px-4 pt-3 pb-2">
        <h3 className="font-bold text-base leading-tight">{person.name}</h3>
        <p className="text-xs text-muted-foreground font-mono mt-0.5 line-clamp-1">
          {person.role}
          {person.organization ? ` · ${person.organization}` : ""}
        </p>
      </div>

      {/* Live news ticker */}
      <div className="mx-4 mb-3 border border-border/40 bg-secondary/20 overflow-hidden flex-1" style={{ height: `${tickerHeight}px` }}>
        <div className="flex items-center gap-1.5 px-2 py-1 border-b border-border/40 bg-secondary/40">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
          </span>
          <span className="text-[9px] font-mono text-muted-foreground tracking-widest">LATEST_BYTES</span>
        </div>

        {scrollItems.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[10px] font-mono text-muted-foreground/50">
            NO_SIGNAL
          </div>
        ) : (
          <div
            className="overflow-hidden"
            style={{ height: `${tickerHeight - 24}px` }}
          >
            <style>{`
              @keyframes ticker-scroll-${person.id} {
                0% { transform: translateY(0); }
                100% { transform: translateY(-${totalHeight}px); }
              }
            `}</style>
            <div
              style={{
                animation: `ticker-scroll-${person.id} ${duration}s linear infinite`,
              }}
            >
              {scrollItems.map((item, idx) => (
                <a
                  key={`${item.id}-${idx}`}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col gap-0.5 px-2 py-2 hover:bg-primary/10 transition-colors border-b border-border/20 group"
                  style={{ height: `${ITEM_HEIGHT}px` }}
                >
                  <span className="text-[11px] leading-tight text-foreground/90 line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground/60 flex items-center gap-1">
                    {item.sourceName && <span className="truncate max-w-[100px]">{item.sourceName}</span>}
                    {item.sourceName && item.publishedAt && <span>·</span>}
                    {item.publishedAt && <span>{timeAgo(item.publishedAt)}</span>}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dossier link */}
      <div className="px-4 pb-4">
        <Link
          href={`/people/${person.id}`}
          className="inline-flex items-center gap-2 text-xs font-mono text-primary hover:text-primary-foreground hover:bg-primary transition-colors border border-primary px-3 py-1.5 w-full justify-center"
        >
          ACCESS_DOSSIER <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

export default function Home() {
  const { data: stats, isLoading: isStatsLoading, isError: isStatsError } = useGetStats();
  const { data: featured, isLoading: isFeaturedLoading } = useGetFeatured();
  const spotlightPeople: SpotlightPerson[] = (featured as any)?.spotlightPeople ?? [];

  const countdown = useAgiCountdown();
  const feedMinsAgo = useFeedStatus();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: interviewsData, isLoading: isInterviewsLoading } = useLatestInterviews();

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden border border-border/50 bg-secondary/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--primary)/0.08)_0%,_transparent_60%)]" />
        <div className="relative z-10 grid md:grid-cols-2 min-h-[280px]">

          {/* Left: text */}
          <div className="flex flex-col justify-center p-8 md:p-12 space-y-4 border-r border-border/40">
            <div className="inline-flex w-fit items-center gap-2 border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-mono text-primary">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              INTELLIGENCE_STREAM_ACTIVE
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
              The Signal in the{" "}
              <span className="text-muted-foreground line-through decoration-primary">Noise</span>
            </h1>
            <p className="text-base text-muted-foreground font-mono leading-relaxed">
              Curated peek into everything that's happening in AI — people, publications, communities, and the race to the frontier.
            </p>
          </div>

          {/* Right: AGI countdown */}
          <Link href="/agi" className="group flex flex-col items-center justify-center p-8 md:p-12 gap-3 hover:bg-primary/5 transition-colors cursor-pointer">
            <div className="text-[11px] font-mono tracking-[0.25em] text-muted-foreground group-hover:text-primary/70 transition-colors">
              WEIGHTED_CONSENSUS_AGI_IN
            </div>

            <div className="flex items-end gap-1 md:gap-2">
              <div className="flex flex-col items-center">
                <span className="font-mono font-black tabular-nums text-primary leading-none"
                  style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}>
                  {countdown.days}
                </span>
                <span className="text-[9px] font-mono text-muted-foreground tracking-widest mt-1">DAYS</span>
              </div>
              <span className="font-mono font-black text-primary/50 pb-5" style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}>:</span>
              <div className="flex flex-col items-center">
                <span className="font-mono font-black tabular-nums text-primary leading-none"
                  style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}>
                  {countdown.hours}
                </span>
                <span className="text-[9px] font-mono text-muted-foreground tracking-widest mt-1">HRS</span>
              </div>
              <span className="font-mono font-black text-primary/50 pb-5" style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}>:</span>
              <div className="flex flex-col items-center">
                <span className="font-mono font-black tabular-nums text-primary leading-none"
                  style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}>
                  {countdown.mins}
                </span>
                <span className="text-[9px] font-mono text-muted-foreground tracking-widest mt-1">MIN</span>
              </div>
              <span className="font-mono font-black text-primary/50 pb-5" style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}>:</span>
              <div className="flex flex-col items-center">
                <span className="font-mono font-black tabular-nums text-primary leading-none"
                  style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}>
                  {countdown.secs}
                </span>
                <span className="text-[9px] font-mono text-muted-foreground tracking-widest mt-1">SEC</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground group-hover:text-primary transition-colors">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
              </span>
              LIVE · CLICK_TO_SEE_TRACKER →
            </div>
          </Link>

        </div>
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isStatsLoading ? (
          <>
            <Skeleton className="h-32 bg-secondary" />
            <Skeleton className="h-32 bg-secondary" />
            <Skeleton className="h-32 bg-secondary" />
          </>
        ) : isStatsError ? (
          <div className="col-span-3 text-destructive font-mono text-sm border border-destructive/20 bg-destructive/10 p-4 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            ERR_FETCHING_TELEMETRY
          </div>
        ) : (
          <>
            <div className="border border-border/50 bg-card p-6 flex flex-col gap-2 hover:border-primary/50 transition-colors group">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="font-mono text-sm tracking-wider">ENTITIES_TRACKED</span>
                <Users className="h-4 w-4 group-hover:text-primary transition-colors" />
              </div>
              <div className="text-4xl font-bold font-mono text-foreground">
                {stats ? formatNumber(stats.totalPeople) : "0"}
              </div>
            </div>
            <div className="border border-border/50 bg-card p-6 flex flex-col gap-2 hover:border-primary/50 transition-colors group">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="font-mono text-sm tracking-wider">SOURCES_MONITORED</span>
                <Radio className="h-4 w-4 group-hover:text-primary transition-colors" />
              </div>
              <div className="text-4xl font-bold font-mono text-foreground">
                {stats ? formatNumber(stats.totalSources) : "0"}
              </div>
            </div>
            <div className="border border-border/50 bg-card p-6 flex flex-col gap-2 hover:border-primary/50 transition-colors group">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="font-mono text-sm tracking-wider">ACTIVE_COMMUNITIES</span>
                <MessageSquare className="h-4 w-4 group-hover:text-primary transition-colors" />
              </div>
              <div className="text-4xl font-bold font-mono text-foreground">
                {stats ? formatNumber(stats.totalCommunities) : "0"}
              </div>
            </div>
          </>
        )}
      </section>

      {/* Featured Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* People Spotlight — full width on lg */}
        <div className="lg:col-span-2 space-y-4">
          {/* Section header — clicking goes to /people */}
          <Link href="/people" className="group flex items-center justify-between border-b border-border/50 pb-2 hover:border-primary/30 transition-colors">
            <h2 className="text-xl font-bold font-mono text-foreground flex items-center gap-2 group-hover:text-primary transition-colors">
              <Users className="h-5 w-5 text-primary" />
              PEOPLE
            </h2>
            <span className="text-sm font-mono text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1">
              VIEW_ALL <ChevronRight className="h-3 w-3" />
            </span>
          </Link>

          {isFeaturedLoading ? (
            <div className="flex gap-4 overflow-hidden">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="flex-shrink-0 w-72 h-96 bg-secondary" />
              ))}
            </div>
          ) : spotlightPeople.length > 0 ? (
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto pb-2"
              style={{ scrollbarWidth: "thin", scrollbarColor: "hsl(var(--primary)/0.3) transparent", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
            >
              {spotlightPeople.map((person) => (
                <PersonCard key={person.id} person={person} />
              ))}
            </div>
          ) : (
            <div className="border border-border/50 bg-card p-6 text-center font-mono text-muted-foreground">
              NO_SIGNAL_DETECTED
            </div>
          )}
        </div>

        {/* Top Sources */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <h2 className="text-xl font-bold font-mono text-foreground flex items-center gap-2">
              <Radio className="h-5 w-5 text-primary" />
              HIGH_SIGNAL_FEEDS
            </h2>
            <Link href="/sources" className="text-sm font-mono text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              ALL <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {isFeaturedLoading ? (
              Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 bg-secondary" />)
            ) : featured?.topNewsletters?.length ? (
              featured.topNewsletters.slice(0, 4).map(source => (
                <div key={source.id} className="group border border-border/50 bg-card p-4 hover:border-primary/50 transition-colors flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm truncate">{source.name}</h4>
                    <Badge variant="outline" className="text-[10px] font-mono shrink-0 rounded-none bg-secondary/50">
                      {source.type.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground flex justify-between font-mono">
                    <span className="truncate max-w-[150px]">{source.host || source.audience || 'General'}</span>
                    <a href={source.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                      [LINK]
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm font-mono text-muted-foreground p-4 border border-border/50 text-center">
                NO_FEEDS_DETECTED
              </div>
            )}
          </div>
        </div>

      </section>

      {/* Live Feed Preview */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/50 pb-2">
          <h2 className="text-xl font-bold font-mono text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            LIVE_FEED_STREAM
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${feedMinsAgo !== null && feedMinsAgo < 16 ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`} />
              {feedMinsAgo === null
                ? "SYNCING..."
                : feedMinsAgo === 0
                ? "SYNCED_JUST_NOW"
                : `SYNCED_${feedMinsAgo}M_AGO`}
            </span>
            <Link href="/feed" className="text-sm font-mono text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              VIEW_ALL <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {isFeaturedLoading ? (
            Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32 bg-secondary" />
            ))
          ) : featured?.recentFeed && featured.recentFeed.length > 0 ? (
            featured.recentFeed.slice(0, 8).map((item) => (
              <FeedCard key={item.id} item={item} />
            ))
          ) : (
            <div className="border border-border/50 bg-secondary/10 p-8 text-center font-mono text-muted-foreground">
              AWAITING_SIGNAL
            </div>
          )}
        </div>
      </section>

      {/* Latest Interviews */}
      {(isInterviewsLoading || (interviewsData?.items && interviewsData.items.length > 0)) && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <h2 className="text-xl font-bold font-mono text-foreground flex items-center gap-2">
              <Film className="h-5 w-5 text-primary" />
              LATEST_INTERVIEWS
            </h2>
            <Link href="/interviews" className="text-sm font-mono text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              VIEW_ALL <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
            {isInterviewsLoading ? (
              Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-80 w-72 shrink-0 bg-secondary" />
              ))
            ) : (
              interviewsData?.items.map((iv) => (
                <InterviewCard key={iv.id} interview={iv} compact />
              ))
            )}
          </div>
        </section>
      )}

      {/* Directory Access */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-border/50">
        <Link href="/people" className="group p-6 border border-border/50 bg-card hover:bg-secondary/20 transition-colors flex flex-col gap-3">
          <Users className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
          <h3 className="font-bold text-lg font-mono">/people</h3>
          <p className="text-sm text-muted-foreground">Directory of researchers, founders, and voices.</p>
        </Link>
        <Link href="/sources" className="group p-6 border border-border/50 bg-card hover:bg-secondary/20 transition-colors flex flex-col gap-3">
          <Radio className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
          <h3 className="font-bold text-lg font-mono">/sources</h3>
          <p className="text-sm text-muted-foreground">High-signal newsletters, podcasts, and blogs.</p>
        </Link>
        <Link href="/communities" className="group p-6 border border-border/50 bg-card hover:bg-secondary/20 transition-colors flex flex-col gap-3">
          <MessageSquare className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
          <h3 className="font-bold text-lg font-mono">/communities</h3>
          <p className="text-sm text-muted-foreground">Active hubs on Discord, Reddit, and X.</p>
        </Link>
      </section>

      {/* Visitor Heatmap */}
      <VisitorHeatmap />

    </div>
  );
}
