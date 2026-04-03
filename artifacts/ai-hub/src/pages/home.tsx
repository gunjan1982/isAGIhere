import { useGetFeatured, useGetStats } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ArrowRight, Users, Radio, MessageSquare, TrendingUp, AlertCircle, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FeedCard } from "@/components/feed-card";
import { useState, useEffect } from "react";
import { PREDICTIONS, computeComposite } from "@/lib/agi";

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

export default function Home() {
  const { data: stats, isLoading: isStatsLoading, isError: isStatsError } = useGetStats();
  const { data: featured, isLoading: isFeaturedLoading, isError: isFeaturedError } = useGetFeatured();

  const countdown = useAgiCountdown();

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
              Curated telemetry on the people, publications, and communities shaping the frontier of artificial intelligence.
            </p>
          </div>

          {/* Right: AGI countdown */}
          <Link href="/agi" className="group flex flex-col items-center justify-center p-8 md:p-12 gap-3 hover:bg-primary/5 transition-colors cursor-pointer">
            <div className="text-[11px] font-mono tracking-[0.25em] text-muted-foreground group-hover:text-primary/70 transition-colors">
              WEIGHTED_CONSENSUS_AGI_IN
            </div>

            {/* Big clock */}
            <div className="flex items-end gap-1 md:gap-2">
              {/* Days */}
              <div className="flex flex-col items-center">
                <span className="font-mono font-black tabular-nums text-primary leading-none"
                  style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}>
                  {countdown.days}
                </span>
                <span className="text-[9px] font-mono text-muted-foreground tracking-widest mt-1">DAYS</span>
              </div>
              <span className="font-mono font-black text-primary/50 pb-5" style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}>:</span>
              {/* Hours */}
              <div className="flex flex-col items-center">
                <span className="font-mono font-black tabular-nums text-primary leading-none"
                  style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}>
                  {countdown.hours}
                </span>
                <span className="text-[9px] font-mono text-muted-foreground tracking-widest mt-1">HRS</span>
              </div>
              <span className="font-mono font-black text-primary/50 pb-5" style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}>:</span>
              {/* Mins */}
              <div className="flex flex-col items-center">
                <span className="font-mono font-black tabular-nums text-primary leading-none"
                  style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}>
                  {countdown.mins}
                </span>
                <span className="text-[9px] font-mono text-muted-foreground tracking-widest mt-1">MIN</span>
              </div>
              <span className="font-mono font-black text-primary/50 pb-5" style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}>:</span>
              {/* Secs */}
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
        
        {/* Spotlight */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <h2 className="text-xl font-bold font-mono text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              TARGET_SPOTLIGHT
            </h2>
            <Link href="/people" className="text-sm font-mono text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              VIEW_ALL <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          
          {isFeaturedLoading ? (
            <Skeleton className="h-64 bg-secondary" />
          ) : featured?.spotlightPerson ? (
            <div className="border border-border/50 bg-card p-6 flex flex-col md:flex-row gap-6 hover:border-primary/30 transition-all">
              <div className="w-full md:w-1/3 flex-shrink-0">
                <div className="aspect-square bg-secondary border border-border/50 relative overflow-hidden group">
                  {featured.spotlightPerson.imageUrl ? (
                    <img 
                      src={featured.spotlightPerson.imageUrl} 
                      alt={featured.spotlightPerson.name}
                      className="object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-mono text-muted-foreground text-4xl">
                      {featured.spotlightPerson.name.charAt(0)}
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline" className="bg-background/80 backdrop-blur font-mono border-primary/50 text-primary">
                      {featured.spotlightPerson.category.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex flex-col flex-grow justify-between py-2">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-2xl font-bold">{featured.spotlightPerson.name}</h3>
                    <p className="text-muted-foreground font-mono text-sm">
                      {featured.spotlightPerson.role} {featured.spotlightPerson.organization ? `@ ${featured.spotlightPerson.organization}` : ""}
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/80 line-clamp-3">
                    {featured.spotlightPerson.bio}
                  </p>
                  {featured.spotlightPerson.stance && (
                    <div className="inline-flex items-center gap-2 text-xs border border-border/50 px-2 py-1 bg-secondary/20">
                      <span className="text-muted-foreground font-mono">STANCE:</span>
                      <span className="font-medium text-foreground">{featured.spotlightPerson.stance}</span>
                    </div>
                  )}
                </div>
                <div className="pt-4 mt-4 border-t border-border/50">
                  <Link href={`/people/${featured.spotlightPerson.id}`} className="inline-flex items-center gap-2 text-sm font-mono text-primary hover:text-primary-foreground hover:bg-primary transition-colors border border-primary px-4 py-2">
                    ACCESS_DOSSIER <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
             <div className="border border-border/50 bg-card p-6 text-center font-mono text-muted-foreground">
               NO_SPOTLIGHT_AVAILABLE
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
          <Link href="/feed" className="text-sm font-mono text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            VIEW_ALL <ArrowRight className="h-3 w-3" />
          </Link>
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

    </div>
  );
}
