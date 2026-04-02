import { Link, useLocation } from "wouter";
import { ReactNode } from "react";
import { Zap, Users, Radio, MessageSquare, Terminal, Activity } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Hub", icon: Terminal },
    { href: "/people", label: "People", icon: Users },
    { href: "/feed", label: "Feed", icon: Activity },
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
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-colors ${
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
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <span className="animate-pulse text-primary block h-2 w-2 bg-primary rounded-full"></span>
              SYS_ONLINE
            </div>
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
