import { useState } from "react";
import { useListCommunities } from "@workspace/api-client-react";
import { MessageSquare, Filter, ExternalLink, Globe } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const PLATFORMS = [
  { id: "", label: "ALL" },
  { id: "discord", label: "DISCORD" },
  { id: "reddit", label: "REDDIT" },
  { id: "x", label: "X_LISTS" }
];

export default function Communities() {
  const [platform, setPlatform] = useState<any>("");

  const { data: communities, isLoading, isError } = useListCommunities({
    platform: platform || undefined
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-bold font-mono flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-primary" />
            /communities
          </h1>
          <p className="text-muted-foreground mt-2 font-mono text-sm max-w-xl">
            NODES: Active spaces where builders and researchers coordinate.
          </p>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-2 pb-2 md:pb-0 scrollbar-hide">
        <div className="flex items-center gap-2 px-3 border border-border/50 bg-secondary/30 text-muted-foreground font-mono text-sm h-10">
          <Filter className="h-4 w-4" /> PROTOCOL:
        </div>
        {PLATFORMS.map(p => (
          <button
            key={p.id}
            onClick={() => setPlatform(p.id)}
            className={`px-4 h-10 font-mono text-xs border transition-colors whitespace-nowrap ${
              platform === p.id 
                ? "border-primary bg-primary/10 text-primary" 
                : "border-border/50 bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-48 bg-secondary" />
          ))
        ) : isError ? (
          <div className="col-span-full border border-destructive/30 bg-destructive/10 text-destructive p-4 font-mono">
            ERR: Failed to retrieve community nodes.
          </div>
        ) : communities?.length === 0 ? (
          <div className="col-span-full border border-border/50 bg-secondary/10 text-muted-foreground p-12 text-center font-mono flex flex-col items-center gap-4">
            <Globe className="h-12 w-12 opacity-20" />
            NO_ACTIVE_NODES_FOUND
          </div>
        ) : (
          communities?.map((community, i) => (
            <div 
              key={community.id} 
              className="group flex flex-col border border-border/50 bg-card hover:border-primary/50 transition-all duration-300 animate-in fade-in zoom-in-95 relative overflow-hidden"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Decorative top border based on platform */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${
                community.platform === 'discord' ? 'bg-[#5865F2]' :
                community.platform === 'reddit' ? 'bg-[#FF4500]' :
                'bg-foreground'
              }`} />

              <div className="p-5 flex-grow space-y-4 mt-1">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-1">{community.name}</h3>
                  <Badge variant="outline" className="font-mono text-[10px] uppercase rounded-none border-border/50 shrink-0">
                    {community.platform}
                  </Badge>
                </div>
                
                <p className="text-sm text-foreground/70 line-clamp-3 leading-relaxed">
                  {community.description}
                </p>

                <div className="flex flex-col gap-2">
                  {community.memberCount && (
                    <div className="text-xs font-mono flex justify-between border-b border-border/50 pb-1">
                      <span className="text-muted-foreground">POPULATION:</span> 
                      <span className="text-foreground">{community.memberCount}</span>
                    </div>
                  )}
                  {community.bestFor && (
                    <div className="text-xs font-mono flex justify-between border-b border-border/50 pb-1">
                      <span className="text-muted-foreground">PURPOSE:</span> 
                      <span className="text-foreground text-right max-w-[60%] truncate">{community.bestFor}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-4 pt-0">
                {community.url ? (
                  <a 
                    href={community.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 bg-secondary/30 hover:bg-primary/20 text-foreground hover:text-primary border border-border/50 hover:border-primary/50 font-mono text-sm py-2 px-4 transition-colors"
                  >
                    JOIN_NODE <ExternalLink className="h-4 w-4" />
                  </a>
                ) : (
                  <button disabled className="w-full bg-secondary/10 text-muted-foreground border border-border/50 font-mono text-sm py-2 px-4 cursor-not-allowed">
                    PRIVATE_NODE
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
