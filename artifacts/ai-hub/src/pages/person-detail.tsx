import { useRoute } from "wouter";
import { useGetPerson, useGetPersonFeed } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ArrowLeft, ExternalLink, Twitter, Target, Building2, TerminalSquare, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FeedCard } from "@/components/feed-card";

export default function PersonDetail() {
  const [, params] = useRoute("/people/:id");
  const id = params?.id ? parseInt(params.id, 10) : 0;
  
  const { data: person, isLoading, isError } = useGetPerson(id, { 
    query: { enabled: !!id, queryKey: [`/api/people/${id}`] } 
  });

  const { data: feedData, isLoading: isFeedLoading } = useGetPersonFeed(id, { limit: 15 }, {
    query: { enabled: !!id, queryKey: [`/api/people/${id}/feed`, { limit: 15 }] }
  });

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in">
        <Skeleton className="h-10 w-32 bg-secondary" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Skeleton className="h-96 md:col-span-1 bg-secondary" />
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-12 w-2/3 bg-secondary" />
            <Skeleton className="h-6 w-1/3 bg-secondary" />
            <Skeleton className="h-32 w-full bg-secondary" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !person) {
    return (
      <div className="space-y-6">
        <Link href="/people" className="inline-flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" /> RETURN_TO_DIRECTORY
        </Link>
        <div className="border border-destructive/30 bg-destructive/10 text-destructive p-8 font-mono text-center flex flex-col items-center gap-4">
          <TerminalSquare className="h-12 w-12" />
          <p>ERR_404: RECORD_NOT_FOUND</p>
          <p className="text-sm opacity-70">The requested entity dossier does not exist in the current database.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex items-center gap-4">
        <Link href="/people" className="inline-flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-primary transition-colors border border-border/50 px-3 py-1.5 bg-card">
          <ArrowLeft className="h-4 w-4" /> BACK
        </Link>
        <div className="h-px bg-border/50 flex-grow" />
        <div className="text-xs font-mono text-muted-foreground">
          ID: {person.id.toString().padStart(6, '0')}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column - Visuals & Meta */}
        <div className="lg:col-span-4 space-y-6">
          <div className="aspect-square bg-secondary border border-border/50 relative overflow-hidden group p-1">
            <div className="absolute inset-0 border border-primary/20 m-2 z-10 pointer-events-none" />
            {person.imageUrl ? (
              <img 
                src={person.imageUrl} 
                alt={person.name}
                className="object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all duration-700"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-mono text-muted-foreground text-8xl bg-card">
                {person.name.charAt(0)}
              </div>
            )}
            
            {/* Overlay tech details */}
            <div className="absolute bottom-4 left-4 z-20 font-mono text-[10px] text-primary/80 flex flex-col gap-1 drop-shadow-md">
              <span>CLASS: {person.category.toUpperCase()}</span>
              <span>STAT: ACTIVE</span>
            </div>
          </div>

          <div className="border border-border/50 bg-card p-5 space-y-4">
            <h3 className="font-mono text-sm text-muted-foreground border-b border-border/50 pb-2">METADATA_LINKS</h3>
            
            {person.organization && (
              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground font-mono">ORGANIZATION</p>
                  <p className="text-sm font-medium">{person.organization}</p>
                </div>
              </div>
            )}
            
            {person.twitterHandle && (
              <div className="flex items-start gap-3">
                <Twitter className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground font-mono">X_NETWORK</p>
                  <a href={`https://x.com/${person.twitterHandle}`} target="_blank" rel="noreferrer" className="text-sm font-medium hover:text-primary hover:underline flex items-center gap-1">
                    @{person.twitterHandle} <ExternalLink className="h-3 w-3" />
                  </a>
                  {person.twitterFollowers && (
                    <p className="text-xs text-muted-foreground mt-0.5">FOLLOWERS: {person.twitterFollowers}</p>
                  )}
                </div>
              </div>
            )}
            
            {person.primaryPlatform && (
              <div className="flex items-start gap-3">
                <TerminalSquare className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground font-mono">PRIMARY_OUTPUT</p>
                  <p className="text-sm font-medium capitalize">{person.primaryPlatform}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Content */}
        <div className="lg:col-span-8 space-y-8">
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{person.name}</h1>
              {person.isSpotlight && (
                <Badge className="bg-primary text-primary-foreground font-mono rounded-none">SPOTLIGHT</Badge>
              )}
            </div>
            
            <p className="text-xl font-mono text-muted-foreground flex items-center gap-2">
              <span className="text-primary">{'>'}</span> {person.role}
            </p>
          </div>

          <div className="border border-border/50 bg-secondary/10 p-6 md:p-8">
            <h3 className="font-mono text-sm text-primary mb-4 flex items-center gap-2">
              <Target className="h-4 w-4" /> DOSSIER_BIO
            </h3>
            <p className="text-base md:text-lg leading-relaxed whitespace-pre-wrap text-foreground/90">
              {person.bio || "No detailed biography available in current database schema."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {person.bestFor && (
              <div className="border border-border/50 bg-card p-6 border-t-2 border-t-primary">
                <h3 className="font-mono text-xs text-muted-foreground mb-3">OPTIMIZED_FOR</h3>
                <p className="text-sm md:text-base leading-relaxed">{person.bestFor}</p>
              </div>
            )}
            
            {person.stance && (
              <div className="border border-border/50 bg-card p-6 border-t-2 border-t-primary/50">
                <h3 className="font-mono text-xs text-muted-foreground mb-3">KNOWN_STANCE</h3>
                <p className="text-sm md:text-base leading-relaxed">{person.stance}</p>
              </div>
            )}
          </div>

          <div className="space-y-4 pt-8">
            <h3 className="font-mono text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
              <Activity className="h-5 w-5 text-primary" />
              LATEST_ACTIVITY
            </h3>
            
            <div className="flex flex-col gap-4">
              {isFeedLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full bg-secondary" />
                ))
              ) : feedData && feedData.length > 0 ? (
                feedData.map((item) => (
                  <FeedCard key={item.id} item={item} />
                ))
              ) : (
                <div className="border border-border/50 bg-secondary/10 p-8 text-center font-mono text-muted-foreground">
                  NO_ACTIVITY_RECORDED
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
