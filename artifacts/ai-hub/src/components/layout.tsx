import { Link, useLocation } from "wouter";
import { ReactNode, useState, useEffect, useRef } from "react";
import { Zap, Users, Radio, MessageSquare, Terminal, Activity, BrainCircuit, BookOpen, LogIn, LogOut, User, ChevronDown } from "lucide-react";
import { PREDICTIONS, computeComposite } from "@/lib/agi";
import { useUser, useClerk, Show } from "@clerk/react";
import { SignupNudge } from "./signup-nudge";

function useAgiCountdown() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  const compositeDays = computeComposite(PREDICTIONS, midnight);
  const targetMs = midnight.getTime() + compositeDays * 24 * 60 * 60 * 1000;
  const diffMs = Math.max(0, targetMs - now.getTime());

  const totalSecs = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  return `${pad(days, 3)}:${pad(hours)}:${pad(mins)}:${pad(secs)}`;
}

function UserMenu() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  if (!isLoaded) return null;

  return (
    <>
      <Show when="signed-out">
        <Link
          href="/sign-in"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-mono font-medium border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-all"
        >
          <LogIn className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">SIGN_IN</span>
        </Link>
      </Show>

      <Show when="signed-in">
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 px-2.5 py-1.5 border border-border/50 bg-secondary/20 hover:border-border/80 hover:bg-secondary/40 transition-all"
          >
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
            ) : (
              <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-3 w-3 text-primary" />
              </div>
            )}
            <span className="hidden sm:block font-mono text-xs text-foreground max-w-[100px] truncate">
              {user?.firstName || user?.username || user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "USER"}
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-1 w-52 border border-border/70 bg-background shadow-lg z-50 py-1">
              <div className="px-3 py-2 border-b border-border/40">
                <div className="text-xs font-mono text-muted-foreground truncate">
                  {user?.emailAddresses?.[0]?.emailAddress}
                </div>
              </div>
              <button
                onClick={() => { setOpen(false); signOut({ redirectUrl: "/" }); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-mono text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                SIGN_OUT
              </button>
            </div>
          )}
        </div>
      </Show>
    </>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const countdown = useAgiCountdown();

  const navItems = [
    { href: "/", label: "Hub", icon: Terminal },
    { href: "/agi", label: "Is AGI Here?", icon: BrainCircuit, highlight: true },
    { href: "/people", label: "People", icon: Users },
    { href: "/feed", label: "Feed", icon: Activity },
    { href: "/learn", label: "Learn", icon: BookOpen },
    { href: "/sources", label: "Sources", icon: Radio },
    { href: "/communities", label: "Communities", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary selection:text-primary-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-primary/10 p-1 group-hover:bg-primary/20 transition-colors">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <span className="font-mono font-bold tracking-tight text-lg">AI_WATER_COOLER</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                const isHighlight = (item as { highlight?: boolean }).highlight;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-all ${
                      isActive
                        ? "text-primary bg-primary/10 border border-primary/20"
                        : isHighlight
                        ? "text-primary border border-primary/40 bg-primary/5 hover:bg-primary/15"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                    {isHighlight && !isActive && (
                      <span className="relative flex h-1.5 w-1.5 ml-0.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="flex items-center gap-2">
            <Link
              href="/agi"
              className="group flex items-center gap-2 border border-primary/40 bg-primary/5 hover:bg-primary/15 hover:border-primary/70 px-3 py-1.5 transition-all"
              title="Is AGI Here? — click to see the tracker"
            >
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
              </span>
              <span className="hidden sm:block text-[10px] font-mono text-muted-foreground group-hover:text-primary transition-colors tracking-wide">AGI_IN</span>
              <span className="font-mono text-xs font-bold text-primary tabular-nums tracking-wider">{countdown}</span>
            </Link>
            <UserMenu />
          </div>
        </div>
      </header>
      
      <SignupNudge />

      {/* Mobile Nav */}
      <div className="md:hidden border-b border-border/50 bg-secondary/20">
        <div className="flex overflow-x-auto p-2 gap-2">
          {navItems.map((item) => {
             const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
             return (
               <Link
                 key={item.href}
                 href={item.href}
                 className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium shrink-0 ${
                   isActive
                     ? "text-primary bg-primary/10 border border-primary/20"
                     : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                 }`}
               >
                 <item.icon className="h-4 w-4" />
                 {item.label}
               </Link>
             );
          })}
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 md:px-8 py-8">
        {children}
      </main>

      <footer className="border-t border-border/50 py-6 text-center text-xs font-mono text-muted-foreground">
        <div className="container mx-auto">
          <p>DATA_STREAM: ACTIVE | LAST_UPDATE: {new Date().toISOString().split('T')[0]}</p>
        </div>
      </footer>
    </div>
  );
}
