import { useState } from "react";
import { Link } from "wouter";
import { Show } from "@clerk/react";
import { useUserHub, useFollowMutations, useCustomSourceMutations, useMyFeed } from "@/lib/useFollows";
import { AddCustomSourceModal } from "@/components/add-custom-source-modal";
import {
  LayoutDashboard, Users, Radio, MessageSquare, Plus, Trash2,
  ExternalLink, Globe, Youtube, Twitter, Loader2, LogIn, Rss, Clock, Cpu, ArrowRight
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type JourneyProfile = {
  id: number;
  displayName: string | null;
  experienceLevel: string | null;
  primaryUseCases: string | null;
  isPublic: boolean;
  updatedAt: string | null;
};

function useMyJourneyProfile() {
  return useQuery<JourneyProfile | null>({
    queryKey: ["journey-profile-mine"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/journey/profile`, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch journey profile");
      return res.json();
    },
    staleTime: 5 * 60_000,
  });
}

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

function MyFeedSection() {
  const { data, isLoading } = useMyFeed(20);
  const items = data?.items ?? [];

  return (
    <section className="space-y-3">
      <h2 className="font-mono text-sm font-bold tracking-widest text-primary border-b border-border/40 pb-2 flex items-center justify-between">
        <span className="flex items-center gap-2"><Rss className="h-4 w-4" /> MY_FEED</span>
        <span className="text-xs text-muted-foreground font-normal">
          {data?.followedPeople ? `${data.followedPeople} PEOPLE_TRACKED` : ""}
        </span>
      </h2>
      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground font-mono text-sm py-6 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> LOADING_FEED...
        </div>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-border/50 p-8 flex flex-col items-center gap-3 text-center">
          <Rss className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm font-mono text-muted-foreground">
            {data?.followedPeople === 0
              ? "Follow some people below to see their latest articles here."
              : "No recent articles from people you follow yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item: any) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 border border-border/50 bg-card p-3 hover:border-primary/40 hover:bg-primary/5 transition-colors group"
            >
              <div className="min-w-0 flex-1">
                <div className="font-mono text-sm font-semibold group-hover:text-primary transition-colors line-clamp-1">
                  {item.title}
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground mt-0.5">
                  <span className="uppercase tracking-wider">{item.sourceName}</span>
                  {item.publishedAt && (
                    <>
                      <span>·</span>
                      <Clock className="h-2.5 w-2.5" />
                      <span>{new Date(item.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    </>
                  )}
                </div>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary shrink-0 hidden sm:block" />
            </a>
          ))}
        </div>
      )}
    </section>
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

      {/* Personalised Feed */}
      {(hub?.people.length ?? 0) > 0 && <MyFeedSection />}

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

      {/* MY AI Journey */}
      <MyJourneySection />

      {showAddSource && <AddCustomSourceModal onClose={() => setShowAddSource(false)} />}
    </div>
  );
}

function MyJourneySection() {
  const { data: profile, isLoading } = useMyJourneyProfile();

  return (
    <section className="space-y-3">
      <h2 className="font-mono text-sm font-bold tracking-widest text-primary border-b border-border/40 pb-2 flex items-center justify-between">
        <span className="flex items-center gap-2"><Cpu className="h-4 w-4" /> MY_AI_JOURNEY</span>
        <Link href="/my-journey" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
          OPEN <ArrowRight className="h-3 w-3" />
        </Link>
      </h2>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground font-mono text-sm py-4 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> LOADING...
        </div>
      ) : profile ? (
        <Link
          href="/my-journey"
          className="block border border-border/50 bg-card p-4 hover:border-primary/40 hover:bg-primary/5 transition-colors group"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-bold font-mono text-sm group-hover:text-primary transition-colors">
                {profile.displayName ?? "MY_PROFILE"}
              </div>
              <div className="text-xs font-mono text-muted-foreground mt-0.5 flex items-center gap-2">
                {profile.experienceLevel && (
                  <span className="uppercase tracking-wider">{profile.experienceLevel.replace(/_/g, " ")}</span>
                )}
                {profile.isPublic ? (
                  <span className="text-green-500/70">● PUBLIC</span>
                ) : (
                  <span className="text-muted-foreground/50">● PRIVATE</span>
                )}
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
          </div>
        </Link>
      ) : (
        <div className="border border-dashed border-border/40 p-6 flex flex-col items-center gap-3 text-center">
          <Cpu className="h-7 w-7 text-muted-foreground/20" />
          <p className="text-sm font-mono text-muted-foreground">
            Log your AI tool usage, rate frontier models, and share your experience with the community.
          </p>
          <Link
            href="/my-journey"
            className="text-xs font-mono text-primary border border-primary/40 px-4 py-2 hover:bg-primary/10 transition-colors"
          >
            SET_UP_MY_JOURNEY →
          </Link>
        </div>
      )}
    </section>
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
