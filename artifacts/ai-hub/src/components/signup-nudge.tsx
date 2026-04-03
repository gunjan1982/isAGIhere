import { useState, useEffect } from "react";
import { Link } from "wouter";
import { X, ArrowRight, Zap } from "lucide-react";
import { Show } from "@clerk/react";

const STORAGE_VISITED = "aiwc_visited";
const STORAGE_BANNER_DISMISSED = "aiwc_banner_dismissed";
const STORAGE_TOAST_DISMISSED = "aiwc_toast_dismissed";
const SCROLL_THRESHOLD = 600;

export function SignupNudge() {
  const [showBanner, setShowBanner] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    const isReturning = !!localStorage.getItem(STORAGE_VISITED);
    const bannerDismissed = !!localStorage.getItem(STORAGE_BANNER_DISMISSED);
    const toastDismissed = !!localStorage.getItem(STORAGE_TOAST_DISMISSED);

    if (!isReturning) {
      localStorage.setItem(STORAGE_VISITED, "1");
    } else if (!bannerDismissed) {
      setShowBanner(true);
    }

    if (!toastDismissed) {
      const handleScroll = () => {
        if (window.scrollY > SCROLL_THRESHOLD) {
          setShowToast(true);
          setTimeout(() => setToastVisible(true), 50);
          window.removeEventListener("scroll", handleScroll);
        }
      };
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const dismissBanner = () => {
    localStorage.setItem(STORAGE_BANNER_DISMISSED, "1");
    setShowBanner(false);
  };

  const dismissToast = () => {
    localStorage.setItem(STORAGE_TOAST_DISMISSED, "1");
    setToastVisible(false);
    setTimeout(() => setShowToast(false), 300);
  };

  return (
    <Show when="signed-out">
      <>
        {/* Return visitor banner — sits just below the header */}
        {showBanner && (
          <div className="border-b border-primary/30 bg-primary/8 px-4 py-2.5 flex items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-300"
            style={{ backgroundColor: "hsl(var(--primary) / 0.06)" }}>
            <div className="flex items-center gap-3 text-sm font-mono">
              <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-muted-foreground">
                Welcome back — <span className="text-foreground">sign up to follow people and get the weekly signal in your inbox.</span>
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/sign-up"
                className="text-xs font-mono font-semibold text-primary border border-primary/40 px-3 py-1 hover:bg-primary/10 transition-colors flex items-center gap-1"
              >
                SIGN_UP <ArrowRight className="h-3 w-3" />
              </Link>
              <button
                onClick={dismissBanner}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Scroll-triggered contextual toast — bottom right */}
        {showToast && (
          <div
            className={`fixed bottom-6 right-6 z-50 w-80 border border-border/70 bg-background shadow-xl transition-all duration-300 ${
              toastVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-1.5 w-1.5 shrink-0 mt-0.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                  </span>
                  <span className="text-xs font-mono font-semibold text-primary tracking-wider">AI_WATER_COOLER</span>
                </div>
                <button
                  onClick={dismissToast}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  aria-label="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-sm font-mono text-muted-foreground leading-relaxed">
                Enjoying the feed? Sign up to{" "}
                <span className="text-foreground">follow the people shaping AI</span>{" "}
                and get the weekly signal in your inbox.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Link
                  href="/sign-up"
                  className="flex-1 text-center text-xs font-mono font-semibold bg-primary text-primary-foreground py-2 hover:bg-primary/90 transition-colors"
                >
                  CREATE_ACCOUNT
                </Link>
                <Link
                  href="/sign-in"
                  className="flex-1 text-center text-xs font-mono text-muted-foreground border border-border/60 py-2 hover:text-foreground hover:border-border transition-colors"
                >
                  SIGN_IN
                </Link>
              </div>
            </div>
          </div>
        )}
      </>
    </Show>
  );
}
