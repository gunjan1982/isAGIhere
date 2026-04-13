import { useState } from "react";
import { useListSources } from "@workspace/api-client-react";
import { Radio, Search, Filter, ExternalLink, Activity, Youtube, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FollowButton } from "@/components/follow-button";
import { SuggestSubmission } from "@/components/suggest-submission";

const SOURCE_TYPES = [
  { id: "", label: "ALL" },
  { id: "newsletter", label: "NEWSLETTER" },
  { id: "podcast", label: "PODCAST" },
  { id: "blog", label: "BLOG" },
  { id: "youtube", label: "YOUTUBE" },
  { id: "news_site", label: "NEWS_SITE" }
];

export default function Sources() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<any>("");

  const { data: sources, isLoading, isError } = useListSources({
    search: search || undefined,
    type: type || undefined
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-bold font-mono flex items-center gap-3">
            <Radio className="h-8 w-8 text-primary" />
            /sources
          </h1>
          <p className="text-muted-foreground mt-2 font-mono text-sm max-w-xl">
            FEEDS: Curated list of high-signal inputs. Newsletters, podcasts, and research blogs.
          </p>
        </div>
        <SuggestSubmission defaultType="source" />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Query source name or host..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 font-mono rounded-none border-border/50 bg-card focus-visible:ring-primary"
          />
        </div>
        <div className="flex overflow-x-auto gap-2 pb-2 md:pb-0 scrollbar-hide flex-shrink-0">
          <div className="flex items-center gap-2 px-3 border border-border/50 bg-secondary/30 text-muted-foreground font-mono text-sm h-10">
            <Filter className="h-4 w-4" /> FORMAT:
          </div>
          {SOURCE_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              className={`px-4 h-10 font-mono text-xs border transition-colors whitespace-nowrap ${
                type === t.id 
                  ? "border-primary bg-primary/10 text-primary" 
                  : "border-border/50 bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full bg-secondary" />
          ))
        ) : isError ? (
          <div className="border border-destructive/30 bg-destructive/10 text-destructive p-4 font-mono">
            ERR: Failed to retrieve source feeds.
          </div>
        ) : sources?.length === 0 ? (
          <div className="border border-border/50 bg-secondary/10 text-muted-foreground p-12 text-center font-mono flex flex-col items-center gap-4">
            <Activity className="h-12 w-12 opacity-20" />
            NO_FEEDS_MATCH_CRITERIA
          </div>
        ) : (
          sources?.map((source, i) => {
            const src = source as typeof source & {
              youtubeChannelId?: string | null;
              isInterviewChannel?: boolean;
            };
            const isYouTube = src.type === "youtube";
            const channelThumb = isYouTube && src.youtubeChannelId
              ? `https://i.ytimg.com/vi/${src.youtubeChannelId}/default.jpg`
              : null;

            return isYouTube ? (
              // ── YouTube card variant ────────────────────────────────────────
              <div
                key={src.id}
                className="group flex flex-col md:flex-row gap-4 border border-border/50 bg-card p-4 md:p-6 hover:border-primary/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex gap-4 flex-grow">
                  {/* Channel thumbnail */}
                  <div className="shrink-0 w-16 h-16 md:w-20 md:h-20 bg-secondary border border-border/50 overflow-hidden flex items-center justify-center">
                    {channelThumb ? (
                      <img
                        src={channelThumb}
                        alt={src.name}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                      />
                    ) : (
                      <Youtube className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-grow space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-xl font-bold">{src.name}</h3>
                          {src.isHighSignal && (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 font-mono text-[10px] py-0">HIGH_SIGNAL</Badge>
                          )}
                          {src.isInterviewChannel && (
                            <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/30 font-mono text-[10px] py-0 flex items-center gap-1">
                              <Users className="h-3 w-3" /> INTERVIEW_CHANNEL
                            </Badge>
                          )}
                        </div>
                        {src.host && (
                          <p className="text-sm font-mono text-muted-foreground">HOST: {src.host}</p>
                        )}
                      </div>
                      <Badge className="font-mono text-[10px] uppercase rounded-none shrink-0 bg-rose-500/20 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 flex items-center gap-1">
                        <Youtube className="h-3 w-3" /> YOUTUBE
                      </Badge>
                    </div>

                    <p className="text-sm text-foreground/80 leading-relaxed max-w-4xl">
                      {src.description}
                    </p>

                    <div className="flex flex-wrap gap-4 pt-2">
                      {src.audience && (
                        <div className="text-xs font-mono border-l-2 border-border/50 pl-2">
                          <span className="text-muted-foreground">AUDIENCE:</span> <span className="text-foreground">{src.audience}</span>
                        </div>
                      )}
                      {src.frequency && (
                        <div className="text-xs font-mono border-l-2 border-border/50 pl-2">
                          <span className="text-muted-foreground">FREQ:</span> <span className="text-foreground">{src.frequency}</span>
                        </div>
                      )}
                      {src.subscriberCount && (
                        <div className="text-xs font-mono border-l-2 border-border/50 pl-2">
                          <span className="text-muted-foreground">SUBS:</span> <span className="text-foreground">{src.subscriberCount}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="md:w-48 flex-shrink-0 flex flex-col justify-between border-t md:border-t-0 md:border-l border-border/50 pt-4 md:pt-0 md:pl-6">
                  <div className="hidden md:block space-y-2">
                    <p className="text-[10px] font-mono text-muted-foreground">PRIMARY_VALUE:</p>
                    <p className="text-xs text-foreground/90">{src.bestFor}</p>
                  </div>
                  <div className="flex flex-col gap-2 mt-4 md:mt-0">
                    {src.url && (
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 w-full border border-rose-500/50 text-rose-400 hover:bg-rose-500 hover:text-white font-mono text-sm py-2 px-4 transition-colors"
                      >
                        <Youtube className="h-4 w-4" /> SUBSCRIBE
                      </a>
                    )}
                    {src.isInterviewChannel && (
                      <a
                        href="/interviews"
                        className="inline-flex items-center justify-center gap-2 w-full border border-border/50 text-muted-foreground hover:border-primary/50 hover:text-foreground font-mono text-xs py-2 px-4 transition-colors"
                      >
                        VIEW_INTERVIEWS →
                      </a>
                    )}
                    <FollowButton entityType="source" entityId={src.id} size="md" className="w-full justify-center" />
                  </div>
                </div>
              </div>
            ) : (
              // ── Default card (newsletters, podcasts, blogs, news sites) ────
              <div
                key={src.id}
                className="group flex flex-col md:flex-row gap-4 border border-border/50 bg-card p-4 md:p-6 hover:border-primary/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex-grow space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold">{src.name}</h3>
                        {src.isHighSignal && (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 font-mono text-[10px] py-0">HIGH_SIGNAL</Badge>
                        )}
                      </div>
                      {src.host && (
                        <p className="text-sm font-mono text-muted-foreground">HOST: {src.host}</p>
                      )}
                    </div>
                    <Badge className="font-mono text-[10px] uppercase rounded-none shrink-0 bg-secondary text-foreground hover:bg-secondary">
                      {src.type.replace('_', ' ')}
                    </Badge>
                  </div>

                  <p className="text-sm text-foreground/80 leading-relaxed max-w-4xl">
                    {src.description}
                  </p>

                  <div className="flex flex-wrap gap-4 pt-2">
                    {src.audience && (
                      <div className="text-xs font-mono border-l-2 border-border/50 pl-2">
                        <span className="text-muted-foreground">AUDIENCE:</span> <span className="text-foreground">{src.audience}</span>
                      </div>
                    )}
                    {src.frequency && (
                      <div className="text-xs font-mono border-l-2 border-border/50 pl-2">
                        <span className="text-muted-foreground">FREQ:</span> <span className="text-foreground">{src.frequency}</span>
                      </div>
                    )}
                    {src.subscriberCount && (
                      <div className="text-xs font-mono border-l-2 border-border/50 pl-2">
                        <span className="text-muted-foreground">SUBS:</span> <span className="text-foreground">{src.subscriberCount}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:w-48 flex-shrink-0 flex flex-col justify-between border-t md:border-t-0 md:border-l border-border/50 pt-4 md:pt-0 md:pl-6">
                  <div className="hidden md:block space-y-2">
                    <p className="text-[10px] font-mono text-muted-foreground">PRIMARY_VALUE:</p>
                    <p className="text-xs text-foreground/90">{src.bestFor}</p>
                  </div>
                  <div className="flex flex-col gap-2 mt-4 md:mt-0">
                    {src.url && (
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 w-full border border-primary text-primary hover:bg-primary hover:text-primary-foreground font-mono text-sm py-2 px-4 transition-colors"
                      >
                        ACCESS_FEED <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <FollowButton entityType="source" entityId={src.id} size="md" className="w-full justify-center" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
