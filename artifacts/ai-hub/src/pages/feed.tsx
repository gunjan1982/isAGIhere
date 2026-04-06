import { useState } from "react";
import { Activity, AlertCircle, Users, Radio, ChevronDown } from "lucide-react";
import { FeedCard } from "@/components/feed-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type FeedFilter = "all" | "people" | "sources";

const FILTERS: { id: FeedFilter; label: string; icon: any; desc: string }[] = [
  { id: "all",     label: "ALL",     icon: Activity, desc: "Everything" },
  { id: "people",  label: "PEOPLE",  icon: Users,    desc: "From tracked people" },
  { id: "sources", label: "SOURCES", icon: Radio,    desc: "Curated newsletters & news" },
];

function useFeed(filter: FeedFilter, offset: number, limit = 30) {
  return useQuery({
    queryKey: ["feed", filter, offset, limit],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
      if (filter !== "all") params.set("filter", filter);
      const res = await fetch(`${BASE}/api/feed?${params}`);
      if (!res.ok) throw new Error("Feed fetch failed");
      return res.json() as Promise<{ items: any[]; total: number; hasMore: boolean }>;
    },
    staleTime: 60_000,
  });
}

export default function Feed() {
  const [offset, setOffset] = useState(0);
  const [filter, setFilter] = useState<FeedFilter>("all");
  const limit = 30;

  function switchFilter(f: FeedFilter) {
    setFilter(f);
    setOffset(0);
  }

  const { data, isLoading, isError } = useFeed(filter, offset, limit);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">

      <div className="space-y-4 border-b border-border/50 pb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="p-2 bg-primary/10 border border-primary/20">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          GLOBAL_FEED_STREAM
        </h1>
        <p className="text-muted-foreground font-mono text-sm">
          Real-time telemetry of articles, posts, and interviews from tracked entities.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTERS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => switchFilter(id)}
            className={`flex items-center gap-2 px-4 h-9 font-mono text-xs border transition-colors whitespace-nowrap ${
              filter === id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/50 bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
        {data && (
          <span className="flex items-center ml-auto text-[10px] font-mono text-muted-foreground whitespace-nowrap px-2">
            {data.total.toLocaleString()} ITEMS
          </span>
        )}
      </div>

      {isError ? (
        <div className="border border-destructive/30 bg-destructive/10 text-destructive p-6 font-mono flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          ERR_FETCHING_FEED: Connection to feed stream interrupted.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-4">
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="border border-border/50 bg-card p-5 space-y-3">
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-24 bg-secondary" />
                    <Skeleton className="h-5 w-32 bg-secondary" />
                  </div>
                  <Skeleton className="h-6 w-full bg-secondary" />
                  <Skeleton className="h-12 w-full bg-secondary" />
                </div>
              ))
            ) : data?.items && data.items.length > 0 ? (
              data.items.map((item) => (
                <FeedCard key={item.id} item={item} />
              ))
            ) : (
              <div className="border border-border/50 bg-secondary/10 p-12 text-center font-mono text-muted-foreground flex flex-col items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-muted-foreground opacity-50"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-muted-foreground"></span>
                </span>
                FEED_STREAM_EMPTY
              </div>
            )}
          </div>

          {/* Pagination */}
          {data && (data.hasMore || offset > 0) && (
            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <Button
                variant="outline"
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className="font-mono text-xs rounded-none"
              >
                ← PREV
              </Button>
              <span className="text-xs font-mono text-muted-foreground">
                {offset + 1}–{Math.min(offset + limit, data.total)} of {data.total.toLocaleString()}
              </span>
              <Button
                variant="outline"
                onClick={() => setOffset(offset + limit)}
                disabled={!data.hasMore}
                className="font-mono text-xs rounded-none flex items-center gap-1"
              >
                NEXT <ChevronDown className="h-3 w-3 rotate-[-90deg]" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
