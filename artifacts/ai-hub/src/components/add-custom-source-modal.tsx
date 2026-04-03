import { useState } from "react";
import { X, Plus, Globe, Youtube, MessageSquare, Twitter, ExternalLink } from "lucide-react";
import { useCustomSourceMutations } from "@/lib/useFollows";

const PLATFORMS = [
  { value: "website", label: "Website / Blog", icon: Globe },
  { value: "youtube", label: "YouTube Channel", icon: Youtube },
  { value: "reddit", label: "Subreddit", icon: MessageSquare },
  { value: "x", label: "X / Twitter", icon: Twitter },
  { value: "other", label: "Other", icon: ExternalLink },
];

interface Props {
  onClose: () => void;
}

export function AddCustomSourceModal({ onClose }: Props) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState("website");
  const { add } = useCustomSourceMutations();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;
    add.mutate(
      { name: name.trim(), url: url.trim(), platform },
      { onSuccess: onClose }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md border border-border/70 bg-background shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 p-4">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            <span className="font-mono font-bold text-sm">ADD_CUSTOM_SOURCE</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Platform picker */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-muted-foreground tracking-wider">PLATFORM</label>
            <div className="grid grid-cols-3 gap-2">
              {PLATFORMS.map(p => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPlatform(p.value)}
                    className={`flex flex-col items-center gap-1.5 border p-2.5 text-xs font-mono transition-all ${
                      platform === p.value
                        ? "border-primary/60 bg-primary/10 text-primary"
                        : "border-border/40 text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {p.label.split(" ")[0]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted-foreground tracking-wider">NAME</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={
                platform === "youtube" ? "e.g. Two Minute Papers" :
                platform === "reddit" ? "e.g. r/MachineLearning" :
                platform === "x" ? "e.g. @sama" :
                "e.g. The Gradient"
              }
              className="w-full border border-border/60 bg-secondary/20 px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/60 placeholder:text-muted-foreground/40"
              required
            />
          </div>

          {/* URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted-foreground tracking-wider">URL</label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder={
                platform === "youtube" ? "https://youtube.com/@channel" :
                platform === "reddit" ? "https://reddit.com/r/subreddit" :
                platform === "x" ? "https://x.com/username" :
                "https://example.com"
              }
              className="w-full border border-border/60 bg-secondary/20 px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/60 placeholder:text-muted-foreground/40"
              required
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={add.isPending || !name.trim() || !url.trim()}
              className="flex-1 bg-primary text-primary-foreground font-mono text-sm py-2 hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {add.isPending ? "ADDING..." : "ADD_TO_MY_HUB"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-border/60 text-muted-foreground font-mono text-sm py-2 hover:text-foreground transition-colors"
            >
              CANCEL
            </button>
          </div>

          {add.isError && (
            <p className="text-xs font-mono text-red-400">Failed to add source. Try again.</p>
          )}
        </form>
      </div>
    </div>
  );
}
