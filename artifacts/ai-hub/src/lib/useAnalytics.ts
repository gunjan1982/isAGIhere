import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// Generate a session ID per browser tab (persists through page navigation, resets on new tab)
function getSessionId(): string {
  const key = "aiwc_session";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(key, id);
  }
  return id;
}

export function usePageTracking() {
  const [location] = useLocation();
  const prevLocation = useRef<string | null>(null);

  useEffect(() => {
    if (location === prevLocation.current) return;
    prevLocation.current = location;

    const sessionId = getSessionId();
    const referrer = prevLocation.current === null ? document.referrer : undefined;

    // Fire and forget — don't await, don't surface errors to the user
    fetch(`${BASE}/api/analytics/pageview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: location,
        referrer: referrer || undefined,
        sessionId,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [location]);
}
