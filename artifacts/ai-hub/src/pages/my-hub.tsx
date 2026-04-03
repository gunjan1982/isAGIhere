import { useState } from "react";
import { Link } from "wouter";
import { Show } from "@clerk/react";
import { useUserHub, useFollowMutations, useCustomSourceMutations } from "@/lib/useFollows";
import { AddCustomSourceModal } from "@/components/add-custom-source-modal";
import {
  LayoutDashboard, Users, Radio, MessageSquare, Plus, Trash2,
  ExternalLink, Globe, Youtube, Twitter, Loader2, LogIn
} from "lucide-react";

const PLATFORM_ICON: Record<string, any> = {
  youtube: Youtube,
  x: Twitter,
  reddit: MessageSquare,
  website: Globe,
  other: Globe,
};

function EmptyState({ icon: Icon, message, cta, href }: { icon: any; message: string; cta: string; href: string }) {
  return (
    <div className="border border-dashed border-border/50 p-8 flex flex-col items-center gap-3 text-center">
      <Icon className="h-8 w-8 text-muted-foreground/30" />
      <p className="text-sm font-mono text-muted-foreground">{message}</p>
      <Link href={href} className="text-xs font-mono text-primary border border-primary/40 px-3 py-1.5 hover:bg-primary/10 transition-colors">
        {cta}
      </Link>
    </div>
  );
}

function HubContent() {
  const { data: hub, isLoading } = useUserHub();
  const { unfollow } = useFollowMutations();
  const { remove } = useCustomSourceMutations();
  const [showAddSource, setShowAddSource] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground font-mono gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        LOADING_YOUR_HUB...
      </div>
    );
  }

  const totalFollowed = (hub?.people.length ?? 0) + (hub?.sources.length ?? 0) + (hub?.communities.length ?? 0) + (hub?.customSources.length ?? 0);

  return (
    <div className="space-y-8">
      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "PEOPLE", count: hub?.people.length ?? 0, icon: Users },
          { label: "SOURCES", count: hub?.sources.length ?? 0, icon: Radio },
          { label: "COMMUNITIES", count: hub?.communities.length ?? 0, icon: MessageSquare },
          { label: "CUSTOM", count: hub?.customSources.length ?? 0, icon: Globe },
        ].map(({ label, count, icon: Icon }) => (
          <div key={label} className="border border-border/50 bg-card p-4 flex items-center gap-3">
            <Icon className="h-4 w-4 text-primary shrink-0" />
            <div>
              <div className="text-2xl font-bold font-mono">{count}</div>
              <div className="text-[10px] font-mono text-muted-foreground tracking-wider">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {totalFollowed === 0 && (
        <div className="border border-primary/20 bg-primary/5 p-6 font-mono text-sm text-muted-foreground text-center space-y-2">
          <p className="text-foreground font-semibold">YOUR_HUB_IS_EMPTY</p>
          <p>Start following people, sources, and communities to build your personalised feed.</p>
          <div className="flex justify-center gap-3 pt-2 flex-wrap">
            <Link href="/people" className="text-xs text-primary border border-primary/40 px-3 py-1.5 hover:bg-primary/10 transition-colors">+ FOLLOW_PEOPLE</Link>
            <Link href="/sources" className="text-xs text-primary border border-primary/40 px-3 py-1.5 hover:bg-primary/10 transition-colors">+ FOLLOW_SOURCES</Link>
            <Link href="/communities" className="text-xs text-primary border border-primary/40 px-3 py-1.5 hover:bg-primary/10 transition-colors">+ FOLLOW_COMMUNITIES</Link>
          </div>
        </div>
      )}

      {/* People */}
      <section className="space-y-3">
        <h2 className="font-mono text-sm font-bold tracking-widest text-primary border-b border-border/40 pb-2 flex items-center justify-between">
          <span className="flex items-center gap-2"><Users className="h-4 w-4" /> PEOPLE_FOLLOWING</span>
          <Link href="/people" className="text-xs text-muted-foreground hover:text-primary transition-colors">+ DISCOVER →</Link>
        </h2>
        {(hub?.people.length ?? 0) === 0 ? (
          <EmptyState icon={Users} message="No people followed yet." cta="BROWSE_PEOPLE" href="/people" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {hub!.people.map(p => (
              <div key={p.id} className="border border-border/50 bg-card p-4 flex items-start justify-between gap-3 group hover:border-primary/30 transition-colors">
                <div className="min-w-0">
                  <Link href={`/people/${p.id}`} className="font-bold font-mono text-sm group-hover:text-primary transition-colors truncate block">{p.name}</Link>
                  <div className="text-xs text-muted-foreground font-mono truncate">{p.role}</div>
                </div>
                <button
                  onClick={() => unfollow.mutate({ entityType: "person", entityId: p.id })}
                  className="text-muted-foreground hover:text-red-400 transition-colors shrink-0"
                  title="Unfollow"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sources */}
      <section className="space-y-3">
        <h2 className="font-mono text-sm font-bold tracking-widest text-primary border-b border-border/40 pb-2 flex items-center justify-between">
          <span className="flex items-center gap-2"><Radio className="h-4 w-4" /> SOURCES_TRACKING</span>
          <Link href="/sources" className="text-xs text-muted-foreground hover:text-primary transition-colors">+ DISCOVER →</Link>
        </h2>
        {(hub?.sources.length ?? 0) === 0 ? (
          <EmptyState icon={Radio} message="No sources tracked yet." cta="BROWSE_SOURCES" href="/sources" />
        ) : (
          <div className="space-y-2">
            {hub!.sources.map(s => (
              <div key={s.id} className="border border-border/50 bg-card p-3 flex items-center justify-between gap-3 hover:border-primary/30 transition-colors">
                <div className="min-w-0">
                  <span className="font-bold font-mono text-sm">{s.name}</span>
                  {s.host && <span className="text-xs text-muted-foreground font-mono ml-2">// {s.host}</span>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {s.url && (
                    <a href={s.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => unfollow.mutate({ entityType: "source", entityId: s.id })}
                    className="text-muted-foreground hover:text-red-400 transition-colors"
                    title="Unfollow"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Communities */}
      <section className="space-y-3">
        <h2 className="font-mono text-sm font-bold tracking-widest text-primary border-b border-border/40 pb-2 flex items-center justify-between">
          <span className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> COMMUNITIES_JOINED</span>
          <Link href="/communities" className="text-xs text-muted-foreground hover:text-primary transition-colors">+ DISCOVER →</Link>
        </h2>
        {(hub?.communities.length ?? 0) === 0 ? (
          <EmptyState icon={MessageSquare} message="No communities followed yet." cta="BROWSE_COMMUNITIES" href="/communities" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {hub!.communities.map(c => (
              <div key={c.id} className="border border-border/50 bg-card p-3 flex items-center justify-between gap-3 hover:border-primary/30 transition-colors">
                <div className="min-w-0">
                  <span className="font-bold font-mono text-sm truncate block">{c.name}</span>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">{c.platform}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.url && (
                    <a href={c.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => unfollow.mutate({ entityType: "community", entityId: c.id })}
                    className="text-muted-foreground hover:text-red-400 transition-colors"
                    title="Unfollow"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Custom Sources */}
      <section className="space-y-3">
        <h2 className="font-mono text-sm font-bold tracking-widest text-primary border-b border-border/40 pb-2 flex items-center justify-between">
          <span className="flex items-center gap-2"><Globe className="h-4 w-4" /> MY_CUSTOM_SOURCES</span>
          <button
            onClick={() => setShowAddSource(true)}
            className="flex items-center gap-1 text-xs text-primary border border-primary/40 px-2.5 py-1 hover:bg-primary/10 transition-colors font-mono"
          >
            <Plus className="h-3 w-3" /> ADD_SOURCE
          </button>
        </h2>
        {(hub?.customSources.length ?? 0) === 0 ? (
          <div className="border border-dashed border-border/50 p-8 flex flex-col items-center gap-3 text-center">
            <Globe className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm font-mono text-muted-foreground">Add any website, YouTube channel, subreddit, or X account you want to track.</p>
            <button
              onClick={() => setShowAddSource(true)}
              className="text-xs font-mono text-primary border border-primary/40 px-3 py-1.5 hover:bg-primary/10 transition-colors flex items-center gap-1"
            >
              <Plus className="h-3 w-3" /> ADD_CUSTOM_SOURCE
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {hub!.customSources.map(s => {
              const Icon = PLATFORM_ICON[s.platform] ?? Globe;
              return (
                <div key={s.id} className="border border-border/50 bg-card p-3 flex items-center justify-between gap-3 hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="font-mono text-sm font-semibold truncate">{s.name}</div>
                      <div className="text-[10px] font-mono text-muted-foreground uppercase">{s.platform}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a href={s.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <button
                      onClick={() => remove.mutate(s.id)}
                      className="text-muted-foreground hover:text-red-400 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {showAddSource && <AddCustomSourceModal onClose={() => setShowAddSource(false)} />}
    </div>
  );
}

export default function MyHub() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2 border-b border-border/50 pb-6">
        <h1 className="text-3xl font-bold font-mono flex items-center gap-3">
          <LayoutDashboard className="h-8 w-8 text-primary" />
          /my_hub
        </h1>
        <p className="text-muted-foreground font-mono text-sm">
          YOUR_PERSONALISED_FEED — the people, sources, and communities you follow, plus custom sources you track.
        </p>
      </div>

      <Show when="signed-in">
        <HubContent />
      </Show>

      <Show when="signed-out">
        <div className="border border-border/50 bg-secondary/10 p-12 flex flex-col items-center gap-6 text-center">
          <LogIn className="h-12 w-12 text-muted-foreground/30" />
          <div className="space-y-2">
            <p className="font-mono font-bold text-foreground">SIGN_IN_REQUIRED</p>
            <p className="text-sm text-muted-foreground font-mono max-w-sm">
              Create a free account to follow people and sources, and add your own custom feeds.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/sign-up" className="bg-primary text-primary-foreground font-mono text-sm px-5 py-2 hover:bg-primary/90 transition-colors">
              CREATE_ACCOUNT
            </Link>
            <Link href="/sign-in" className="border border-border/60 text-muted-foreground font-mono text-sm px-5 py-2 hover:text-foreground transition-colors">
              SIGN_IN
            </Link>
          </div>
        </div>
      </Show>
    </div>
  );
}
