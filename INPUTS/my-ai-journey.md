# 🚀 My AI Journey — A Roadmap for Everyone

> *A living guide for anyone jumping on the AI bandwagon — wherever you are, this map tells you where you stand, what's adjacent, and what's next.*

---

## How to Use This Guide

- **Find your current level** in the matrix below (rows = how advanced, columns = how you access AI)
- **Move vertically** (↑) to go deeper in your current column — more power, more control, more complexity
- **Move horizontally** (→) to go adjacent — unlock a new mode of working with AI
- **Each cell** = a real, named thing you can Google, install, or try today
- **Color bands** represent equivalent complexity across all 6 modes — cells in the same row are roughly the same "effort ask"

---

## The AI Landscape in One Picture

```
┌────────────────────────────────────────────────────────────────────────────┐
│  How do you access AI?                                                     │
│                                                                            │
│  1. Web/App   →  2. Omnibus  →  3. Self-Hosted  →  4. Terminal            │
│                                                       ↕                   │
│                                        5. Dev Tools ←→ 6. Own Code        │
│                                                                            │
│  Consumer-facing ─────────────────────────────── Builder/Infrastructure   │
└────────────────────────────────────────────────────────────────────────────┘
```

> **Key insight**: The model (Llama, GPT-4, DeepSeek) is just the "brain." The column describes *how you reach it*. The row describes *how much effort it takes*.

---

## The 6 Modes — Quick Decoder

| # | Mode | What it is | You need | Zero-cost start |
|---|------|-----------|----------|-----------------|
| **1** | **Web / App Product** | Browser or mobile AI apps (ChatGPT, Claude, Perplexity, Gemini, M365 Copilot) | Just a browser | chatgpt.com |
| **2** | **Omnibus Client** | Desktop/local app that connects to *multiple* AI providers in one UI (AnythingLLM, Jan.ai, LM Studio) | Install one app | Jan.ai desktop |
| **3** | **Self-Hosted Inference** | Running models *on your own hardware* — no API calls, full privacy | Docker or Ollama | Ollama + OpenWebUI |
| **4** | **Terminal UI / Agents** | Talking to AI from the command line; AI that can run shell commands | Terminal comfort | `brew install aichat` |
| **5** | **Dev Tools / IDEs** | AI embedded inside your code editor — autocomplete, multi-file edits, agents | VS Code / Cursor | GitHub Copilot free |
| **6** | **Own Code / Scripts** | You write code that *calls* AI programmatically — batch jobs, APIs, automation | Python or Node.js | OpenAI Playground → script |

---

## 🗺️ The Full Roadmap Matrix (30 Cells)

> **Complexity bands** (read left-to-right across any row — same shade = same cognitive/technical effort):
> 🟢 Beginner | 🔵 Basic | 🟡 Intermediate | 🟠 Advanced | 🔴 Expert

---

### 🟢 Beginner — "First Contact" (Zero setup, instant value)

| | **1. Web/App** | **2. Omnibus** | **3. Self-Hosted** | **4. Terminal UI** | **5. Dev Tools** | **6. Own Code** |
|--|----------------|----------------|--------------------|--------------------|------------------|-----------------|
| **What to do** | Visit ChatGPT.com or Claude.ai — type a question, get an answer. Also try **Gemini Canvas** (co-edit docs/code in browser) and **Pomelli** (generate marketing copy from your site URL) | Install **AnythingLLM** or **Jan.ai** desktop app — connect to GPT-4, Claude, Gemini from one window without switching tabs | Pull and run the **LibreChat Docker image** — one command gives you a local ChatGPT-style interface: `docker run librechat/librechat` | Install **aichat** CLI: `brew install aichat` or `cargo install aichat`. Type `aichat "what is a dockerfile"` — done | Enable **GitHub Copilot** in VS Code — free for students/OSS. It autocompletes code as you type | Open **OpenAI Playground** or **Gemini AI Studio** — experiment with prompts and model settings in a browser before writing any code |
| **Toolbox** | ChatGPT, Claude, Gemini, Perplexity, Grok, M365 Copilot, Gemini Canvas, Pomelli | AnythingLLM, Jan.ai, ChatPlayground | LibreChat (Docker), OpenWebUI (Docker) | aichat, mods | GitHub Copilot (free tier), VS Code extension | OpenAI Playground, Gemini AI Studio |
| **Next step →** | Upload a PDF and ask questions about it | Add your OpenAI API key and switch between GPT-4 and Claude in the same chat | Run OpenWebUI locally on port 3000 | Pipe a command: `ls | aichat "explain this"` | Install Cursor or Windsurf as a full AI-first IDE | Copy the API "Hello World" from docs and run it locally |

---

### 🔵 Basic — "Configure & Point at Your Data"

| | **1. Web/App** | **2. Omnibus** | **3. Self-Hosted** | **4. Terminal UI** | **5. Dev Tools** | **6. Own Code** |
|--|----------------|----------------|--------------------|--------------------|------------------|-----------------|
| **What to do** | Use Claude or ChatGPT for document analysis — upload PDFs, spreadsheets, images. Try **AI Studio Build** to generate a simple web app by describing it in natural language | Configure API keys for multiple providers (OpenAI, Anthropic, HF) in AnythingLLM / Jan.ai. Now one dashboard, many models | Run **OpenWebUI** locally connected to **Ollama** — download Llama 3.3 or DeepSeek-R1 and chat with it privately: `ollama pull deepseek-r1:8b` | Use **mods** to pipe terminal output to AI: `cat error.log \| mods "what caused this?"` Basic **sgpt** queries for shell commands | Install **Cursor** or **Windsurf** as your main IDE. Use chat sidebar to ask about code. Use Composer for multi-file edits | Copy-paste an API example from OpenAI/Anthropic/Hugging Face docs into a Python or Node script — run it, see the response |
| **Toolbox** | Claude (PDFs), ChatGPT Advanced Data Analysis, AI Studio Build | AnythingLLM multi-provider, Jan.ai with API keys | OpenWebUI + Ollama, Llama 3.3, DeepSeek-R1 (from Hugging Face) | mods, sgpt (basic), aichat with provider config | Cursor, Windsurf, VS Code + Copilot Chat | OpenAI Node/Python SDK, Anthropic SDK, HF Inference API |
| **Next step →** | Subscribe to a paid plan and explore advanced features | Set up LM Studio with both local and cloud models | Deploy Jan.ai with a custom model configuration | Create your first shell alias for a common AI task | Configure project-level rules and context in Cursor/Windsurf | Write a script that processes multiple files in a loop |

---

### 🟡 Intermediate — "Customize, Automate, Reuse"

| | **1. Web/App** | **2. Omnibus** | **3. Self-Hosted** | **4. Terminal UI** | **5. Dev Tools** | **6. Own Code** |
|--|----------------|----------------|--------------------|--------------------|------------------|-----------------|
| **What to do** | Subscribe to **ChatGPT Plus / Claude Pro / Gemini Advanced** — create Custom GPTs. Use **Gemini Canvas** for collaborative dashboard prototyping. Use Perplexity Pro for cited research | Set up **LM Studio** with local models + cloud fallback (if local is too slow, it routes to OpenAI automatically). Use **Hugging Face Spaces** as multi-backend omnibus | Self-host **n8n** via Docker + wire it to Ollama/HF models for AI automation workflows (e.g., summarize incoming emails → route to CRM) | Create **shell aliases** for daily AI tasks: `alias explain-error='cat $1 \| sgpt "explain and fix"'` Start using **Claude Code** CLI for repo-aware coding: `cd project && claude "explain architecture"` | Configure **Windsurf Cascade** with custom prompts and project context rules. Start experimenting with **Antigravity** as an agentic IDE powered by Gemini | Write Python/Node scripts to **batch-process files** through GPT-4 / Gemini / DeepSeek APIs. Use **Hugging Face Transformers** (`pipeline("summarization")`) in your code |
| **Toolbox** | ChatGPT Plus (Custom GPTs), Claude Pro, Gemini Advanced, Gemini Canvas, Perplexity Pro | LM Studio (local+cloud), HF Spaces, Jan.ai multi-model, **OpenRouter** (one API → 500+ models) | n8n (self-hosted), Jan.ai with Ollama backend, Ollama model library | sgpt, Claude Code CLI, shell aliases, aichat with multiple providers | Windsurf (Cascade agent), Cursor (rules), Antigravity (early), Zed + AI | OpenAI Batch API, HF Transformers library, **LangChain** (chains + RAG + agents), **OpenRouter SDK** (swap models with one line) |
| **Next step →** | Chain multiple AI tools together in a research workflow | Build a unified workflow using LibreChat + multiple endpoints | Add GPU acceleration to your Ollama setup | Integrate Claude Code or sgpt with a Git hook | Create a custom VS Code extension or Antigravity agent workflow | Build a service that routes different task types to different models |

---

### 🟠 Advanced — "System-Level, Orchestrated Workflows"

| | **1. Web/App** | **2. Omnibus** | **3. Self-Hosted** | **4. Terminal UI** | **5. Dev Tools** | **6. Own Code** |
|--|----------------|----------------|--------------------|--------------------|------------------|-----------------|
| **What to do** | Use **Perplexity** for deep research with citations. Chain web apps: Pomelli → n8n → email automation. Use multimodal tools for image+text analysis in consulting workflows | Build unified orchestration workflows in **n8n** — multiple AI models, branching logic, API integrations, databases, all in one visual workflow. Also: LibreChat + multiple API endpoints | Self-host **Ollama** on a home server or cloud VM with GPU acceleration. Connect to OpenWebUI/Jan.ai as local backends for DeepSeek-R1, Llama 3.3, Mistral | Build terminal workflows integrating **sgpt** or **Claude Code** with **Git hooks** — auto-generate commit messages, explain failing tests, suggest fixes before pushes | Create custom VS Code / Cursor / Zed **extensions**. Use **Antigravity** agents to autonomously build and test full-stack apps with automated browser testing flows | Build Node.js / Python **routing services** that direct requests to cheapest/fastest/best model based on task type. Add **rules engines** to handle 80% of cases before hitting LLM APIs |
| **Toolbox** | Perplexity Pro, multimodal chains, Zapier/Make + AI | n8n (advanced flows), LibreChat, Dify, **OpenRouter** (provider fallback + cost routing) | Ollama (GPU), vLLM (start), OpenWebUI, Jan.ai, HF model download | sgpt + Git hooks, Claude Code (repo-wide), aichat advanced config | Custom extensions, Antigravity multi-agent, Zed + Claude Code, Cursor agents | Node.js model router, **LangChain agents + RAG pipelines**, **OpenRouter API** (cost-optimised multi-model routing), rules engine, HF Inference Endpoints |
| **Next step →** | Build multi-agent enterprise workflows | Deploy with load balancing across model providers | Scale to distributed inference across multiple GPUs | Build a sophisticated CLI tool with context memory | Develop a proprietary IDE plugin tied to your fine-tuned models | Build a full production API gateway |

---

### 🔴 Expert — "Production-Grade, Enterprise Architecture"

| | **1. Web/App** | **2. Omnibus** | **3. Self-Hosted** | **4. Terminal UI** | **5. Dev Tools** | **6. Own Code** |
|--|----------------|----------------|--------------------|--------------------|------------------|-----------------|
| **What to do** | Develop **multi-agent workflows** using ChatGPT Enterprise / Gemini Enterprise APIs — embed them into product offerings. Build team AI assistants with fine-tuned personas | Deploy enterprise-grade omnibus solutions (n8n / Jan.ai / custom) with **load balancing**, monitoring, multi-tenancy, SSO, and audit trails | Run **distributed inference** across multiple GPUs using **vLLM** — serve 70B+ models with PagedAttention. Host DeepSeek/Llama clusters using Hugging Face containers. Full MLOps pipelines | Create sophisticated CLI tools with **full context management**, conversation history, tool use, and MCP servers. Use the **Ralph Wiggum loop** — a script that repeatedly calls Claude Code until all tests pass | Develop **proprietary IDE plugins** and agentic environments (Cursor/Windsurf/Zed/Antigravity) wired to your fine-tuned models, internal knowledge bases, and private infra | Build a **production API gateway** — routing, caching, rate-limiting, A/B model testing, observability (OpenTelemetry), cost tracking, hybrid rules+LLM logic. Serve multiple clients from one platform |
| **Toolbox** | ChatGPT Enterprise, Gemini Enterprise, Azure OpenAI, custom fine-tunes | n8n Enterprise, custom orchestrators, LiteLLM proxy | vLLM, Ray Serve, Hugging Face TGI, Triton Inference Server | Custom CLI + MCP, Ralph Wiggum loop, Claude Code + CI/CD | Custom plugins, proprietary agentic IDEs, fine-tuned model integrations | FastAPI/Node.js gateway, LiteLLM, OpenTelemetry, Redis cache, Prometheus |

---

## 🔑 Glossary — Every Term Explained

### Tools (Alphabetical)

| Tool | What it is | Matrix Home |
|------|-----------|-------------|
| **aichat** | CLI that connects to 20+ LLM providers; chat, shell assistant, RAG, agents from terminal | 4-Beginner |
| **AI Studio Build** | Google's "vibe coding" mode — describe an app, get working code + live preview | 1-Basic / 6-Basic |
| **AnythingLLM** | Desktop/web app to connect multiple AI providers in one UI with document RAG | 2-Beginner |
| **Antigravity** | Google's agentic IDE — multi-agent system with Gemini that controls editor, terminal, and browser | 5-Intermediate → Expert |
| **Claude Code** | Anthropic's terminal-first coding agent — reads repos, edits files, runs commands with approval | 4-Intermediate → Advanced |
| **Cursor** | VS Code fork with deep AI integration — autocomplete, multi-file Composer, background agents | 5-Basic → Advanced |
| **DeepSeek** | Open-source Chinese LLM family (R1, V3) — available on Hugging Face, Ollama, API | 3-Basic (via Ollama) |
| **Docker** | Container platform to run apps (like LibreChat, OpenWebUI, n8n) without complex install | 3-Beginner prerequisite |
| **Forge / Replit Agent** | Browser-based IDE + AI agent — scaffold, refactor, deploy without leaving the browser | 5-Basic (cloud) |
| **Gemini Canvas** | Collaborative co-editing canvas in Gemini for code + documents | 1-Beginner |
| **Gemini CLI** | Google's terminal agent for coding, similar to Claude Code but Gemini-powered | 4-Intermediate |
| **Git hooks** | Scripts that run automatically on git events (commit, push) — attach AI here for auto explanations | 4-Advanced |
| **Hugging Face** | "GitHub for ML" — 2M+ models, datasets, Spaces demos, Inference Endpoints, AutoTrain | 3-Basic / 6-Intermediate |
| **Jan.ai** | Desktop client connecting to local LLMs or cloud APIs with memory + tools | 2-Beginner |
| **LangChain** | Python/JS open-source framework for building LLM-powered apps. Core concepts: **Chains** (sequence of LLM calls A→B→C), **Agents** (LLM decides which tool to use next), **RAG** (retrieve docs → feed to LLM as context), **Memory** (persist conversation state). The "plumbing" that connects your LLM to databases, APIs, files, and custom logic | 6-Intermediate → Advanced |
| **LibreChat** | Open-source ChatGPT-style UI that connects to many models — self-hosted via Docker | 3-Beginner |
| **LM Studio** | Desktop app for running local models + cloud fallback routing | 2-Intermediate |
| **mods** | CLI tool: pipe any command's output to an LLM: `cat file \| mods "summarize"` | 4-Basic |
| **n8n** | Open-source visual workflow automation — connects AI, APIs, databases | 2-Advanced / 3-Intermediate |
| **Ollama** | Local LLM runner — `ollama pull llama3.3` then `ollama run llama3.3` | 3-Basic |
| **OpenRouter** | Unified API gateway: 500+ models from 60+ providers through ONE endpoint (openrouter.ai/api/v1). Fully OpenAI-compatible — just change the URL and `model` name. Auto-routes to cheapest/fastest provider, handles fallbacks, centralised billing. Free tier available | 2-Basic / 6-Intermediate |
| **Opal** | Google Labs no-code tool to build AI mini-apps visually | 1-Beginner / 2-Intermediate |
| **OpenWebUI** | Web interface for Ollama/vLLM — gives you ChatGPT-like UI over local models | 3-Basic |
| **Pomelli** | Google Labs tool that reads your website and generates branded marketing content | 1-Beginner |
| **Ralph Wiggum loop** | Bash/script pattern that calls Claude Code in a loop until tests pass | 4-Expert / 6-Expert |
| **sgpt (shell-gpt)** | CLI for GPT/Claude models with shell integration — explain commands, generate scripts | 4-Intermediate |
| **vLLM** | High-throughput LLM inference engine for serving large models on GPU at scale | 3-Expert |
| **Windsurf** | AI-first IDE with Cascade agent for repo-scale reasoning + multi-file edits | 5-Basic → Advanced |
| **Zed** | Ultra-fast Rust-based open-source editor with built-in agents + multiplayer | 5-Intermediate |

---

### Concepts

| Concept | Plain English | Relevance |
|---------|--------------|-----------|
| **API** | A way for your code to talk to another service (e.g., your Python script calls OpenAI) | Options 1, 2, 6 |
| **Cloud fallback** | If local model is slow/unavailable, automatically route request to a cloud API instead | 2-Intermediate |
| **CSS / Tailwind** | CSS = how web pages look. Tailwind = utility classes so you write style inline: `bg-blue-500 p-4` | Web dev foundation |
| **Docker image** | A pre-packaged app container — run LibreChat with one command, no manual install | 3-Beginner |
| **Fine-tuning** | Re-training a model on your specific data to specialize its behavior | 3-Expert / 5-Expert |
| **Git hooks** | Automated scripts triggered by git events — attach Claude Code to `pre-commit` | 4-Advanced |
| **Hybrid Rules + LLM** | Rules engine handles ~80% predictable cases for free; LLM handles ambiguous 20% | 6-Advanced |
| **MCP (Model Context Protocol)** | Standard for giving LLMs access to tools, files, and external services | 4-Expert |
| **MERN Stack** | MongoDB + Express + React + Node.js — the standard full-stack JS setup for web apps | 6-Intermediate |
| **npm** | Node Package Manager — 2M+ JS packages: `npm install openai react tailwindcss` | 6-Basic |
| **Omnibus Client** | A single desktop app that gives you access to many different AI models | Column 2 |
| **Open-source LLM** | Models (Llama, DeepSeek, Mistral) whose weights are public — can be run locally | 3-Basic |
| **OpenRouter** | "Switchboard for LLMs" — one API key, 500+ models. Switch from GPT-4 to Claude to Llama by changing one line of code. Adds cost comparison, auto-fallback, load balancing across providers. Prevents vendor lock-in | 2-Basic / 6-Intermediate |
| **RAG (Retrieval-Augmented Generation)** | Give LLM access to your own documents as context at query time | 2-Intermediate / 6-Intermediate |
| **LangChain** | Open-source "glue" framework. **Chains**: call LLM A → parse → call LLM B. **Agents**: LLM decides which tool (search, calculator, DB) to invoke. **RAG**: load docs → chunk → embed → vector DB → retrieve → generate. **Memory**: remember conversation history. Like Lego for LLM apps | 6-Intermediate → Advanced |
| **Rules-based model** | Traditional if-then logic that handles predictable decisions without ML/LLMs | 6-Advanced cost optimization |
| **Self-hosted** | Running software on your own machine/server — no data leaves your environment | Column 3 |
| **Shell alias** | Shortcut in your terminal: `alias gc='git commit -m'` | 4-Intermediate |
| **SSR (Server-Side Rendering)** | HTML generated on server before sending to browser — faster load, better SEO (Next.js) | Web dev / 6 |
| **State management** | How your web app tracks and shares data (Zustand, Redux, Pinia) | Web dev / 6 |
| **Tokenization** | How LLMs break text into chunks (tokens) — affects cost and context limits | All columns |
| **vLLM** | Optimized serving engine for running large models efficiently on GPU clusters | 3-Expert |

---

## 🧭 AI Development Ecosystem Map

```
                    ┌─────────────────────────────────┐
                    │         THE MODEL LAYER          │
                    │  (GPT-4, Claude, Llama, Gemini,  │
                    │   DeepSeek, Mistral, Phi-3)      │
                    └─────────────┬───────────────────┘
                                  │
           ┌──────────────────────┼──────────────────────┐
           ▼                      ▼                       ▼
   ┌───────────────┐    ┌──────────────────┐   ┌─────────────────┐
   │  CLOUD API    │    │  LOCAL / SELF-   │   │  OPEN SOURCE    │
   │  (OpenAI,     │    │  HOSTED          │   │  (Hugging Face, │
   │  Anthropic,   │    │  (Ollama, vLLM,  │   │  GitHub)        │
   │  Gemini API)  │    │  LibreChat)      │   │                 │
   └───────┬───────┘    └────────┬─────────┘   └────────┬────────┘
           │                    │                       │
           └──────────┬─────────┘──────────────────────┘
                      │
        ┌─────────────┼──────────────────────────────┐
        ▼             ▼              ▼                ▼
 ┌────────────┐ ┌──────────┐ ┌────────────┐ ┌──────────────┐
 │  WEB/APP   │ │ OMNIBUS  │ │  TERMINAL  │ │   DEV TOOLS  │
 │ ChatGPT,   │ │ Jan.ai,  │ │ Claude     │ │ Cursor,      │
 │ Perplexity │ │ AnythingLLM│ │ Code, sgpt│ │ Windsurf,    │
 │ Gemini     │ │ LM Studio│ │ aichat     │ │ Antigravity  │
 └────────────┘ └──────────┘ └────────────┘ └──────────────┘
                                                     │
                                            ┌────────▼────────┐
                                            │   YOUR CODE     │
                                            │ Python, Node.js │
                                            │ n8n, LangChain  │
                                            └─────────────────┘
```

---

## 🏗️ The Web Dev Stack (For Building AI Apps)

```
┌─────────────────────────────────────────────────┐
│  FRONTEND (what users see)                      │
│  React (most popular) / Vue (easiest)           │
│  Next.js (SSR+API) / Nuxt (Vue SSR)             │
│  Styling: Tailwind CSS                          │
│  State: Zustand (React) / Pinia (Vue)           │
└──────────────────────┬──────────────────────────┘
                       │ API calls
┌──────────────────────▼──────────────────────────┐
│  BACKEND (logic + AI calls)                     │
│  Node.js + Express / Fastify                    │
│  npm packages: openai, anthropic, ollama-js     │
│  Rules engine: if/else → LLM fallback           │
└──────────────────────┬──────────────────────────┘
                       │ queries
┌──────────────────────▼──────────────────────────┐
│  DATABASE                                       │
│  MongoDB (flexible, NoSQL) / PostgreSQL (SQL)   │
│  Prisma ORM                                     │
└─────────────────────────────────────────────────┘
```

**Quick start (MERN + AI in 5 minutes)**:
```bash
npx create-next-app@latest my-ai-app --typescript --tailwind --app
cd my-ai-app
npm install openai zustand recharts ollama-js
npm run dev
```

---

## 📍 Where Are You? Self-Assessment Checklist

Mark which boxes you genuinely use today:

### Column 1 — Web/App Product
- [ ] 🟢 I use ChatGPT / Claude / Gemini regularly for research or writing
- [ ] 🔵 I upload documents and ask questions about them
- [ ] 🟡 I have a paid subscription (ChatGPT Plus / Claude Pro) and use advanced features
- [ ] 🟠 I chain multiple AI tools together in research workflows with citations
- [ ] 🔴 I manage enterprise multi-agent deployments

### Column 2 — Omnibus Client
- [ ] 🟢 I use one app to switch between multiple AI models
- [ ] 🔵 I have API keys configured for 2+ providers in one dashboard
- [ ] 🟡 I use LM Studio with local + cloud hybrid routing
- [ ] 🟠 I build n8n or LibreChat workflows connecting many AI endpoints
- [ ] 🟠 I use **OpenRouter** as my unified API layer so I can swap models with one line change
- [ ] 🔴 I run enterprise load-balanced model routing infrastructure

### Column 3 — Self-Hosted Inference
- [ ] 🟢 I've run a Docker container (LibreChat, OpenWebUI)
- [ ] 🔵 I've run a local model via Ollama (`ollama run llama3.3`)
- [ ] 🟡 I self-host n8n + Ollama for private AI automations
- [ ] 🟠 I run Ollama/vLLM on a server or cloud VM with GPU
- [ ] 🔴 I run distributed inference across multiple GPUs with vLLM

### Column 4 — Terminal UI
- [ ] 🟢 I've installed and used a terminal AI tool (aichat, sgpt, mods)
- [ ] 🔵 I pipe command output to AI: `cat file | mods "explain"`
- [ ] 🟡 I use shell aliases and Claude Code for repo-aware coding
- [ ] 🟠 I have AI integrated into Git hooks for commit/push workflows
- [ ] 🔴 I've built custom CLI tools with context management + MCP

### Column 5 — Dev Tools / IDEs
- [ ] 🟢 I use GitHub Copilot or similar for code autocomplete
- [ ] 🔵 I use Cursor or Windsurf as my primary IDE
- [ ] 🟡 I configure project-level AI rules and context in my IDE
- [ ] 🟠 I use Antigravity or Zed for multi-agent agentic coding
- [ ] 🔴 I develop proprietary IDE plugins with custom model integrations

### Column 6 — Own Code / Scripts
- [ ] 🟢 I've used OpenAI Playground or Gemini AI Studio
- [ ] 🔵 I've run an LLM API call in a Python or Node script
- [ ] 🟡 I write scripts to batch-process data through LLM APIs
- [ ] 🟠 I've built model routing services or used LangChain/n8n programmatically
- [ ] 🔴 I run production API gateways with caching and multi-model orchestration

---

## ⏭️ Your Next Move — Adjacency Guide

### If you're at **1-Beginner** (just using ChatGPT):
- **Vertical** (go deeper in Web/App): Get Claude Pro, learn to write better prompts, use the API
- **Horizontal** (adjacent):
  - → **2-Beginner**: Install Jan.ai — compare GPT-4 vs Claude vs Gemini side-by-side for free
  - → **5-Basic**: Add GitHub Copilot to VS Code — AI in your editor takes 5 minutes

### If you're at **1+5 Beginner/Basic** (Web tools + Cursor/Windsurf):
- **Vertical in 5**: Configure Windsurf Cascade rules, try Antigravity for full-stack builds
- **Horizontal**:
  - → **4-Basic**: Install aichat CLI (30 mins) — unlock terminal AI without leaving your workflow
  - → **3-Basic**: Install Ollama + OpenWebUI (1 hour) — run DeepSeek locally, zero API costs

### If you're at **4-5 Intermediate** (Claude Code + Cursor):
- **Vertical in 4**: Add Claude Code to Git hooks, build Ralph Wiggum loops
- **Vertical in 5**: Try Antigravity agents for automated browser testing
- **Horizontal**:
  - → **6-Intermediate**: Write your first Python batch-processing script using the OpenAI API
  - → **3-Intermediate**: Self-host n8n + Ollama for private automation pipelines

### If you're at **6-Intermediate** (writing API scripts):
- **Vertical in 6**: Build a model router service — route tasks to cheapest model automatically
- **Horizontal**:
  - → **3-Advanced**: Host your own Ollama server on a VPS — 90% cost reduction vs API
  - → **2-Advanced**: Use n8n to orchestrate your scripts visually without rewriting them

---

## 💰 Cost Reality Check

| What you're doing | Monthly cost | How to reduce |
|-------------------|-------------|---------------|
| ChatGPT Plus only | ~$20 | Free tier for light use |
| Claude Pro only | ~$20 | Free tier for light use |
| Cursor Pro | ~$20 | Windsurf free tier |
| Both Claude Pro + Cursor | ~$40 | Use Claude Code (usage-based) |
| GPT-4 API (heavy use) | $50-200+ | Route 80% to rules engine first → saves 80% |
| GPT-4 API + local Ollama hybrid | $5-20 | Local handles private/bulk, API for quality |
| Full local (Ollama + good GPU) | $0 API cost | One-time hardware investment |

> **Rule of thumb**: A **rules engine handles 80% of predictable cases for free** — only the ambiguous 20% needs an LLM. This alone cuts API costs by 60-90%.

---

## 🚦 The "Which Tool When" Cheatsheet

| Your task | Best tool | Why |
|-----------|-----------|-----|
| Research a topic quickly | Perplexity (Web/App) | Citations, real-time web |
| Write a document / email | Claude (Web/App) | Best long-form writing |
| Analyze a PDF / spreadsheet | ChatGPT or Claude (Web) | Native file handling |
| Generate code snippet | Cursor / Windsurf (Dev Tools) | IDE context = better code |
| Refactor entire codebase | Claude Code (Terminal) | Reads whole repo, diffs with approval |
| Debug an error in terminal | `cat error \| mods "fix"` (Terminal) | Instant, no copy-paste |
| Run a model on private data | Ollama + OpenWebUI (Self-Hosted) | Zero data leaves your machine |
| Automate multi-step workflows | n8n (Omnibus/Self-Hosted) | Visual, connects any API |
| Batch-process 1000 documents | Python + OpenAI Batch API (Own Code) | 50% cost reduction, async |
| Build a web dashboard | Next.js + Tailwind + Recharts (Own Code) | SSR, fast, components |
| Ship a full SaaS quickly | Antigravity agents (Dev Tools) | Multi-agent, browser testing |
| Compare 3 models for a task | Jan.ai or LM Studio (Omnibus) | Side-by-side, one UI |
| Fine-tune a model on your data | Hugging Face AutoTrain (Own Code) | No-code fine-tuning |

---

## 🗓️ Suggested 4-Week Onboarding Plan

### Week 1 — "Hello AI" (Columns 1 + 5, Beginner)
- Monday: Create ChatGPT free account → try 10 prompts
- Tuesday: Try Claude.ai → compare with ChatGPT
- Wednesday: Try Perplexity → research something with citations
- Thursday: Install GitHub Copilot in VS Code → use for 1 hour
- Friday: Install Cursor free tier → compare with Copilot

### Week 2 — "Unlock Privacy + Terminal" (Columns 3 + 4, Basic)
- Monday: Install Docker Desktop
- Tuesday: `docker pull ollama/ollama` + `ollama run llama3.3:8b`
- Wednesday: `docker run openwebui` → connect to Ollama
- Thursday: `brew install aichat` → set up with your Claude API key
- Friday: Try `cat README.md | aichat "summarize this project"`

### Week 3 — "Agents + Automation" (Columns 4 + 5, Intermediate)
- Monday: Install Claude Code (`cargo install claude-code`)
- Tuesday: Run `claude` in your project → ask it to explain architecture
- Wednesday: Create 3 shell aliases for your most common AI tasks
- Thursday: Configure Windsurf Cascade rules for your project
- Friday: Try Antigravity — give it a build task, watch it work

### Week 4 — "Code Your Own" (Column 6, Intermediate)
- Monday: Get an OpenAI API key → run first Python API call
- Tuesday: Write a script to process 5 documents in a loop
- Wednesday: Install n8n via Docker → build a 3-step AI workflow
- Thursday: Connect n8n to your local Ollama model
- Friday: Deploy your first Next.js page to Vercel

---

## 📌 Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│  MY AI JOURNEY — QUICK REFERENCE                            │
├──────────┬──────────────────────────────────────────────────┤
│ BEGINNER │ ChatGPT → Jan.ai → Ollama → aichat → Copilot     │
│ BASIC    │ PDF analysis → API keys → OpenWebUI → mods/sgpt  │
│ INTERMED │ Custom GPTs → LM Studio → n8n → Claude Code       │
│ ADVANCED │ Tool chains → n8n flows → GPU Ollama → Git hooks  │
│ EXPERT   │ Enterprise agents → vLLM → Ralph Wiggum → Gateway │
├──────────┴──────────────────────────────────────────────────┤
│  VERTICAL  = go deeper in same column (more power/control)  │
│  HORIZONTAL = try adjacent column (new mode, new skills)    │
│  DIAGONAL = level up AND change mode (biggest leap)         │
└─────────────────────────────────────────────────────────────┘
```


---

## 🔀 OpenRouter vs Direct APIs vs Omnibus Clients

These three approaches all give you "access to multiple models" but in very different ways:

| Approach | What you do | Code change to switch models | Best for |
|----------|-------------|------------------------------|----------|
| **Direct APIs** (OpenAI, Anthropic, Gemini) | Call each provider's endpoint separately | Rewrite auth, SDK, endpoint for every switch | Single-provider apps |
| **OpenRouter** | One endpoint, one API key, 500+ models | Change one line: `model: "anthropic/claude-3-opus"` | Multi-model apps, cost optimisation, testing |
| **Omnibus Client** (Jan.ai, AnythingLLM) | GUI desktop app, no code | Click dropdown to switch | Non-coders, quick comparisons |

**OpenRouter in code** (works with the OpenAI SDK you already know):
```python
from openai import OpenAI

client = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key="your-openrouter-key"
)

# Switch between ANY model by changing just this one line:
response = client.chat.completions.create(
  model="anthropic/claude-3.5-sonnet",   # or "openai/gpt-4o" or "meta-llama/llama-3.3-70b"
  messages=[{"role": "user", "content": "Summarize this therapy transcript"}]
)
```

**Matrix placement**: OpenRouter lives at the boundary of Column 2 (Omnibus) and Column 6 (Own Code):
- Column 2-Basic: Use openrouter.ai web UI to compare model outputs side-by-side
- Column 6-Intermediate: Use OpenRouter API in your Python scripts for zero-rewrite model switching

---

## 🔗 LangChain — The Full Picture

LangChain is the most widely used framework for building LLM-powered applications in code. It sits firmly in **Column 6 (Own Code)** from Intermediate upward.

### What LangChain actually does (plain English)

Think of LangChain as **railway tracks** — it doesn't provide the train (the LLM) but gives you the infrastructure to run complex journeys:

```
Without LangChain:   User → Your code → OpenAI API → Response
With LangChain:      User → Chain → [Retrieve docs] → [Summarise] → [Format] → [Check rules] → Response
```

### Core LangChain concepts

| Concept | What it is | Real example |
|---------|-----------|--------------|
| **Chain** | Sequence of steps: prompt → LLM → parse → next step | Translate → Summarise → Format as JSON |
| **Agent** | LLM decides dynamically which tools to use | "Search web OR query database, whichever answers this" |
| **RAG** | Load your docs → chunk → embed → store → retrieve relevant chunks → feed to LLM | "Answer from our therapy manual" |
| **Memory** | Persist conversation history across calls | Chatbot that remembers earlier in session |
| **Tools** | Functions the agent can call | Web search, calculator, database query, API call |

### LangChain + OpenRouter = powerful combo
```python
from langchain_openai import ChatOpenAI
from langchain.chains import RetrievalQA

# Use ANY model via OpenRouter — just change model name
llm = ChatOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="your-openrouter-key",
    model="meta-llama/llama-3.3-70b-instruct"  # free tier on OpenRouter
)

# Build a RAG chain over your therapy documents
qa_chain = RetrievalQA.from_chain_type(llm=llm, retriever=your_vectorstore.as_retriever())
result = qa_chain.invoke("What are the key themes in these transcripts?")
```

**Matrix placement**: 6-Intermediate (basic chains) → 6-Advanced (agents + RAG) → 6-Expert (production multi-agent systems)

---

*Last updated: April 2026 · Based on a real learning journey, question by question.*

*Tools mentioned: ChatGPT, Claude, Gemini, Perplexity, OpenRouter, Grok, M365 Copilot, Gemini Canvas, Pomelli, AI Studio Build, Opal, AnythingLLM, Jan.ai, ChatPlayground, LM Studio, LibreChat, OpenWebUI, Ollama, n8n, vLLM, Hugging Face, aichat, mods, sgpt, Claude Code, Gemini CLI, shell aliases, Git hooks, Ralph Wiggum loop, Cursor, Windsurf, GitHub Copilot, Antigravity, Zed, Forge/Replit, VS Code, LangChain, Node.js, React, Vue, Angular, Next.js, Nuxt, Tailwind CSS, Zustand, Pinia, MongoDB, PostgreSQL, Prisma, Docker.*
