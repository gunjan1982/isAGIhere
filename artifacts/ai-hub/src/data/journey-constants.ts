export const FRONTIER_MODELS = [
  { provider: "Anthropic", models: ["Claude 3.7 Sonnet", "Claude 3.5 Haiku", "Claude 3 Opus"] },
  { provider: "OpenAI", models: ["GPT-4o", "GPT-4o mini", "o3", "o4-mini"] },
  { provider: "Google", models: ["Gemini 2.0 Flash", "Gemini 2.0 Pro", "Gemini 1.5 Pro"] },
  { provider: "xAI", models: ["Grok 3", "Grok 2"] },
  { provider: "Meta", models: ["Llama 3.3 70B", "Llama 3.1 405B"] },
  { provider: "Mistral", models: ["Mistral Large", "Mistral Small"] },
  { provider: "DeepSeek", models: ["DeepSeek R2", "DeepSeek V3"] },
];

export const TOOL_CATEGORIES = ["LLM", "Code", "Image", "Audio", "Video", "Search", "Agent", "Productivity", "Other"];
export const USE_CASES = ["Coding", "Writing", "Research", "Creative", "Analysis", "Customer Support", "Education", "Business", "Other"];
export const EXPERIENCE_LEVELS = [
  { value: "beginner", label: "BEGINNER — just getting started" },
  { value: "intermediate", label: "INTERMEDIATE — using AI daily" },
  { value: "advanced", label: "ADVANCED — building with AI" },
  { value: "expert", label: "EXPERT — pushing the frontier" },
];
export const FREQUENCY_OPTIONS = ["Daily", "Weekly", "Monthly", "Occasionally"];
