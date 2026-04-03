import { useState, useMemo } from "react";
import { BookOpen, ExternalLink, Star, Filter } from "lucide-react";
import { curatedArticles, CATEGORIES, type ArticleCategory } from "@/data/curated-articles";

export default function Learn() {
  const [activeCategory, setActiveCategory] = useState<ArticleCategory | "all" | "essential">("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = curatedArticles;

    if (activeCategory === "essential") {
      list = list.filter((a) => a.isEssential);
    } else if (activeCategory !== "all") {
      list = list.filter((a) => a.category === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.source.toLowerCase().includes(q)
      );
    }

    return list;
  }, [activeCategory, search]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: curatedArticles.length, essential: curatedArticles.filter((a) => a.isEssential).length };
    for (const cat of Object.keys(CATEGORIES) as ArticleCategory[]) {
      counts[cat] = curatedArticles.filter((a) => a.category === cat).length;
    }
    return counts;
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-mono font-bold tracking-tight">LEARNING_LIBRARY</h1>
            <p className="text-sm text-muted-foreground font-mono">
              {curatedArticles.length} articles curated from Prompts &amp; Vibes
            </p>
          </div>
        </div>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Every link worth going back to — organised by topic so you can actually find and read them.
          The ones marked <span className="text-primary font-medium">Essential</span> are the ones that shaped the conversation most.
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-secondary/30 border border-border/50 pl-10 pr-4 py-2 text-sm font-mono focus:outline-none focus:border-primary/50 focus:bg-secondary/50 transition-colors"
          />
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-3 py-1.5 text-xs font-mono border transition-all ${
            activeCategory === "all"
              ? "bg-primary/15 border-primary/50 text-primary"
              : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
          }`}
        >
          ALL ({categoryCounts.all})
        </button>
        <button
          onClick={() => setActiveCategory("essential")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border transition-all ${
            activeCategory === "essential"
              ? "bg-primary/15 border-primary/50 text-primary"
              : "border-primary/20 text-primary/70 hover:text-primary hover:border-primary/40"
          }`}
        >
          <Star className="h-3 w-3" />
          ESSENTIAL ({categoryCounts.essential})
        </button>
        {(Object.entries(CATEGORIES) as [ArticleCategory, { label: string; color: string }][]).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`px-3 py-1.5 text-xs font-mono border transition-all ${
              activeCategory === key
                ? "bg-secondary border-border text-foreground"
                : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            {label.toUpperCase()} ({categoryCounts[key]})
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="text-xs font-mono text-muted-foreground">
        SHOWING {filtered.length} OF {curatedArticles.length} ARTICLES
      </div>

      {/* Articles Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground font-mono">
          <p>NO_RESULTS_FOUND</p>
          <p className="text-xs mt-1">Try a different search or category</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((article) => {
            const cat = CATEGORIES[article.category];
            return (
              <a
                key={article.id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-3 p-4 border border-border/50 bg-secondary/10 hover:bg-secondary/30 hover:border-border transition-all"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 border ${cat.color}`}>
                      {cat.label.toUpperCase()}
                    </span>
                    {article.isEssential && (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-primary">
                        <Star className="h-2.5 w-2.5 fill-primary" />
                        ESSENTIAL
                      </span>
                    )}
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                </div>

                {/* Title */}
                <h3 className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                  {article.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 flex-1">
                  {article.description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mt-auto pt-1 border-t border-border/30">
                  <span className="truncate">{article.source}</span>
                  <span className="shrink-0 ml-2">{article.dateShared}</span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
