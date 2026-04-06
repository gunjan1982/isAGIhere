import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Search, Users, Radio, MessageSquare, Activity, ArrowRight, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiUrl } from "@/lib/utils";

type SearchResults = {
  people: Array<{ id: number; name: string; role: string; organization?: string; category: string; imageUrl?: string; bio?: string }>;
  sources: Array<{ id: number; name: string; type: string; description?: string; url?: string; host?: string }>;
  communities: Array<{ id: number; name: string; platform: string; description?: string; url?: string; memberCount?: string }>;
  feed: Array<{ id: number; title: string; url: string; sourceName?: string; publishedAt?: string; description?: string }>;
  total: number;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

export default function SearchPage() {
  const [location] = useLocation();
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const initialQ = params.get("q") || "";

  const [query, setQuery] = useState(initialQ);
  const [debouncedQ, setDebouncedQ] = useState(initialQ);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!debouncedQ || debouncedQ.length < 2) { setResults(null); return; }
    setLoading(true);
    const url = getApiUrl(`/api/search?q=${encodeURIComponent(debouncedQ)}`);
    fetch(url)
      .then(r => r.json())
      .then(data => { setResults(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [debouncedQ]);

  useEffect(() => {
    if (query) {
      const newUrl = `${window.location.pathname}?q=${encodeURIComponent(query)}`;
      window.history.replaceState(null, "", newUrl);
    }
    document.title = query ? `Search: ${query} — AI Water Cooler` : "Search — AI Water Cooler";
  }, [query]);

  const hasResults = results && results.total > 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold font-mono flex items-center gap-2">
          <Search className="h-6 w-6 text-primary" />
          SEARCH
        </h1>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search people, sources, communities, news..."
            autoFocus
            className="w-full bg-card border border-border/50 text-foreground placeholder:text-muted-foreground font-mono text-sm pl-11 pr-4 py-3 focus:outline-none focus:border-primary/50 transition-colors"
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}
        </div>

        {debouncedQ && results && (
          <p className="text-xs font-mono text-muted-foreground">
            {results.total} result{results.total !== 1 ? "s" : ""} for &ldquo;{debouncedQ}&rdquo;
          </p>
        )}
      </div>

      {/* No results */}
      {debouncedQ && !loading && results && results.total === 0 && (
        <div className="border border-border/50 bg-card p-12 text-center space-y-2">
          <p className="font-mono text-muted-foreground">NO_SIGNAL_FOUND</p>
          <p className="text-sm text-muted-foreground">Try a different keyword — a name, company, topic, or source.</p>
        </div>
      )}

      {/* People results */}
      {results && results.people.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-border/50 pb-2">
            <Users className="h-4 w-4 text-primary" />
            <h2 className="font-mono text-sm font-bold text-foreground">PEOPLE</h2>
            <span className="text-xs font-mono text-muted-foreground">({results.people.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {results.people.map(person => (
              <Link key={person.id} href={`/people/${person.id}`} className="group flex items-center gap-3 border border-border/50 bg-card p-4 hover:border-primary/40 transition-colors">
                <div className="w-12 h-12 flex-shrink-0 bg-secondary/60 overflow-hidden">
                  {person.imageUrl ? (
                    <img src={person.imageUrl} alt={person.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-mono text-lg font-bold text-primary/50">
                      {person.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm group-hover:text-primary transition-colors truncate">{person.name}</span>
                    <Badge variant="outline" className="text-[9px] font-mono shrink-0">{person.category.replace(/_/g, " ")}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono truncate">{person.role}{person.organization ? ` · ${person.organization}` : ""}</p>
                </div>
                <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Sources results */}
      {results && results.sources.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-border/50 pb-2">
            <Radio className="h-4 w-4 text-primary" />
            <h2 className="font-mono text-sm font-bold text-foreground">SOURCES</h2>
            <span className="text-xs font-mono text-muted-foreground">({results.sources.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {results.sources.map(source => (
              <div key={source.id} className="border border-border/50 bg-card p-4 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">{source.name}</span>
                  <Badge variant="outline" className="text-[9px] font-mono">{source.type}</Badge>
                </div>
                {source.host && <p className="text-xs text-muted-foreground font-mono">by {source.host}</p>}
                {source.description && <p className="text-xs text-muted-foreground line-clamp-2">{source.description}</p>}
                {source.url && (
                  <a href={source.url} target="_blank" rel="noreferrer" className="text-xs font-mono text-primary hover:underline mt-1 flex items-center gap-1">
                    VISIT <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Communities results */}
      {results && results.communities.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-border/50 pb-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <h2 className="font-mono text-sm font-bold text-foreground">COMMUNITIES</h2>
            <span className="text-xs font-mono text-muted-foreground">({results.communities.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {results.communities.map(c => (
              <div key={c.id} className="border border-border/50 bg-card p-4 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">{c.name}</span>
                  <Badge variant="outline" className="text-[9px] font-mono">{c.platform}</Badge>
                </div>
                {c.memberCount && <p className="text-xs text-muted-foreground font-mono">{c.memberCount} members</p>}
                {c.description && <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>}
                {c.url && (
                  <a href={c.url} target="_blank" rel="noreferrer" className="text-xs font-mono text-primary hover:underline mt-1 flex items-center gap-1">
                    JOIN <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Feed results */}
      {results && results.feed.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-border/50 pb-2">
            <Activity className="h-4 w-4 text-primary" />
            <h2 className="font-mono text-sm font-bold text-foreground">NEWS &amp; ARTICLES</h2>
            <span className="text-xs font-mono text-muted-foreground">({results.feed.length})</span>
          </div>
          <div className="space-y-2">
            {results.feed.map(item => (
              <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="group flex flex-col gap-1 border border-border/50 bg-card p-4 hover:border-primary/30 transition-colors">
                <span className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">{item.title}</span>
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  {item.sourceName && <span>{item.sourceName}</span>}
                  {item.publishedAt && <><span>·</span><span>{timeAgo(item.publishedAt)}</span></>}
                  <ExternalLink className="h-2.5 w-2.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!debouncedQ && (
        <div className="border border-border/50 bg-secondary/10 p-12 text-center space-y-3">
          <Search className="h-8 w-8 text-muted-foreground/40 mx-auto" />
          <p className="font-mono text-muted-foreground text-sm">TYPE_TO_SEARCH</p>
          <p className="text-xs text-muted-foreground">Search across 45+ people, 37 sources, communities, and live news</p>
        </div>
      )}
    </div>
  );
}
