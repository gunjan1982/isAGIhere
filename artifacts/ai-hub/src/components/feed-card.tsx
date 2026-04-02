import { Link } from "wouter";
import { ExternalLink, Clock, User, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { FeedItem } from "@workspace/api-client-react";

export function getRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
}

export function FeedCard({ item }: { item: FeedItem }) {
  return (
    <div className="group border border-border/50 bg-card p-5 hover:border-primary/50 transition-all duration-300 flex flex-col gap-3 relative">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {item.sourceName && (
            <a 
              href={item.sourceUrl || item.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-mono text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <Radio className="h-3 w-3" />
              {item.sourceName}
            </a>
          )}
          {item.personName && (
            <Link 
              href={`/people/${item.personId}`}
              className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground border border-border/50 px-2 py-0.5 hover:text-foreground hover:border-foreground/30 transition-colors bg-secondary/30"
            >
              <User className="h-3 w-3" />
              {item.personName}
            </Link>
          )}
          {item.personCategory && (
            <Badge variant="outline" className="text-[10px] font-mono rounded-none border-border/50 text-muted-foreground bg-transparent">
              {item.personCategory.replace('_', ' ').toUpperCase()}
            </Badge>
          )}
        </div>
        
        {item.publishedAt && (
          <div className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground shrink-0">
            <Clock className="h-3 w-3" />
            {getRelativeTime(item.publishedAt)}
          </div>
        )}
      </div>

      <div>
        <a 
          href={item.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-lg font-bold text-foreground hover:text-primary transition-colors flex items-start gap-2 group/title"
        >
          <span className="line-clamp-2">{item.title}</span>
          <ExternalLink className="h-4 w-4 shrink-0 mt-1.5 opacity-50 group-hover/title:opacity-100 transition-opacity" />
        </a>
      </div>

      {item.description && (
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {item.description}
        </p>
      )}
    </div>
  );
}
