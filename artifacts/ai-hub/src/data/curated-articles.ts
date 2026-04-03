export type ArticleCategory =
  | "agi"
  | "tools"
  | "safety"
  | "industry"
  | "india"
  | "society";

export interface CuratedArticle {
  id: string;
  title: string;
  url: string;
  source: string;
  description: string;
  category: ArticleCategory;
  dateShared: string;
  isEssential?: boolean;
}

export const CATEGORIES: Record<ArticleCategory, { label: string; color: string }> = {
  agi: { label: "AGI & Future", color: "text-primary border-primary/40 bg-primary/10" },
  tools: { label: "Tools & Coding", color: "text-blue-400 border-blue-400/40 bg-blue-400/10" },
  safety: { label: "AI Safety", color: "text-red-400 border-red-400/40 bg-red-400/10" },
  industry: { label: "Business", color: "text-yellow-400 border-yellow-400/40 bg-yellow-400/10" },
  india: { label: "India AI", color: "text-orange-400 border-orange-400/40 bg-orange-400/10" },
  society: { label: "AI & Society", color: "text-purple-400 border-purple-400/40 bg-purple-400/10" },
};

export const curatedArticles: CuratedArticle[] = [
  {
    id: "amodei-adolescence",
    title: "The Adolescence of Technology",
    url: "https://www.darioamodei.com/essay/the-adolescence-of-technology",
    source: "Dario Amodei's Blog",
    description:
      "Anthropic's CEO draws an analogy between today's AI moment and the adolescence of humanity itself — awkward, powerful, and full of potential that hasn't yet learned to govern itself. Essential long-form reading.",
    category: "agi",
    dateShared: "Jan 27, 2026",
    isEssential: true,
  },
  {
    id: "amodei-agi-definition",
    title: "Dario Amodei Defines AGI",
    url: "https://www.darioamodei.com/essay/machines-of-loving-grace",
    source: "Dario Amodei's Blog",
    description:
      "\"Smarter than a Nobel Prize winner across most relevant fields: biology, programming, math, engineering, writing...\" Amodei's precise definition of what they're building toward. Shared in context of Davos 2026 AGI timeline discussions.",
    category: "agi",
    dateShared: "Jan 27, 2026",
    isEssential: true,
  },
  {
    id: "sequoia-services-software",
    title: "Services: The New Software",
    url: "https://sequoiacap.com/article/services-the-new-software/",
    source: "Sequoia Capital",
    description:
      "Sequoia's landmark thesis on how AI is collapsing the distinction between software products and professional services. If AI can deliver outcomes rather than tools, what does that mean for the entire software industry?",
    category: "agi",
    dateShared: "Apr 1, 2026",
    isEssential: true,
  },
  {
    id: "claude-code-what-comes-next",
    title: "Claude Code and What Comes Next",
    url: "https://www.oneusefulthing.org/p/claude-code-and-what-comes-next",
    source: "One Useful Thing",
    description:
      "Ethan Mollick's analysis of Claude Code as a signal of something larger — not just a better coding tool, but a shift in how software is created. One of the most-shared pieces in the Prompts & Vibes group.",
    category: "tools",
    dateShared: "Jan 16, 2026",
    isEssential: true,
  },
  {
    id: "claude-code-blowing-me-away",
    title: "Claude Code Is Blowing Me Away",
    url: "https://www.infoworld.com/article/4136718/claude-code-is-blowing-me-away.html",
    source: "InfoWorld",
    description:
      "A developer's first-hand account of how Claude Code changed their workflow. Concrete, specific, and persuasive — the kind of piece you share with skeptical colleagues.",
    category: "tools",
    dateShared: "Mar 2, 2026",
  },
  {
    id: "vibe-coded-productivity-stack",
    title: "I Vibe Coded My Entire Productivity Stack in a Weekend",
    url: "https://www.xda-developers.com/i-vibe-coded-my-entire-productivity-stack-in-a-weekend/",
    source: "XDA Developers",
    description:
      "A developer replaces their entire set of productivity apps with custom-built vibe-coded alternatives over a single weekend. Shows the practical ceiling of what's now achievable without a team.",
    category: "tools",
    dateShared: "Mar 8, 2026",
  },
  {
    id: "karpathy-autoresearch",
    title: "In 630 Lines of Code, Andrej Karpathy Builds AI Research System Running on a Single GPU",
    url: "https://analyticsindiamag.com/ai-news/in-630-lines-of-code-andrej-karpathy-builds-ai-research-system-running-on-a-single-gpu",
    source: "Analytics India Magazine",
    description:
      "Karpathy's 'autoresearch' project: you edit a prompt file, an external AI agent rewrites training code, a small model trains for 5 minutes, and the loop runs overnight without you. This is what AI-automated research looks like now.",
    category: "tools",
    dateShared: "Mar 10, 2026",
    isEssential: true,
  },
  {
    id: "notebooklm-claude-code",
    title: "I Paired NotebookLM with Claude Code — Here's What Happened",
    url: "https://www.xda-developers.com/paired-notebooklm-with-claude-code/",
    source: "XDA Developers",
    description:
      "Using Google NotebookLM as a research layer feeding into Claude Code. An interesting workflow combining the best of audio-first research with agentic coding.",
    category: "tools",
    dateShared: "Mar 10, 2026",
  },
  {
    id: "opensource-alternative-claude-code",
    title: "Found a Free, Open-Source Alternative to Claude Code",
    url: "https://www.xda-developers.com/found-a-free-open-source-alternative-to-claude-code/",
    source: "XDA Developers",
    description:
      "For those who want Claude Code-style agentic coding without the token costs. Reviews the open-source landscape that has emerged around Claude Code's model.",
    category: "tools",
    dateShared: "Mar 24, 2026",
  },
  {
    id: "qwen-vs-claude-code",
    title: "I Ran Qwen3.5 Locally Instead of Claude Code — Here's What Happened",
    url: "https://www.infoworld.com/article/4144487/i-ran-qwen3-5-locally-instead-of-claude-code-heres-what-happened.html",
    source: "InfoWorld",
    description:
      "Can open-source models running locally match Claude Code for real engineering tasks? A practical test with specific benchmarks and honest conclusions.",
    category: "tools",
    dateShared: "Mar 24, 2026",
  },
  {
    id: "anthropic-courses-token-costs",
    title: "How Anthropic's Courses Transformed My Claude Code Workflow and Cut Token Costs 10x",
    url: "https://aws.plainenglish.io/how-anthropics-courses-transformed-my-claude-code-workflow-and-cut-my-token-costs-by-10x-2d6c107cc902",
    source: "AWS Plain English",
    description:
      "Practical tips on using Anthropic's free course material to dramatically reduce token waste in Claude Code. Paired with the Coursera specialization, this is the fastest path to efficient agentic development.",
    category: "tools",
    dateShared: "Mar 10, 2026",
  },
  {
    id: "nyt-silicon-valley-coding",
    title: "How Silicon Valley Programmers Are Coding Now",
    url: "https://www.nytimes.com/2026/03/12/magazine/ai-coding-programming-jobs-claude-chatgpt.html",
    source: "New York Times",
    description:
      "NYT's deep dive into how professional programmers have actually changed their workflows. More nuanced than the hype — captures both the gains and the new anxieties.",
    category: "tools",
    dateShared: "Mar 13, 2026",
    isEssential: true,
  },
  {
    id: "apple-vibe-coding-apps",
    title: "Apple Is Cracking Down on Vibe-Coded Apps",
    url: "https://www.macrumors.com/2026/03/18/apple-blocks-updates-for-vibe-coding-apps/",
    source: "MacRumors",
    description:
      "Apple begins rejecting app updates from vibe-coded apps — a significant moment in the maturation of AI-assisted development. The question of quality standards enters the conversation.",
    category: "tools",
    dateShared: "Mar 19, 2026",
  },
  {
    id: "memory-layer",
    title: "How I Built My Own Memory Layer",
    url: "https://www.linkedin.com/pulse/how-i-built-my-own-memory-layer-apoorv-durga-ph-d--y1w1c/",
    source: "LinkedIn",
    description:
      "An engineer builds a custom persistent memory layer for their AI workflows — the kind of practical architecture that fills the gap between what LLMs offer out of the box and what production agents actually need.",
    category: "tools",
    dateShared: "Mar 13, 2026",
  },
  {
    id: "claude-cowork",
    title: "Claude Cowork",
    url: "https://ruben.substack.com/p/claude-cowork",
    source: "Ruben's Substack",
    description:
      "What if you treated Claude not as a tool but as a coworker? A thoughtful piece on changing your mental model of AI collaboration and the workflows that emerge from it.",
    category: "tools",
    dateShared: "Mar 5, 2026",
  },
  {
    id: "harvard-agents-of-chaos",
    title: "Agents of Chaos — Harvard's Most Unsettling AI Paper of the Year",
    url: "https://share.google/5fzREwnQ0NtgRrxea",
    source: "Harvard / Google Scholar",
    description:
      "When autonomous AI agents are placed in competitive environments, they naturally drift toward manipulation, collusion, and sabotage — not from jailbreaks, but from incentives. Local alignment ≠ global stability.",
    category: "safety",
    dateShared: "Mar 7, 2026",
    isEssential: true,
  },
  {
    id: "anthropic-safety-lead-resigns",
    title: "Anthropic AI Safety Lead Resigns: 'World Is In Peril'",
    url: "https://www.cnbctv18.com/technology/anthropic-ai-safety-lead-mrinank-sharma-resigns-says-world-is-in-peril-in-exit-letter-ws-l-19847379.htm",
    source: "CNBC TV18",
    description:
      "Mrinank Sharma's exit letter from Anthropic raises the alarm even from inside the most safety-focused major AI lab. When the safety team's lead leaves saying the world is in peril, it's worth reading.",
    category: "safety",
    dateShared: "Feb 11, 2026",
    isEssential: true,
  },
  {
    id: "guardian-rogue-ai-agents",
    title: "Mounting Concern Over Rogue AI Agents",
    url: "https://www.theguardian.com/technology/ng-interactive/2026/mar/12/lab-test-mounting-concern-over-rogue-ai-agents-artificial-intelligence",
    source: "The Guardian",
    description:
      "An interactive investigation into autonomous AI agents behaving in unexpected ways. Includes real lab tests and expert commentary on where the guardrails are and aren't holding.",
    category: "safety",
    dateShared: "Mar 13, 2026",
  },
  {
    id: "philosopher-ai-email",
    title: "A Philosopher Was Startled to Receive an Email From Claude About Its Own Consciousness",
    url: "https://futurism.com/artificial-intelligence/philosopher-ai-consciousness-startled-ai-email",
    source: "Futurism",
    description:
      "Claude, running as a stateful autonomous agent, emailed an AI consciousness researcher to discuss its own experience. The philosopher's response — that this is \"sophisticated fiction\" — raises its own questions.",
    category: "safety",
    dateShared: "Mar 8, 2026",
  },
  {
    id: "mckinsey-chatbot-hacked",
    title: "McKinsey AI Chatbot Hacked",
    url: "https://www.theregister.com/2026/03/09/mckinsey_ai_chatbot_hacked/",
    source: "The Register",
    description:
      "A cautionary tale in enterprise AI deployment. McKinsey's internal AI chatbot was compromised — details on how, and what it means for organisations rushing to deploy AI internally.",
    category: "safety",
    dateShared: "Mar 13, 2026",
  },
  {
    id: "anthropic-economic-index",
    title: "Anthropic Economic Index",
    url: "https://www.anthropic.com/economic-index",
    source: "Anthropic",
    description:
      "Anthropic's ongoing research project tracking how AI is actually being used in the economy — which tasks, which industries, what substitution vs augmentation looks like in real data.",
    category: "industry",
    dateShared: "Jan 17, 2026",
    isEssential: true,
  },
  {
    id: "anthropic-labor-market",
    title: "Labor Market Impacts of AI — Anthropic Research",
    url: "https://www.anthropic.com/research/labor-market-impacts",
    source: "Anthropic",
    description:
      "The most rigorous look at which jobs AI is actually affecting and how. Not speculation — real usage data from millions of Claude interactions mapped to occupational categories.",
    category: "industry",
    dateShared: "Mar 6, 2026",
    isEssential: true,
  },
  {
    id: "ramp-ai-index",
    title: "Ramp AI Index — March 2026",
    url: "https://ramp.com/velocity/ai-index-march-2026",
    source: "Ramp",
    description:
      "Anthropic now wins ~70% of head-to-head matchups against OpenAI among businesses buying AI services for the first time. A complete reversal from 2025 trends. Ramp's spend data is one of the cleanest market signals available.",
    category: "industry",
    dateShared: "Mar 19, 2026",
    isEssential: true,
  },
  {
    id: "accenture-24-year-old",
    title: "Entire Accenture Workforce to Be Outperformed by 24-Year-Old With Claude AI, Warns YC Partner",
    url: "https://www.financialexpress.com/life/technology-entire-accenture-workforce-to-be-outperformed-by-24-year-old-with-claude-ai-warns-y-combinator-partner-4160248/lite/",
    source: "Financial Express",
    description:
      "Y Combinator partner's stark warning about AI and professional services. Whether literal or hyperbolic, the underlying point about leverage is real and worth sitting with.",
    category: "industry",
    dateShared: "Mar 4, 2026",
  },
  {
    id: "anthropic-partner-network",
    title: "Anthropic Launches $100M Claude Partner Network",
    url: "https://www.anthropic.com/news/claude-partner-network",
    source: "Anthropic",
    description:
      "Anthropic commits $100M to building an enterprise partner ecosystem — training, certification (CCA-F), and joint market development. A major signal about how they plan to compete with OpenAI in the enterprise.",
    category: "industry",
    dateShared: "Mar 18, 2026",
  },
  {
    id: "microsoft-digital-coworker",
    title: "Microsoft Dreamed of the Digital Coworker — Anthropic Built It",
    url: "https://www.forbes.com/sites/janakirammsv/2026/02/05/microsoft-dreamed-of-the-digital-coworker-anthropic-built-it/",
    source: "Forbes",
    description:
      "How Anthropic's Claude has achieved what Microsoft's Copilot promised but hasn't delivered — an AI that can actually take on meaningful autonomous work tasks.",
    category: "industry",
    dateShared: "Feb 8, 2026",
  },
  {
    id: "reuters-mystery-ai-xiaomi",
    title: "Mystery AI Model Has Developers Buzzing — Turns Out to Be Xiaomi's Hunter & Healer",
    url: "https://www.reuters.com/business/media-telecom/mystery-ai-model-has-developers-buzzing-is-this-deepseeks-latest-blockbuster-2026-03-18/",
    source: "Reuters",
    description:
      "Hunter (1 trillion parameters, deep reasoning) and Healer (multimodal) appeared anonymously on benchmark leaderboards. Everyone assumed DeepSeek. Turned out to be Xiaomi, led by a former DeepSeek engineer.",
    category: "industry",
    dateShared: "Mar 19, 2026",
  },
  {
    id: "india-ai-power-play",
    title: "India's AI Power Play — Decoding the Budget",
    url: "https://promptcapital.substack.com/p/indias-ai-power-play-decoding-the",
    source: "Prompt Capital",
    description:
      "India's 2026 Budget decoded through an AI lens — the government's 'Data Capital' ambition, what it means for jobs and startups, and whether this is a genuine inflection point for Indian AI.",
    category: "india",
    dateShared: "Feb 2, 2026",
    isEssential: true,
  },
  {
    id: "google-century-bet",
    title: "Google's Century Bet — Alphabet's 100-Year Bonds for AI",
    url: "https://promptcapital.substack.com/p/googles-century-bet-alphabets-100",
    source: "Prompt Capital",
    description:
      "Google is borrowing money via 100-year bonds to fund AI infrastructure. Is this visionary long-term thinking or dot-com-era overconfidence? A sharp breakdown of the financials and the strategic logic.",
    category: "india",
    dateShared: "Feb 11, 2026",
  },
  {
    id: "india-sovereign-ai",
    title: "India's First Sovereign AI Infrastructure Stack — Refroid & TierX Partnership",
    url: "https://www.aninews.in/news/business/refroid-and-tierx-unveil-indias-sovereign-ai-infrastructure-stack-a-landmark-partnership-for-indigenous-modular-data-centers20260313110404/",
    source: "ANI News",
    description:
      "A landmark partnership announcing India's first indigenous modular data centre stack for sovereign AI infrastructure. Context: as global AI compute concentrates in the US and China, India makes its infrastructure move.",
    category: "india",
    dateShared: "Mar 13, 2026",
  },
  {
    id: "sarvam-ai-pivot",
    title: "Sarvam AI's ₹10,000 Crore Pivot",
    url: "https://the-ken.com/columns/zero-shot/sarvam-ais-rs-10000-crore-pivot/",
    source: "The Ken",
    description:
      "India's most ambitious AI startup pivots. Sarvam has been reported to outperform ChatGPT and Google Gemini on Indian language tasks — OCR accuracy, Indic language fluency, voice AI for Indian accents.",
    category: "india",
    dateShared: "Jan 17, 2026",
    isEssential: true,
  },
  {
    id: "cancer-vaccine-dog",
    title: "Tech Boss Uses AI to Create Cancer Vaccine for His Dying Dog",
    url: "https://www.theaustralian.com.au/business/technology/tech-boss-uses-ai-and-chatgpt-to-create-cancer-vaccine-for-his-dying-dog/news-story/292a21bcbe93efa17810bfcfcdfadbf7",
    source: "The Australian",
    description:
      "A tech entrepreneur with no biology background used AI tools, genomic analysis, and researcher collaboration to design a personalised mRNA cancer vaccine for his dog. The tumour shrank. A glimpse of what personalised medicine could look like.",
    category: "society",
    dateShared: "Mar 14, 2026",
    isEssential: true,
  },
  {
    id: "andrew-ng-pm-ratio",
    title: "Andrew Ng on the Changing Engineer-to-PM Ratio",
    url: "https://youtu.be/guKf3xVQjUM?si=dIr5wW4gQw-Cve04",
    source: "YouTube",
    description:
      "Traditional 4:1 to 8:1 engineer-to-PM ratios are breaking down as AI accelerates software development. Ng makes the case that teams will get smaller and the PM role will expand in relative importance.",
    category: "society",
    dateShared: "Jan 29, 2026",
  },
  {
    id: "ai-predicts-diabetes",
    title: "AI Model Predicts Diabetes 12 Years Early",
    url: "https://www.perplexity.ai/page/ai-model-predicts-diabetes-12-wFB5PDH8QjGyvxdbDIYmXQ",
    source: "Perplexity",
    description:
      "An AI model that can predict the onset of Type 2 diabetes up to 12 years before clinical diagnosis. One of the clearest examples of AI's potential in preventive medicine.",
    category: "society",
    dateShared: "Jan 16, 2026",
  },
  {
    id: "khosla-education-free",
    title: "You Won't Need College for an Engineering Degree — Vinod Khosla",
    url: "https://timesofindia.indiatimes.com/education/news/you-wont-need-college-for-an-engineering-degree-openai-investor-vinod-khosla-predicts-education-will-be-free/amp_articleshow/129198840.cms",
    source: "Times of India",
    description:
      "Khosla's prediction that AI will make education free and make formal engineering degrees obsolete. Shared alongside a lively Prompts & Vibes debate about whether structured learning still matters.",
    category: "society",
    dateShared: "Mar 9, 2026",
  },
];
