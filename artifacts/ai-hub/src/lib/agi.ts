export interface Prediction {
  id: string;
  person: string;
  org: string;
  orgColor: string;
  statementDate: string;
  statementContext: string;
  quote: string;
  agiDate: Date | null;
  daysNote: string;
  confidence: number;
  weight: number;
  isSpecial?: boolean;
  specialNote?: string;
  sourceUrl: string;
}

export const PREDICTIONS: Prediction[] = [
  {
    id: "amodei",
    person: "Dario Amodei",
    org: "Anthropic",
    orgColor: "#d97706",
    statementDate: "2026-01-21",
    statementContext: "World Economic Forum, Davos",
    quote: "I think that we could get to what most people would call AGI... within 1 to 2 years. That's my actual belief.",
    agiDate: new Date("2027-07-01"),
    daysNote: "1–2 years from Jan 2026",
    confidence: 70,
    weight: 1.2,
    sourceUrl: "https://www.weforum.org/events/world-economic-forum-annual-meeting-2026/",
  },
  {
    id: "hassabis",
    person: "Demis Hassabis",
    org: "Google DeepMind",
    orgColor: "#4285f4",
    statementDate: "2026-01-21",
    statementContext: "World Economic Forum, Davos",
    quote: "There's maybe a 50% chance that AGI might be achieved within the decade... today's systems are nowhere near human-level AGI.",
    agiDate: new Date("2030-06-01"),
    daysNote: "~50% by end of decade (2030–2031)",
    confidence: 50,
    weight: 1.0,
    sourceUrl: "https://www.weforum.org/events/world-economic-forum-annual-meeting-2026/",
  },
  {
    id: "altman",
    person: "Sam Altman",
    org: "OpenAI",
    orgColor: "#10a37f",
    statementDate: "2026-01-07",
    statementContext: "OpenAI blog post + briefing with President-elect Trump",
    quote: "We are now confident we know how to build AGI as we have traditionally understood it. AGI will come during this administration.",
    agiDate: new Date("2029-01-20"),
    daysNote: "Before end of Trump's term (Jan 20, 2029)",
    confidence: 80,
    weight: 1.3,
    sourceUrl: "https://openai.com/",
  },
  {
    id: "huang",
    person: "Jensen Huang",
    org: "Nvidia",
    orgColor: "#76b900",
    statementDate: "2026-03-23",
    statementContext: "Lex Fridman Podcast",
    quote: "I think it's now. I think we've achieved AGI. [But] AI has not yet surpassed complex human intelligence.",
    agiDate: null,
    daysNote: "0 days — then immediately retracted",
    confidence: 30,
    weight: 0,
    isSpecial: true,
    specialNote:
      'Huang defined AGI as "an AI earning $1B+ from a viral app." He declared it achieved, then qualified that AI hasn\'t surpassed complex human intelligence. Excluded from composite — definition mismatch.',
    sourceUrl: "https://lexfridman.com/jensen-huang/",
  },
  {
    id: "legg",
    person: "Shane Legg",
    org: "Google DeepMind",
    orgColor: "#4285f4",
    statementDate: "2024-01-01",
    statementContext: "Ongoing public prediction (maintained for 10+ years)",
    quote: "I've maintained a ~50% probability of achieving minimal AGI by 2028 for over a decade.",
    agiDate: new Date("2028-06-01"),
    daysNote: "50% probability by mid-2028",
    confidence: 50,
    weight: 0.8,
    sourceUrl: "https://80000hours.org/2025/03/when-do-experts-expect-agi-to-arrive/",
  },
  {
    id: "musk",
    person: "Elon Musk",
    org: "xAI / Tesla",
    orgColor: "#1d9bf0",
    statementDate: "2025-01-01",
    statementContext: "Various public statements",
    quote: "AI will be smarter than the smartest human by 2026.",
    agiDate: new Date("2026-12-31"),
    daysNote: "By end of 2026",
    confidence: 60,
    weight: 0.7,
    sourceUrl: "https://x.com/elonmusk",
  },
  {
    id: "son",
    person: "Masayoshi Son",
    org: "SoftBank",
    orgColor: "#e4002b",
    statementDate: "2025-02-01",
    statementContext: "SoftBank earnings call",
    quote: "AGI will be achieved in 2 to 3 years. It will be 10,000 times smarter than the most brilliant human.",
    agiDate: new Date("2027-08-01"),
    daysNote: "2–3 years from Feb 2025",
    confidence: 65,
    weight: 0.6,
    sourceUrl: "https://group.softbank/news/press/20250212",
  },
  {
    id: "metaculus",
    person: "Metaculus Crowd",
    org: "1,700+ Forecasters",
    orgColor: "#8b5cf6",
    statementDate: "2026-02-01",
    statementContext: "Community forecast — continuously updated",
    quote: "Median community prediction for when the first general AI will be publicly announced.",
    agiDate: new Date("2028-02-05"),
    daysNote: "Crowd median: Feb 5, 2028",
    confidence: 50,
    weight: 1.0,
    sourceUrl: "https://www.metaculus.com/questions/5121/date-of-general-ai/",
  },
];

export function computeComposite(predictions: Prediction[], referenceDate: Date): number {
  const active = predictions.filter((p) => p.agiDate !== null && p.weight > 0);
  if (active.length === 0) return 0;
  const totalWeight = active.reduce((s, p) => s + p.weight, 0);
  const weightedSum = active.reduce((s, p) => {
    const days = Math.round((p.agiDate!.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
    return s + days * p.weight;
  }, 0);
  return Math.round(weightedSum / totalWeight);
}

export function getAgiTargetDate(): Date {
  const now = new Date();
  const midnightNow = new Date(now);
  midnightNow.setHours(0, 0, 0, 0);
  const compositeDays = computeComposite(PREDICTIONS, midnightNow);
  return new Date(midnightNow.getTime() + compositeDays * 24 * 60 * 60 * 1000);
}
