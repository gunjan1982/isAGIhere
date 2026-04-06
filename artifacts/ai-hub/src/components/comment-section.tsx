import { useState, useEffect } from "react";
import { MessageSquare, Reply, Send, ChevronDown, ChevronUp } from "lucide-react";
import { getApiUrl } from "@/lib/utils";

type Comment = {
  id: number;
  entityType: string;
  entityId: number;
  authorName: string;
  authorEmail: string;
  content: string;
  parentId: number | null;
  createdAt: string;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 2) return "just now";
  if (h < 1) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

function CommentForm({
  entityType,
  entityId,
  parentId,
  onPosted,
  onCancel,
  placeholder = "Share your thoughts...",
}: {
  entityType: string;
  entityId: number;
  parentId?: number | null;
  onPosted: (comment: Comment) => void;
  onCancel?: () => void;
  placeholder?: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !content.trim()) {
      setError("All fields required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(getApiUrl("/api/comments"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, entityId, authorName: name, authorEmail: email, content, parentId: parentId ?? null }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to post");
        return;
      }
      const comment = await res.json();
      onPosted(comment);
      setContent("");
      if (!parentId) { setName(""); setEmail(""); }
    } catch {
      setError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      {!parentId && (
        <div className="grid grid-cols-2 gap-2">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            className="bg-secondary/30 border border-border/50 text-sm px-3 py-2 font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
          />
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email (not shown publicly)"
            type="email"
            className="bg-secondary/30 border border-border/50 text-sm px-3 py-2 font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      )}
      <div className="flex gap-2">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={placeholder}
          rows={parentId ? 2 : 3}
          className="flex-1 bg-secondary/30 border border-border/50 text-sm px-3 py-2 font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors resize-none"
        />
      </div>
      {error && <p className="text-xs text-destructive font-mono">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Send className="h-3 w-3" />
          {submitting ? "POSTING..." : "POST_COMMENT"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5">
            CANCEL
          </button>
        )}
        <p className="text-[10px] font-mono text-muted-foreground/60 ml-auto">No account needed · Email kept private</p>
      </div>
    </form>
  );
}

function CommentThread({ comment, replies, entityType, entityId, onNewReply }: {
  comment: Comment;
  replies: Comment[];
  entityType: string;
  entityId: number;
  onNewReply: (c: Comment) => void;
}) {
  const [replying, setReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(true);

  return (
    <div className="space-y-2">
      <div className="border border-border/40 bg-card p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary/20 flex items-center justify-center text-xs font-mono font-bold text-primary">
              {comment.authorName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-bold">{comment.authorName}</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">{comment.content}</p>
        <button
          onClick={() => setReplying(v => !v)}
          className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors"
        >
          <Reply className="h-3 w-3" />
          REPLY
        </button>
      </div>

      {replying && (
        <div className="ml-6 border-l-2 border-primary/20 pl-4">
          <CommentForm
            entityType={entityType}
            entityId={entityId}
            parentId={comment.id}
            placeholder={`Reply to ${comment.authorName}...`}
            onPosted={c => { onNewReply(c); setReplying(false); }}
            onCancel={() => setReplying(false)}
          />
        </div>
      )}

      {replies.length > 0 && (
        <div className="ml-6 border-l-2 border-border/30 pl-4 space-y-2">
          {showReplies && replies.map(r => (
            <div key={r.id} className="border border-border/30 bg-secondary/10 p-3 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-primary/10 flex items-center justify-center text-[10px] font-mono font-bold text-primary">
                    {r.authorName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-bold">{r.authorName}</span>
                </div>
                <span className="text-[9px] font-mono text-muted-foreground">{timeAgo(r.createdAt)}</span>
              </div>
              <p className="text-xs leading-relaxed text-foreground/90 whitespace-pre-line">{r.content}</p>
            </div>
          ))}
          <button onClick={() => setShowReplies(v => !v)} className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground hover:text-primary transition-colors">
            {showReplies ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
            {showReplies ? "HIDE" : "SHOW"} {replies.length} REPL{replies.length === 1 ? "Y" : "IES"}
          </button>
        </div>
      )}
    </div>
  );
}

export function CommentSection({ entityType, entityId }: { entityType: string; entityId: number }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(getApiUrl(`/api/comments?entity_type=${entityType}&entity_id=${entityId}`))
      .then(r => r.json())
      .then(data => { setComments(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [entityType, entityId]);

  function addComment(c: Comment) {
    setComments(prev => [...prev, c]);
  }

  const topLevel = comments.filter(c => !c.parentId);
  const replies = comments.filter(c => c.parentId);

  return (
    <div className="space-y-6 pt-8 border-t border-border/50">
      <h2 className="text-lg font-bold font-mono flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        DISCUSSION
        {comments.length > 0 && (
          <span className="text-sm text-muted-foreground font-normal">({comments.length})</span>
        )}
      </h2>

      <CommentForm entityType={entityType} entityId={entityId} onPosted={addComment} />

      {loading ? (
        <div className="text-xs font-mono text-muted-foreground animate-pulse">LOADING_COMMENTS...</div>
      ) : topLevel.length === 0 ? (
        <div className="text-xs font-mono text-muted-foreground/60 border border-border/30 p-4 text-center">
          NO_COMMENTS_YET — be the first to start the discussion
        </div>
      ) : (
        <div className="space-y-4">
          {topLevel.map(c => (
            <CommentThread
              key={c.id}
              comment={c}
              replies={replies.filter(r => r.parentId === c.id)}
              entityType={entityType}
              entityId={entityId}
              onNewReply={addComment}
            />
          ))}
        </div>
      )}
    </div>
  );
}
