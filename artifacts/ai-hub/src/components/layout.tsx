import { Link, useLocation } from "wouter";
import { ReactNode, useState, useEffect } from "react";
import { Zap, Users, Radio, MessageSquare, Terminal, Activity, BrainCircuit, BookOpen } from "lucide-react";
import { PREDICTIONS, computeComposite } from "@/lib/agi";

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
              <span className="font-mono font-bold tracking-tight text-lg">AI_INDUSTRY_HUB</span>
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
          
          <div className="flex items-center gap-3">
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
          </div>
        </div>
      </header>
      
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
