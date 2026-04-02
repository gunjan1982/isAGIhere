import { useState } from "react";
import { useGetFeed } from "@workspace/api-client-react";
import { Activity, AlertCircle } from "lucide-react";
import { FeedCard } from "@/components/feed-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function Feed() {
  const [offset, setOffset] = useState(0);
  const limit = 30;

  const { data, isLoading, isError } = useGetFeed({ limit, offset }, {
    query: {
      queryKey: ["/api/feed", { limit, offset }]
    }
  });

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
                AWAITING_SIGNAL: No items found in stream.
              </div>
            )}
          </div>

          {!isLoading && data?.hasMore && (
            <div className="pt-6 flex justify-center">
              <Button 
                variant="outline" 
                onClick={() => setOffset(prev => prev + limit)}
                className="font-mono border-primary/30 hover:border-primary hover:bg-primary/10 text-primary"
              >
                LOAD_MORE_RECORDS
              </Button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
