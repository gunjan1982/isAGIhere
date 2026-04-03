import { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";
import { PREDICTIONS, computeComposite } from "@/lib/agi";

function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

const COMPETING_TRACKERS = [
  {
    name: "The AGI Clock",
    url: "https://theagiclock.com",
    algorithm: "Weighted average of expert predictions from Altman, Hinton, Musk, and others. Updates as new statements are made.",
  },
  {
    name: "AI Countdown",
    url: "https://aicountdown.com",
    algorithm: "Directly mirrors the Metaculus community median prediction with a live countdown clock.",
  },
  {
    name: "AI Doomsday Countdown",
    url: "https://aidoomsdaycountdown.com",
    algorithm: "Compares predictions from 8+ AI models, tracks benchmarks, funding, and safety research progress.",
  },
  {
    name: "Alan's Conservative AGI Countdown",
    url: "https://lifearchitect.ai/agi/",
    algorithm: "Milestone-based % completion. Includes embodiment (robotics) in AGI definition. Places current systems at ~88% of AGI.",
  },
  {
    name: "AI 2027",
    url: "https://ai-2027.com",
    algorithm: "Scenario-based analysis by AI safety researchers. Modal year 2027 with medians somewhat longer.",
  },
];

function formatDays(days: number): string {
  if (days <= 0) return "TODAY";
  if (days < 365) return `${days} days`;
  const years = Math.floor(days / 365);
  const rem = days % 365;
  const months = Math.floor(rem / 30);
  if (months === 0) return `${years} yr`;
  return `${years} yr ${months} mo`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function getVerdict(days: number): { label: string; color: string; sub: string } {
  if (days <= 0) return { label: "AGI IS HERE", color: "#22c55e", sub: "at least by one definition" };
  if (days < 365) return { label: "IMMINENT", color: "#f97316", sub: "< 1 year by weighted consensus" };
  if (days < 730) return { label: "CLOSE", color: "#f59e0b", sub: "1–2 years by weighted consensus" };
  if (days < 1460) return { label: "APPROACHING", color: "#d97706", sub: "2–4 years by weighted consensus" };
  return { label: "NOT YET", color: "#6b7280", sub: "4+ years by weighted consensus" };
}

export default function AgiTracker() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const composite = computeComposite(PREDICTIONS, now);
  const verdict = getVerdict(composite);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <section className="space-y-4 border-b border-border/50 pb-8">
        <div className="inline-flex items-center gap-2 border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-mono text-primary">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          LIVE_TRACKER — UPDATED CONTINUOUSLY
        </div>
        <h1 className="text-4xl md:text-5xl font-bold font-mono tracking-tight">
          IS_AGI_HERE<span className="text-primary">?</span>
        </h1>
        <p className="text-muted-foreground font-mono text-sm max-w-2xl leading-relaxed">
          A weighted composite of public statements from AI lab CEOs, founders, and researchers. Aggregated days-to-AGI figure updates in real time as new predictions are made.
        </p>
      </section>

      {/* Big counter */}
      <section className="border border-border/50 bg-card p-8 md:p-12 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 30px, ${verdict.color}30 30px, ${verdict.color}30 31px)`,
          }}
        />
        <div className="relative z-10 space-y-4">
          <div className="font-mono text-xs text-muted-foreground tracking-widest">WEIGHTED_COMPOSITE_CONSENSUS</div>
          <div
            className="text-7xl md:text-9xl font-bold font-mono tabular-nums"
            style={{ color: verdict.color }}
          >
            {composite <= 0 ? "0" : composite.toLocaleString()}
          </div>
          <div className="text-2xl font-mono text-muted-foreground">
            {composite <= 0 ? "days" : composite === 1 ? "day" : "days"}
          </div>
          <div className="pt-4 space-y-1">
            <div className="text-3xl font-bold font-mono" style={{ color: verdict.color }}>
              {verdict.label}
            </div>
            <div className="text-sm font-mono text-muted-foreground">{verdict.sub}</div>
          </div>
          <div className="pt-2 text-xs font-mono text-muted-foreground border-t border-border/30 mt-4 pt-4">
            Composite AGI target: {formatDate(new Date(now.getTime() + composite * 86400000))} &nbsp;|&nbsp; As of {now.toUTCString()}
          </div>
        </div>
      </section>

      {/* Algorithm explanation */}
      <section className="border border-border/50 bg-secondary/10 p-6 space-y-3">
        <h2 className="font-mono text-sm font-bold text-primary tracking-widest">HOW_WE_CALCULATE_THIS</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm font-mono text-muted-foreground">
          <div className="space-y-2">
            <div className="text-foreground font-semibold">Algorithm</div>
            <p>For each prediction: convert the expert's stated AGI date to <span className="text-primary">days from today</span>. Apply a <span className="text-primary">credibility weight</span> (based on proximity to frontier AI development). Compute the weighted average. Jensen Huang's "it's now" declaration is flagged separately — his narrow definition is an outlier that would pull the composite to zero, distorting the signal.</p>
          </div>
          <div className="space-y-2">
            <div className="text-foreground font-semibold">Weights (0–1.5)</div>
            <div className="space-y-1 text-xs">
              {PREDICTIONS.filter((p) => p.weight > 0).map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">{p.person}</span>
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex-1 h-1.5 bg-border/50">
                      <div
                        className="h-full bg-primary/60"
                        style={{ width: `${(p.weight / 1.5) * 100}%` }}
                      />
                    </div>
                    <span className="text-primary w-6 text-right">{p.weight}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Prediction breakdown */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold font-mono text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
          SIGNAL_BREAKDOWN — EXPERT_PREDICTIONS
        </h2>

        <div className="space-y-3">
          {PREDICTIONS.map((p) => {
            const daysAway = p.agiDate ? daysBetween(p.agiDate, now) : 0;
            const isOverdue = daysAway < 0 && p.agiDate !== null;
            return (
              <div
                key={p.id}
                className={`border bg-card p-5 space-y-3 transition-all ${p.isSpecial ? "border-yellow-500/40 bg-yellow-500/5" : "border-border/50 hover:border-primary/30"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-1 self-stretch flex-shrink-0 rounded-full"
                      style={{ backgroundColor: p.orgColor }}
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-foreground">{p.person}</span>
                        <span className="text-xs font-mono text-muted-foreground border border-border/50 px-1.5 py-0.5">
                          {p.org}
                        </span>
                        {p.isSpecial && (
                          <span className="text-xs font-mono text-yellow-400 border border-yellow-500/30 bg-yellow-500/10 px-1.5 py-0.5">
                            SPECIAL_CASE
                          </span>
                        )}
                        {isOverdue && (
                          <span className="text-xs font-mono text-red-400 border border-red-500/30 bg-red-500/10 px-1.5 py-0.5">
                            OVERDUE
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-mono text-muted-foreground mt-0.5">
                        {p.statementContext} &mdash; {new Date(p.statementDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      </div>
                    </div>
                  </div>

                  {/* Days meter */}
                  <div className="text-right shrink-0">
                    <div
                      className="text-2xl font-bold font-mono tabular-nums"
                      style={{ color: p.agiDate === null ? "#22c55e" : isOverdue ? "#ef4444" : p.orgColor }}
                    >
                      {p.agiDate === null ? "NOW" : isOverdue ? `${Math.abs(daysAway)}d late` : formatDays(daysAway)}
                    </div>
                    <div className="text-xs font-mono text-muted-foreground">{p.daysNote}</div>
                  </div>
                </div>

                {/* Quote */}
                <blockquote className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3 italic leading-relaxed">
                  "{p.quote}"
                </blockquote>

                {/* Confidence bar */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground w-28 shrink-0">CONFIDENCE</span>
                  <div className="flex-1 h-1 bg-border/40">
                    <div
                      className="h-full transition-all"
                      style={{ width: `${p.confidence}%`, backgroundColor: p.orgColor + "aa" }}
                    />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground w-8 text-right">{p.confidence}%</span>
                  <a
                    href={p.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                {/* Special note */}
                {p.specialNote && (
                  <div className="text-xs font-mono text-yellow-400/70 bg-yellow-500/5 border border-yellow-500/20 p-3 leading-relaxed">
                    NOTE: {p.specialNote}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Other trackers */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold font-mono text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
          COMPETING_TRACKERS — METHODOLOGY_COMPARISON
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {COMPETING_TRACKERS.map((t) => (
            <div key={t.url} className="border border-border/50 bg-card p-4 space-y-2 hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-bold font-mono text-sm">{t.name}</span>
                <a
                  href={t.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              <p className="text-xs text-muted-foreground font-mono leading-relaxed">{t.algorithm}</p>
            </div>
          ))}
        </div>
        <div className="text-xs font-mono text-muted-foreground border border-border/30 p-3 bg-secondary/10">
          METHODOLOGY_NOTE: Most trackers use the Metaculus community median as their primary signal. Our tracker differs by weighting individual frontier-lab statements (Altman, Amodei, Hassabis) more heavily than crowd forecasts, on the basis that these actors have material knowledge of internal capability progress.
        </div>
      </section>

      {/* Definitions sidebar */}
      <section className="border border-border/50 bg-secondary/5 p-6 space-y-4">
        <h2 className="font-mono text-sm font-bold text-primary tracking-widest">THE_DEFINITION_PROBLEM</h2>
        <p className="text-sm font-mono text-muted-foreground leading-relaxed">
          The biggest variable in any AGI tracker is the definition. Predictions diverge not just in timing but in what they are predicting:
        </p>
        <div className="grid md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="border border-border/30 p-3 space-y-1">
            <div className="text-primary font-semibold">HUANG DEFINITION</div>
            <div className="text-muted-foreground">An AI that earns $1B from a viral app, even temporarily. By this bar: <span className="text-green-400">achieved March 2026.</span></div>
          </div>
          <div className="border border-border/30 p-3 space-y-1">
            <div className="text-primary font-semibold">AMODEI / ALTMAN</div>
            <div className="text-muted-foreground">AI that outperforms humans across most economically relevant cognitive tasks. Target: <span className="text-amber-400">2027–2029.</span></div>
          </div>
          <div className="border border-border/30 p-3 space-y-1">
            <div className="text-primary font-semibold">HASSABIS / LEGG</div>
            <div className="text-muted-foreground">True general intelligence: few-shot learning, continuous learning, robust reasoning. Target: <span className="text-blue-400">2028–2031.</span></div>
          </div>
        </div>
      </section>

    </div>
  );
}
