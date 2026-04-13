import { useState, useEffect } from "react";
import { Film, AlertCircle, ChevronDown } from "lucide-react";
import { InterviewCard, type InterviewItem } from "@/components/interview-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useSeo } from "@/lib/useSeo";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const TOPIC_FILTERS = [
  "All", "AGI timeline", "new model", "capabilities", "safety",
  "reasoning", "agents", "open source", "alignment", "benchmark",
  "multimodal", "investment",
];

type InterviewsResponse = {
  items: InterviewItem[];
  total: number;
  hasMore: boolean;
};

function useInterviews(personId: number | null, topic: string | null, offset: number) {
  return useQuery<InterviewsResponse>({
    queryKey: ["interviews", personId, topic, offset],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "20", offset: String(offset) });
      if (personId) params.set("personId", String(personId));
      if (topic && topic !== "All") params.set("topic", topic);
      const res = await fetch(`${BASE}/api/interviews?${params}`);
      if (!res.ok) throw new Error("Failed to fetch interviews");
      return res.json();
    },
    staleTime: 60_000,
  });
}

type PersonOption = { id: number; name: string };

function usePeopleOptions() {
  return useQuery<PersonOption[]>({
    queryKey: ["people-list-for-interviews"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/people`);
      if (!res.ok) throw new Error("Failed to fetch people");
      const data = await res.json();
      return (data as PersonOption[]).sort((a, b) => a.name.localeCompare(b.name));
    },
    staleTime: 5 * 60_000,
  });
}

export default function Interviews() {
  const [location] = useLocation();
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const [personId, setPersonId] = useState<number | null>(
    params.get("personId") ? Number(params.get("personId")) : null
  );
  const [topic, setTopic] = useState<string>(params.get("topic") ?? "All");
  const [offset, setOffset] = useState(0);
  const [allItems, setAllItems] = useState<InterviewItem[]>([]);

  useSeo({
    title: "Interview Stream",
    description: "Original-source interviews from key AI figures — summaries, takeaways, and transcripts.",
    canonicalPath: "/interviews",
  });

  // Reset on filter change
  useEffect(() => {
    setOffset(0);
    setAllItems([]);
  }, [personId, topic]);

  const { data, isLoading, isFetching } = useInterviews(personId, topic, offset);
  const { data: people } = usePeopleOptions();

  // Accumulate pages
  useEffect(() => {
    if (!data) return;
    if (offset === 0) {
      setAllItems(data.items);
    } else {
      setAllItems((prev) => [...prev, ...data.items]);
    }
  }, [data, offset]);

  const loadMore = () => {
    setOffset((prev) => prev + 20);
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="border-b border-border/50 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <Film className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold font-mono tracking-tight">INTERVIEW_STREAM</h1>
        </div>
        <p className="text-sm font-mono text-muted-foreground">
          Original-source interviews from key AI figures — AI-generated summaries and takeaways
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Person filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono text-muted-foreground shrink-0">PERSON:</span>
          <button
            onClick={() => setPersonId(null)}
            className={`text-xs font-mono px-3 py-1 border transition-all ${
              personId === null
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >
            ALL
          </button>
          {people?.slice(0, 12).map((p) => (
            <button
              key={p.id}
              onClick={() => setPersonId(personId === p.id ? null : p.id)}
              className={`text-xs font-mono px-3 py-1 border transition-all ${
                personId === p.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Topic filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono text-muted-foreground shrink-0">TOPIC:</span>
          {TOPIC_FILTERS.map((t) => (
            <button
              key={t}
              onClick={() => setTopic(t)}
              className={`text-xs font-mono px-3 py-1 border transition-all ${
                topic === t
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
              }`}
            >
              {t === "All" ? "ALL" : t.toUpperCase().replace(/ /g, "_")}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      {data && (
        <p className="text-[10px] font-mono text-muted-foreground">
          {data.total} INTERVIEW{data.total !== 1 ? "S" : ""} FOUND
        </p>
      )}

      {/* Grid */}
      {isLoading && offset === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-96 w-full bg-secondary" />
          ))}
        </div>
      ) : allItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {allItems.map((interview) => (
            <InterviewCard key={interview.id} interview={interview} />
          ))}
        </div>
      ) : (
        <div className="border border-border/50 bg-secondary/10 p-16 text-center font-mono flex flex-col items-center gap-4">
          <AlertCircle className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">NO_SIGNAL_FOUND</p>
          <p className="text-xs text-muted-foreground/60">No interviews match your current filters.</p>
        </div>
      )}

      {/* Load more */}
      {data?.hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={isFetching}
            className="font-mono"
          >
            {isFetching ? "LOADING..." : <><ChevronDown className="h-4 w-4 mr-2" /> LOAD_MORE</>}
          </Button>
        </div>
      )}
    </div>
  );
}
