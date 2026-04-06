import { useState } from "react";
import { useListPeople } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Search, Users, ExternalLink, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FollowButton } from "@/components/follow-button";
import { SuggestSubmission } from "@/components/suggest-submission";

const CATEGORIES = [
  { id: "", label: "ALL" },
  { id: "godfathers", label: "GODFATHERS" },
  { id: "lab_ceos", label: "LAB_CEOS" },
  { id: "hardware", label: "HARDWARE" },
  { id: "builders", label: "BUILDERS" },
  { id: "vibe_coders", label: "VIBE_CODERS" }
];

export default function People() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  
  // Use debounced search value in real app, but for fast UI we'll pass direct
  const { data: people, isLoading, isError } = useListPeople({ 
    search: search || undefined, 
    category: category || undefined 
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-bold font-mono flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            /people
          </h1>
          <p className="text-muted-foreground mt-2 font-mono text-sm max-w-xl">
            DATABASE: Key figures driving AI progress. Filter by operational domain.
          </p>
        </div>
        <SuggestSubmission defaultType="person" />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Query entity name or org..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 font-mono rounded-none border-border/50 bg-card focus-visible:ring-primary"
          />
        </div>
        <div className="flex overflow-x-auto gap-2 pb-2 md:pb-0 scrollbar-hide flex-shrink-0">
          <div className="flex items-center gap-2 px-3 border border-border/50 bg-secondary/30 text-muted-foreground font-mono text-sm h-10">
            <Filter className="h-4 w-4" /> TYPE:
          </div>
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`px-4 h-10 font-mono text-xs border transition-colors whitespace-nowrap ${
                category === c.id 
                  ? "border-primary bg-primary/10 text-primary" 
                  : "border-border/50 bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-64 bg-secondary" />
          ))
        ) : isError ? (
          <div className="col-span-full border border-destructive/30 bg-destructive/10 text-destructive p-4 font-mono">
            ERR: Failed to retrieve personnel records.
          </div>
        ) : people?.length === 0 ? (
          <div className="col-span-full border border-border/50 bg-secondary/10 text-muted-foreground p-12 text-center font-mono flex flex-col items-center gap-4">
            <Users className="h-12 w-12 opacity-20" />
            NO_MATCHING_RECORDS_FOUND
          </div>
        ) : (
          people?.map((person, i) => (
            <div 
              key={person.id} 
              className="group border border-border/50 bg-card flex flex-col hover:border-primary/50 transition-all duration-300 animate-in fade-in zoom-in-95"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="p-5 flex-grow space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-xl font-bold font-mono tracking-tight group-hover:text-primary transition-colors">
                      <Link href={`/people/${person.id}`}>{person.name}</Link>
                    </h3>
                    <p className="text-sm text-muted-foreground font-mono mt-1">
                      {person.role} {person.organization ? `// ${person.organization}` : ""}
                    </p>
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px] uppercase rounded-none border-border/50 shrink-0">
                    {person.category.replace('_', ' ')}
                  </Badge>
                </div>
                
                <p className="text-sm text-foreground/70 line-clamp-3 leading-relaxed">
                  {person.bio || "No biography available."}
                </p>

                {person.bestFor && (
                  <div className="bg-secondary/20 p-3 border-l-2 border-primary/50">
                    <p className="text-xs font-mono text-muted-foreground mb-1">OPTIMIZED_FOR:</p>
                    <p className="text-sm text-foreground">{person.bestFor}</p>
                  </div>
                )}
              </div>
              
              <div className="border-t border-border/50 p-4 bg-secondary/10 flex justify-between items-center">
                <div className="flex gap-3 items-center">
                  {person.twitterHandle && (
                    <a 
                      href={`https://x.com/${person.twitterHandle}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      @{person.twitterHandle}
                    </a>
                  )}
                  <FollowButton entityType="person" entityId={person.id} />
                </div>
                <Link 
                  href={`/people/${person.id}`}
                  className="text-xs font-mono text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  [VIEW_DOSSIER]
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
