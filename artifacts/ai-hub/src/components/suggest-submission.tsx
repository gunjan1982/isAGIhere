import { useState } from "react";
import { Plus, X, Send, CheckCircle } from "lucide-react";
import { getApiUrl } from "@/lib/utils";

type SubmissionType = "person" | "source" | "community";

const TYPE_LABELS: Record<SubmissionType, string> = {
  person: "Person",
  source: "Source / Newsletter",
  community: "Community",
};

export function SuggestSubmission({ defaultType = "person" }: { defaultType?: SubmissionType }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<SubmissionType>(defaultType);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Name is required"); return; }

    setSubmitting(true);
    try {
      const res = await fetch(getApiUrl("/api/submissions"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, name: name.trim(), url: url.trim() || null, description: description.trim() || null, submitterEmail: email.trim() || null }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to submit");
        return;
      }
      setSuccess(true);
      setTimeout(() => { setOpen(false); setSuccess(false); setName(""); setUrl(""); setDescription(""); setEmail(""); }, 2500);
    } catch {
      setError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-primary border border-border/40 hover:border-primary/40 px-3 py-1.5 transition-colors"
      >
        <Plus className="h-3 w-3" />
        SUGGEST_{type.toUpperCase()}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md border border-border/70 bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
              <h2 className="font-mono font-bold text-sm">SUGGEST_ADDITION</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {success ? (
              <div className="p-8 text-center space-y-3">
                <CheckCircle className="h-10 w-10 text-primary mx-auto" />
                <p className="font-mono font-bold">SUBMISSION_RECEIVED</p>
                <p className="text-sm text-muted-foreground">Thanks! We'll review and add it if it's a good fit.</p>
              </div>
            ) : (
              <form onSubmit={submit} className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-muted-foreground tracking-wider">TYPE</label>
                  <div className="flex gap-2">
                    {(Object.keys(TYPE_LABELS) as SubmissionType[]).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={`flex-1 text-xs font-mono py-1.5 border transition-colors ${
                          type === t
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                        }`}
                      >
                        {TYPE_LABELS[t].toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-muted-foreground tracking-wider">NAME *</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={type === "person" ? "e.g. Andrej Karpathy" : type === "source" ? "e.g. Import AI" : "e.g. r/MachineLearning"}
                    className="w-full bg-secondary/30 border border-border/50 text-sm px-3 py-2 font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-muted-foreground tracking-wider">URL / LINK</label>
                  <input
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://..."
                    type="url"
                    className="w-full bg-secondary/30 border border-border/50 text-sm px-3 py-2 font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-muted-foreground tracking-wider">WHY SHOULD WE ADD THIS?</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Brief reason — what makes them notable or high-signal..."
                    rows={2}
                    className="w-full bg-secondary/30 border border-border/50 text-sm px-3 py-2 font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-muted-foreground tracking-wider">YOUR EMAIL (OPTIONAL)</label>
                  <input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="We'll notify you when added"
                    type="email"
                    className="w-full bg-secondary/30 border border-border/50 text-sm px-3 py-2 font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>

                {error && <p className="text-xs text-destructive font-mono">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 text-sm font-mono px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  {submitting ? "SUBMITTING..." : "SUBMIT_FOR_REVIEW"}
                </button>
                <p className="text-[10px] font-mono text-center text-muted-foreground/60">No account needed · All submissions reviewed before adding</p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
