import { Link } from "wouter";
import { ExternalLink, FileText, Play, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { getRelativeTime } from "./feed-card";

export type InterviewItem = {
  id: number;
  videoId: string;
  title: string;
  url: string;
  thumbnailUrl: string | null;
  personName: string | null;
  personImageUrl?: string | null;
  personId?: number | null;
  personCategory?: string | null;
  channelName: string;
  publishedAt: string | null;
  aiSummary: string | null;
  keyTakeaways: string[];
  topics: string[];
  durationSeconds?: number | null;
  hasTranscript?: boolean;
};

function formatDuration(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function InterviewCard({ interview, compact = false }: { interview: InterviewItem; compact?: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`group border border-border/50 bg-card hover:border-primary/40 transition-all duration-300 flex flex-col ${compact ? "w-72 shrink-0" : "w-full"}`}>
      {/* Thumbnail */}
      <a
        href={interview.url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block overflow-hidden bg-secondary/60"
        style={{ aspectRatio: "16/9" }}
      >
        {interview.thumbnailUrl ? (
          <img
            src={interview.thumbnailUrl}
            alt={interview.title}
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="h-12 w-12 text-white drop-shadow-lg" />
          </div>
        </div>
        {interview.durationSeconds && (
          <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] font-mono px-1.5 py-0.5">
            {formatDuration(interview.durationSeconds)}
          </span>
        )}
        {interview.hasTranscript && (
          <span className="absolute top-1.5 right-1.5 bg-primary/90 text-primary-foreground text-[9px] font-mono px-1.5 py-0.5">
            TRANSCRIPT
          </span>
        )}
      </a>

      {/* Content */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        {/* Person + channel */}
        <div className="flex items-center gap-2 flex-wrap">
          {interview.personId && interview.personName && (
            <Link
              href={`/people/${interview.personId}`}
              className="flex items-center gap-1.5 text-xs font-mono text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {interview.personImageUrl && (
                <img src={interview.personImageUrl} alt="" className="h-3.5 w-3.5 rounded-full object-cover" />
              )}
              {interview.personName}
            </Link>
          )}
          <span className="text-[10px] font-mono text-muted-foreground/60 truncate">
            via {interview.channelName}
          </span>
        </div>

        {/* Title */}
        <a
          href={interview.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`font-semibold leading-snug hover:text-primary transition-colors ${compact ? "text-sm line-clamp-2" : "text-base line-clamp-3"}`}
        >
          {interview.title}
        </a>

        {/* Topics */}
        {interview.topics.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {interview.topics.slice(0, compact ? 2 : 4).map((t) => (
              <Badge key={t} variant="outline" className="font-mono text-[9px] px-1.5 py-0 rounded-none border-border/50 text-muted-foreground">
                {t.toUpperCase()}
              </Badge>
            ))}
          </div>
        )}

        {/* AI Summary — hidden in compact mode unless expanded */}
        {!compact && interview.aiSummary && (
          <div className="border border-border/40 bg-secondary/20 p-3 space-y-2">
            <p className={`text-xs text-foreground/80 leading-relaxed ${expanded ? "" : "line-clamp-2"}`}>
              {interview.aiSummary}
            </p>
            {interview.keyTakeaways.length > 0 && expanded && (
              <ul className="space-y-1 mt-2">
                {interview.keyTakeaways.map((t, i) => (
                  <li key={i} className="text-[11px] font-mono text-muted-foreground flex gap-1.5">
                    <span className="text-primary shrink-0">›</span>
                    {t}
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-[10px] font-mono text-primary/70 hover:text-primary transition-colors"
            >
              {expanded ? <><ChevronUp className="h-3 w-3" /> COLLAPSE</> : <><ChevronDown className="h-3 w-3" /> EXPAND_ANALYSIS</>}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-[10px] font-mono text-muted-foreground/50">
            {getRelativeTime(interview.publishedAt)}
          </span>
          <div className="flex items-center gap-2">
            {interview.hasTranscript && !compact && (
              <Link
                href={`/interviews/${interview.id}/transcript`}
                className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-primary border border-border/40 px-2 py-1 transition-colors"
              >
                <FileText className="h-3 w-3" />
                TRANSCRIPT
              </Link>
            )}
            <a
              href={interview.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] font-mono text-primary border border-primary/40 bg-primary/5 hover:bg-primary hover:text-primary-foreground px-2 py-1 transition-all"
            >
              <ExternalLink className="h-3 w-3" />
              WATCH
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
