#!/usr/bin/env node
'use strict';
/*
 * yzdatabase builder
 * - Verifies each candidate repo via the GitHub REST API (gh api)
 * - Fetches real stars / description / language / license / topics
 * - Drops anything that 404s; dedupes by canonical full_name
 * - Emits index.json, per-category files, schema, README, AGENT_GUIDE, playbooks, report
 */
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUT = process.cwd();
const OWNER_ACCOUNT = 'tardigradsoftware-design';
const REPO_NAME = 'yzdatabase';
const RAW_BASE = `https://raw.githubusercontent.com/${OWNER_ACCOUNT}/${REPO_NAME}/main`;
const TODAY = new Date().toISOString().slice(0, 10);

// [category, "owner/repo", "short use phrase"]
const CANDIDATES = [
  // ---- agent-frameworks ----
  ["agent-frameworks", "langchain-ai/langchain", "Compose LLM apps with chains, tools and memory"],
  ["agent-frameworks", "langchain-ai/langgraph", "Build stateful, multi-step agent graphs"],
  ["agent-frameworks", "run-llama/llama_index", "Data framework for RAG and agents"],
  ["agent-frameworks", "crewAIInc/crewAI", "Orchestrate role-playing multi-agent crews"],
  ["agent-frameworks", "microsoft/autogen", "Multi-agent conversation framework"],
  ["agent-frameworks", "Significant-Gravitas/AutoGPT", "Autonomous goal-driven agent platform"],
  ["agent-frameworks", "pydantic/pydantic-ai", "Type-safe agent framework built on Pydantic"],
  ["agent-frameworks", "agno-agi/agno", "Lightweight high-performance multi-agent framework"],
  ["agent-frameworks", "huggingface/smolagents", "Minimal agents that write code to act"],
  ["agent-frameworks", "microsoft/semantic-kernel", "SDK to embed LLMs into apps (C#/Python)"],
  ["agent-frameworks", "deepset-ai/haystack", "Build production LLM and RAG pipelines"],
  ["agent-frameworks", "stanfordnlp/dspy", "Program (not prompt) LLMs and auto-optimize"],
  ["agent-frameworks", "geekan/MetaGPT", "Multi-agent software-company simulation"],
  ["agent-frameworks", "camel-ai/camel", "Framework for communicative multi-agent systems"],
  ["agent-frameworks", "assafelovic/gpt-researcher", "Autonomous web-research agent"],
  ["agent-frameworks", "OpenBMB/XAgent", "Autonomous agent for complex tasks"],
  ["agent-frameworks", "TransformerOptimus/SuperAGI", "Dev-first autonomous agent framework"],
  ["agent-frameworks", "reworkd/AgentGPT", "Configure and deploy autonomous agents in-browser"],
  ["agent-frameworks", "livekit/agents", "Realtime voice AI agents framework"],
  ["agent-frameworks", "mastra-ai/mastra", "TypeScript agent framework"],
  ["agent-frameworks", "langroid/langroid", "Multi-agent programming framework"],

  // ---- mcp ----
  ["mcp", "modelcontextprotocol/servers", "Reference MCP servers (files, git, fetch, etc.)"],
  ["mcp", "modelcontextprotocol/python-sdk", "Build MCP servers and clients in Python"],
  ["mcp", "modelcontextprotocol/typescript-sdk", "Build MCP servers and clients in TypeScript"],
  ["mcp", "punkpeye/awesome-mcp-servers", "Curated catalog of MCP servers"],
  ["mcp", "github/github-mcp-server", "Official GitHub MCP server"],
  ["mcp", "block/goose", "Local AI agent that uses MCP extensions"],

  // ---- orchestration ----
  ["orchestration", "BerriAI/litellm", "Unified API/proxy for 100+ LLM providers"],
  ["orchestration", "langgenius/dify", "Visual platform to build LLM apps"],
  ["orchestration", "langflow-ai/langflow", "Visual low-code builder for LLM/agent flows"],
  ["orchestration", "FlowiseAI/Flowise", "Drag-and-drop LLM app builder"],
  ["orchestration", "instructor-ai/instructor", "Structured LLM outputs via Pydantic"],
  ["orchestration", "dottxt-ai/outlines", "Constrained / structured text generation"],
  ["orchestration", "guardrails-ai/guardrails", "Validate and correct LLM outputs"],
  ["orchestration", "promptfoo/promptfoo", "Test, evaluate and red-team prompts"],
  ["orchestration", "Portkey-AI/gateway", "Fast AI gateway and router"],
  ["orchestration", "guidance-ai/guidance", "Fine-grained control of LLM generation"],
  ["orchestration", "n8n-io/n8n", "Workflow automation with AI nodes"],
  ["orchestration", "activepieces/activepieces", "Open-source automation (Zapier-like)"],

  // ---- rag-retrieval ----
  ["rag-retrieval", "infiniflow/ragflow", "RAG engine with deep document understanding"],
  ["rag-retrieval", "Mintplex-Labs/anything-llm", "All-in-one desktop RAG application"],
  ["rag-retrieval", "microsoft/graphrag", "Graph-based RAG over private data"],
  ["rag-retrieval", "neuml/txtai", "Embeddings database and semantic search"],
  ["rag-retrieval", "stanford-futuredata/ColBERT", "Fast late-interaction neural retrieval"],
  ["rag-retrieval", "llmware-ai/llmware", "Enterprise RAG and small-model pipelines"],
  ["rag-retrieval", "weaviate/Verba", "Open-source RAG chatbot (Weaviate)"],

  // ---- vector-db ----
  ["vector-db", "chroma-core/chroma", "Embedding database for AI apps"],
  ["vector-db", "qdrant/qdrant", "High-performance vector database"],
  ["vector-db", "weaviate/weaviate", "Vector database with hybrid search"],
  ["vector-db", "milvus-io/milvus", "Scalable cloud-native vector database"],
  ["vector-db", "facebookresearch/faiss", "Library for efficient similarity search"],
  ["vector-db", "pgvector/pgvector", "Vector similarity search inside Postgres"],
  ["vector-db", "lancedb/lancedb", "Serverless vector database for AI"],
  ["vector-db", "marqo-ai/marqo", "End-to-end vector search engine"],

  // ---- memory ----
  ["memory", "mem0ai/mem0", "Long-term memory layer for AI agents"],
  ["memory", "letta-ai/letta", "Stateful agents with persistent memory (ex-MemGPT)"],

  // ---- web-search-scraping ----
  ["web-search-scraping", "mendableai/firecrawl", "Crawl sites and convert to LLM-ready data"],
  ["web-search-scraping", "unclecode/crawl4ai", "LLM-friendly web crawler and scraper"],
  ["web-search-scraping", "searxng/searxng", "Self-hosted privacy metasearch engine"],
  ["web-search-scraping", "scrapy/scrapy", "Mature Python web scraping framework"],
  ["web-search-scraping", "apify/crawlee", "Web scraping and automation library"],
  ["web-search-scraping", "jina-ai/reader", "Turn any URL into LLM-friendly text"],
  ["web-search-scraping", "tavily-ai/tavily-python", "Search API client built for LLMs"],
  ["web-search-scraping", "adbar/trafilatura", "Extract main text and metadata from web pages"],

  // ---- browser-automation ----
  ["browser-automation", "microsoft/playwright", "Reliable cross-browser automation"],
  ["browser-automation", "browser-use/browser-use", "Let an LLM control a real browser"],
  ["browser-automation", "Skyvern-AI/skyvern", "Automate browser workflows with LLMs + vision"],
  ["browser-automation", "puppeteer/puppeteer", "Headless Chrome automation for Node"],

  // ---- coding-agents ----
  ["coding-agents", "Aider-AI/aider", "AI pair programming in your terminal"],
  ["coding-agents", "All-Hands-AI/OpenHands", "Autonomous software-engineer agent"],
  ["coding-agents", "princeton-nlp/SWE-agent", "Agent that fixes real GitHub issues"],
  ["coding-agents", "cline/cline", "Autonomous coding agent in VS Code"],
  ["coding-agents", "continuedev/continue", "Open-source AI code assistant / autocomplete"],
  ["coding-agents", "gpt-engineer-org/gpt-engineer", "Generate a codebase from a prompt"],
  ["coding-agents", "OpenInterpreter/open-interpreter", "LLMs run code locally from natural language"],
  ["coding-agents", "Codium-ai/pr-agent", "AI-powered code review on pull requests"],
  ["coding-agents", "e2b-dev/E2B", "Secure cloud sandbox for AI-generated code"],

  // ---- local-inference ----
  ["local-inference", "ollama/ollama", "Run LLMs locally with one command"],
  ["local-inference", "ggml-org/llama.cpp", "LLM inference in C/C++ on CPU/GPU"],
  ["local-inference", "vllm-project/vllm", "High-throughput LLM serving engine"],
  ["local-inference", "huggingface/text-generation-inference", "Production LLM serving toolkit"],
  ["local-inference", "oobabooga/text-generation-webui", "Local LLM web UI and backend"],
  ["local-inference", "Mozilla-Ocho/llamafile", "Run an LLM from a single executable file"],
  ["local-inference", "mudler/LocalAI", "Self-hosted OpenAI-compatible API"],
  ["local-inference", "nomic-ai/gpt4all", "Run local chatbots on consumer hardware"],
  ["local-inference", "janhq/jan", "Offline ChatGPT alternative (desktop)"],
  ["local-inference", "sgl-project/sglang", "Fast serving for LLMs and vision-LLMs"],

  // ---- fine-tuning ----
  ["fine-tuning", "hiyouga/LLaMA-Factory", "Unified fine-tuning for 100+ LLMs"],
  ["fine-tuning", "unslothai/unsloth", "Faster, lower-VRAM LLM fine-tuning"],
  ["fine-tuning", "huggingface/peft", "Parameter-efficient fine-tuning (LoRA/QLoRA)"],
  ["fine-tuning", "huggingface/trl", "SFT, DPO and RLHF training"],
  ["fine-tuning", "axolotl-ai-cloud/axolotl", "Streamlined LLM fine-tuning"],
  ["fine-tuning", "huggingface/transformers", "State-of-the-art models and training"],
  ["fine-tuning", "microsoft/DeepSpeed", "Large-scale training and inference optimization"],

  // ---- observability-eval ----
  ["observability-eval", "langfuse/langfuse", "LLM observability, tracing and metrics"],
  ["observability-eval", "Arize-ai/phoenix", "LLM/ML observability and evaluation"],
  ["observability-eval", "confident-ai/deepeval", "Unit-testing framework for LLM outputs"],
  ["observability-eval", "explodinggradients/ragas", "Evaluate RAG pipelines"],
  ["observability-eval", "openai/evals", "Framework for evaluating LLMs"],
  ["observability-eval", "comet-ml/opik", "Trace, evaluate and monitor LLM apps"],
  ["observability-eval", "traceloop/openllmetry", "OpenTelemetry instrumentation for LLM apps"],

  // ---- speech ----
  ["speech", "openai/whisper", "Robust multilingual speech-to-text"],
  ["speech", "SYSTRAN/faster-whisper", "Fast Whisper inference via CTranslate2"],
  ["speech", "m-bain/whisperX", "Whisper with word-level timestamps and diarization"],
  ["speech", "coqui-ai/TTS", "Deep-learning text-to-speech toolkit"],
  ["speech", "myshell-ai/OpenVoice", "Instant voice cloning"],
  ["speech", "suno-ai/bark", "Generative text-to-audio model"],
  ["speech", "fishaudio/fish-speech", "Multilingual text-to-speech"],

  // ---- vision-multimodal ----
  ["vision-multimodal", "facebookresearch/segment-anything", "Segment any object in an image"],
  ["vision-multimodal", "ultralytics/ultralytics", "YOLO object detection and segmentation"],
  ["vision-multimodal", "haotian-liu/LLaVA", "Large language-and-vision assistant"],
  ["vision-multimodal", "openai/CLIP", "Image-text embeddings"],
  ["vision-multimodal", "IDEA-Research/Grounded-Segment-Anything", "Detect and segment objects by text prompt"],
  ["vision-multimodal", "roboflow/supervision", "Reusable computer-vision tooling"],

  // ---- document-processing ----
  ["document-processing", "Unstructured-IO/unstructured", "Preprocess documents for LLMs and RAG"],
  ["document-processing", "pymupdf/PyMuPDF", "Fast PDF text and image extraction"],
  ["document-processing", "jsvine/pdfplumber", "Extract text and tables from PDFs"],
  ["document-processing", "py-pdf/pypdf", "Pure-Python PDF read/write/manipulate"],
  ["document-processing", "docling-project/docling", "Parse documents into structured data"],
  ["document-processing", "microsoft/markitdown", "Convert files to Markdown for LLMs"],
  ["document-processing", "PaddlePaddle/PaddleOCR", "Multilingual OCR toolkit"],
  ["document-processing", "tesseract-ocr/tesseract", "Classic OCR engine"],

  // ---- ui-frontend ----
  ["ui-frontend", "open-webui/open-webui", "Feature-rich self-hosted LLM web UI"],
  ["ui-frontend", "lobehub/lobe-chat", "Modern multi-provider chat UI"],
  ["ui-frontend", "danny-avila/LibreChat", "Enhanced multi-model ChatGPT clone"],
  ["ui-frontend", "Chainlit/chainlit", "Build chat UIs for LLM apps in Python"],
  ["ui-frontend", "gradio-app/gradio", "Build ML/LLM web UIs in Python"],
  ["ui-frontend", "streamlit/streamlit", "Build data and LLM apps in pure Python"],
  ["ui-frontend", "mckaywrigley/chatbot-ui", "Open-source ChatGPT-style UI"],

  // ---- resources ----
  ["resources", "f/awesome-chatgpt-prompts", "Curated collection of prompts"],
  ["resources", "e2b-dev/awesome-ai-agents", "Curated list of AI agents"],
  ["resources", "Shubhamsaboo/awesome-llm-apps", "Collection of runnable LLM app examples"],
  ["resources", "mlabonne/llm-course", "Hands-on course to learn LLMs"],
  ["resources", "anthropics/anthropic-cookbook", "Recipes for building with Claude"],
  ["resources", "anthropics/courses", "Educational courses from Anthropic"],
  ["resources", "openai/openai-cookbook", "Recipes for building with OpenAI"],
  ["resources", "microsoft/generative-ai-for-beginners", "12-lesson generative-AI course"],
  ["resources", "Hannibal046/Awesome-LLM", "Curated list of LLM papers and tools"],
];

const CATEGORY_META = {
  "agent-frameworks": { title: "Agent Frameworks", tr: "Ajan ve çok-ajanlı sistem kurmak için iskeletler", when_to_use: ["building an autonomous or multi-step agent", "orchestrating tools, memory and planning", "multi-agent collaboration"] },
  "mcp": { title: "Model Context Protocol (MCP)", tr: "Araçları ve veriyi LLM'e standart protokolle bağlama", when_to_use: ["connecting tools or data to an LLM over a standard protocol", "adding new capabilities to an MCP client (e.g. Claude)"] },
  "orchestration": { title: "LLM Orchestration & App Building", tr: "LLM uygulaması kurma, sağlayıcı yönlendirme, yapılandırılmış çıktı", when_to_use: ["routing between LLM providers", "forcing structured / validated output", "visual low-code app building", "testing prompts"] },
  "rag-retrieval": { title: "RAG & Retrieval", tr: "Özel belgeler üzerinde kaynağa dayalı yanıt (RAG)", when_to_use: ["answering questions over private documents", "grounding answers in sources to reduce hallucination"] },
  "vector-db": { title: "Vector Databases", tr: "Embedding saklama ve semantik arama", when_to_use: ["storing and searching embeddings", "semantic / similarity search", "powering a RAG backend"] },
  "memory": { title: "Agent Memory", tr: "Ajana oturumlar arası uzun süreli hafıza", when_to_use: ["giving an agent long-term memory", "remembering user facts across sessions"] },
  "web-search-scraping": { title: "Web Search & Scraping", tr: "Web'den güncel bilgi alma, tarama ve içerik çıkarma", when_to_use: ["getting current information from the web", "crawling sites and extracting clean content"] },
  "browser-automation": { title: "Browser Automation", tr: "Gerçek tarayıcıyı kontrol etme ve web otomasyonu", when_to_use: ["controlling a real browser", "automating web UI workflows, forms and clicks"] },
  "coding-agents": { title: "Coding Agents & Dev Tools", tr: "Kod yazan/düzenleyen ajanlar ve geliştirici araçları", when_to_use: ["writing or editing code autonomously", "fixing bugs or issues", "running generated code safely in a sandbox"] },
  "local-inference": { title: "Local LLM Inference & Serving", tr: "Modeli yerelde çalıştırma ve kendi API'ni sunma", when_to_use: ["running models locally or offline", "self-hosting an LLM API", "high-throughput serving"] },
  "fine-tuning": { title: "Fine-tuning & Training", tr: "Modeli kendi verinle eğitme / ince ayar", when_to_use: ["adapting a model to your own data", "LoRA / QLoRA training", "RLHF / DPO alignment"] },
  "observability-eval": { title: "Observability & Evaluation", tr: "İzleme, hata ayıklama ve kalite değerlendirme", when_to_use: ["tracing and debugging LLM calls", "measuring output quality", "testing prompts and RAG"] },
  "speech": { title: "Speech (STT / TTS)", tr: "Konuşma tanıma ve metinden sese", when_to_use: ["transcribing audio to text", "generating speech from text", "voice cloning"] },
  "vision-multimodal": { title: "Vision & Multimodal", tr: "Görüntü anlama, nesne tespiti ve çok-kipli modeller", when_to_use: ["detecting or segmenting objects in images", "image-text understanding", "visual OCR"] },
  "document-processing": { title: "Document Processing & OCR", tr: "Belge/PDF işleme ve OCR", when_to_use: ["extracting text and tables from PDFs", "converting files to Markdown/text for LLMs", "OCR of scanned documents"] },
  "ui-frontend": { title: "Chat UIs & App Frontends", tr: "Sohbet arayüzü ve uygulama ön yüzü", when_to_use: ["building a chat interface", "self-hosting a ChatGPT-like UI", "quick Python web apps"] },
  "resources": { title: "Learning & Curated Resources", tr: "Öğrenme kaynakları, örnekler ve derlemeler", when_to_use: ["learning how to build with LLMs", "finding example apps, prompts and cookbooks"] },
};

const CATEGORY_ORDER = Object.keys(CATEGORY_META);

function ghApi(slug) {
  return new Promise((resolve) => {
    exec(`gh api repos/${slug}`, { maxBuffer: 20 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) { resolve({ slug, ok: false, err: (stderr || String(err)).trim().slice(0, 160) }); return; }
      try { resolve({ slug, ok: true, data: JSON.parse(stdout) }); }
      catch (e) { resolve({ slug, ok: false, err: 'json-parse-failed' }); }
    });
  });
}

async function pool(items, concurrency, fn) {
  const results = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

(async () => {
  console.log(`Verifying ${CANDIDATES.length} repositories via GitHub API ...`);
  const raw = await pool(CANDIDATES, 8, async ([category, slug, use]) => {
    let r = await ghApi(slug);
    if (!r.ok) { r = await ghApi(slug); } // one retry
    return { category, slug, use, r };
  });

  const items = [];
  const missing = [];
  const seen = new Map(); // full_name(lower) -> true
  const usedIds = new Set();

  for (const { category, slug, use, r } of raw) {
    if (!r.ok || !r.data || !r.data.full_name) { missing.push({ slug, err: r.err || 'unknown' }); continue; }
    const d = r.data;
    const key = d.full_name.toLowerCase();
    if (seen.has(key)) continue;
    seen.set(key, true);

    let id = slugify(d.name);
    if (usedIds.has(id)) id = slugify(d.full_name);
    while (usedIds.has(id)) id = id + '-x';
    usedIds.add(id);

    const topics = Array.isArray(d.topics) ? d.topics.slice(0, 8) : [];
    const tags = Array.from(new Set([
      category,
      ...(d.language ? [String(d.language).toLowerCase()] : []),
      ...topics,
    ]));

    items.push({
      id,
      name: d.name,
      full_name: d.full_name,
      category,
      use,
      description: d.description || null,
      repo: d.html_url,
      homepage: d.homepage && d.homepage.trim() ? d.homepage.trim() : null,
      stars: d.stargazers_count,
      language: d.language || null,
      license: d.license && d.license.spdx_id && d.license.spdx_id !== 'NOASSERTION' ? d.license.spdx_id : (d.license ? d.license.key : null),
      topics,
      tags,
      archived: !!d.archived,
      last_push: d.pushed_at ? d.pushed_at.slice(0, 10) : null,
    });
  }

  // sort: by category order, then stars desc
  items.sort((a, b) => {
    const ca = CATEGORY_ORDER.indexOf(a.category), cb = CATEGORY_ORDER.indexOf(b.category);
    if (ca !== cb) return ca - cb;
    return (b.stars || 0) - (a.stars || 0);
  });

  const byCat = {};
  for (const it of items) (byCat[it.category] ||= []).push(it);

  const totalStars = items.reduce((s, it) => s + (it.stars || 0), 0);
  const categoriesSummary = CATEGORY_ORDER
    .filter((c) => byCat[c] && byCat[c].length)
    .map((c) => ({ id: c, title: CATEGORY_META[c].title, count: byCat[c].length }));

  // ---------- write files ----------
  fs.mkdirSync(path.join(OUT, 'skills'), { recursive: true });
  fs.mkdirSync(path.join(OUT, 'playbooks'), { recursive: true });
  fs.mkdirSync(path.join(OUT, 'scripts'), { recursive: true });

  const index = {
    name: REPO_NAME,
    description: 'A machine-readable database of proven open-source tools and capabilities for AI agents.',
    version: '1.0.0',
    generated_at: TODAY,
    source: 'GitHub REST API (stargazers_count fetched on generated_at date)',
    entry_point: `${RAW_BASE}/index.json`,
    agent_guide: `${RAW_BASE}/AGENT_GUIDE.md`,
    count: items.length,
    total_stars: totalStars,
    categories: categoriesSummary,
    items,
  };
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 2) + '\n');

  for (const c of CATEGORY_ORDER) {
    if (!byCat[c]) continue;
    const payload = {
      category: c,
      title: CATEGORY_META[c].title,
      when_to_use: CATEGORY_META[c].when_to_use,
      count: byCat[c].length,
      items: byCat[c],
    };
    fs.writeFileSync(path.join(OUT, 'skills', `${c}.json`), JSON.stringify(payload, null, 2) + '\n');
  }

  const schema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'yzdatabase entry',
    type: 'object',
    required: ['id', 'name', 'category', 'use', 'repo', 'stars'],
    properties: {
      id: { type: 'string', description: 'Unique slug for the entry' },
      name: { type: 'string' },
      full_name: { type: 'string', description: 'GitHub owner/repo' },
      category: { type: 'string', enum: CATEGORY_ORDER },
      use: { type: 'string', description: 'Short phrase: what job this is used for' },
      description: { type: ['string', 'null'], description: 'Upstream GitHub description' },
      repo: { type: 'string', format: 'uri' },
      homepage: { type: ['string', 'null'], format: 'uri' },
      stars: { type: 'integer', description: 'GitHub stargazers at generation time' },
      language: { type: ['string', 'null'] },
      license: { type: ['string', 'null'] },
      topics: { type: 'array', items: { type: 'string' } },
      tags: { type: 'array', items: { type: 'string' }, description: 'category + language + topics, for matching' },
      archived: { type: 'boolean' },
      last_push: { type: ['string', 'null'] },
    },
  };
  fs.writeFileSync(path.join(OUT, 'schema.json'), JSON.stringify(schema, null, 2) + '\n');

  // ---------- README ----------
  const catTable = categoriesSummary
    .map((c) => `| \`${c.id}\` | ${c.title} | ${c.count} | ${CATEGORY_META[c.id].tr} |`)
    .join('\n');

  const README = `# yzdatabase

> A machine-readable database of **proven, open-source tools and capabilities for AI agents**.
> Point a (even lightweight) agent at one JSON file and let it discover which tool fits the task.

![entries](https://img.shields.io/badge/entries-${items.length}-blue) ![categories](https://img.shields.io/badge/categories-${categoriesSummary.length}-green) ![license](https://img.shields.io/badge/license-MIT-lightgrey)

- **${items.length}** curated tools across **${categoriesSummary.length}** categories
- Every entry is **verified against the GitHub API** — real repo, real star count (fetched **${TODAY}**), real license
- Single entry point for agents: [\`index.json\`](./index.json)
- How an agent consumes this: **[AGENT_GUIDE.md](./AGENT_GUIDE.md)**

## 🇹🇷 Özet (Türkçe)

Bu depo, bir yapay zeka ajanının yeteneklerini artırmak için kullanabileceği **kanıtlanmış açık kaynak araçların kataloğudur**. Zayıf/ücretsiz bir ajan bile tek bir dosyayı (\`index.json\`) okuyarak "bu iş için hangi aracı kullanmalıyım?" sorusuna cevap bulabilir. Her kayıt GitHub API ile doğrulandı; yıldız sayıları **${TODAY}** tarihinde çekildi. Ajanın bunu nasıl kullanacağı **[AGENT_GUIDE.md](./AGENT_GUIDE.md)** dosyasında anlatılıyor. Hazır tarifler için **[playbooks/](./playbooks/)** klasörüne bak.

## How it's organized

\`\`\`
index.json          # All entries in one file — the entry point for agents
schema.json         # JSON schema for an entry
skills/<category>.json   # Entries split per category, each with "when_to_use"
playbooks/          # Step-by-step recipes for common tasks
AGENT_GUIDE.md      # The protocol an agent follows to use this database
\`\`\`

## Categories

| id | Category | Count | Açıklama (TR) |
|----|----------|-------|---------------|
${catTable}

## Quick start for an agent

\`\`\`bash
curl -s ${RAW_BASE}/index.json
\`\`\`

Then filter \`items[]\` by \`category\`, \`tags\`, \`use\` or \`description\` to find a capability, and open its \`repo\` for exact install and usage. See [AGENT_GUIDE.md](./AGENT_GUIDE.md).

## Data & accuracy

- Star counts are a **snapshot at ${TODAY}** and drift over time; treat them as a popularity signal, not a live value.
- Entries link to upstream projects; **each upstream project keeps its own license**. The \`license\` field reflects what GitHub reported at generation time.
- Regenerate the data anytime with [\`scripts/build.js\`](./scripts/build.js) (requires the \`gh\` CLI, authenticated).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). In short: add a \`[category, "owner/repo", "short use phrase"]\` line to the candidate list in \`scripts/build.js\` and re-run it, or open an issue.

## License

[MIT](./LICENSE) for the catalog/code in this repo. Listed tools are governed by their own upstream licenses.
`;
  fs.writeFileSync(path.join(OUT, 'README.md'), README);

  // ---------- AGENT_GUIDE ----------
  const AGENT_GUIDE = `# AGENT_GUIDE — How an AI agent uses yzdatabase

This database exists so an agent can **discover the right tool for a task at runtime**, instead of relying only on what it was trained on. It is designed to be usable even by small/cheap models: everything you need is in one JSON file.

## 1. The single entry point

Fetch this URL (no auth, public):

\`\`\`
${RAW_BASE}/index.json
\`\`\`

It returns an object:

\`\`\`jsonc
{
  "count": ${items.length},
  "categories": [ { "id": "web-search-scraping", "title": "...", "count": 8 }, ... ],
  "items": [
    {
      "id": "firecrawl",
      "name": "firecrawl",
      "category": "web-search-scraping",
      "use": "Crawl sites and convert to LLM-ready data",
      "description": "<upstream GitHub description>",
      "repo": "https://github.com/mendableai/firecrawl",
      "homepage": "https://...",
      "stars": 12345,
      "language": "TypeScript",
      "license": "AGPL-3.0",
      "tags": ["web-search-scraping","typescript","scraping","llm"]
    }
    // ...
  ]
}
\`\`\`

## 2. The selection algorithm (what the agent should do)

1. **Understand the task** the user asked for (e.g. "read this PDF", "search the web", "run a model offline").
2. **Match** the task to entries. Score each item by how well the task words match its \`category\`, \`use\`, \`tags\` and \`description\`.
3. **Rank** the top matches. Use \`stars\` as a tie-breaker / quality signal (higher = more battle-tested), and prefer entries whose \`category\` matches the task.
4. **Open the \`repo\`** (or \`homepage\`) of the chosen tool and read its README for the exact install command and API. Do **not** guess install commands.
5. For very common tasks, check **\`playbooks/\`** first — they give a ready sequence of tools and steps.

## 3. Narrowing by category

If you already know the kind of capability, fetch just that category file (smaller):

\`\`\`
${RAW_BASE}/skills/<category>.json
\`\`\`

Each category file includes a \`when_to_use\` array describing when that whole category applies. Available categories:

${categoriesSummary.map((c) => `- \`${c.id}\` — ${c.title}`).join('\n')}

## 4. Minimal code examples

**Node.js**
\`\`\`js
const res = await fetch("${RAW_BASE}/index.json");
const db = await res.json();
const task = "I need to extract text from a PDF";
const hit = db.items
  .map(it => ({ it, score: [it.category, it.use, (it.description||""), it.tags.join(" ")]
      .join(" ").toLowerCase().split(/\\W+/).filter(w => task.toLowerCase().includes(w)).length }))
  .sort((a,b) => b.score - a.score || b.it.stars - a.it.stars)[0];
console.log(hit.it.name, hit.it.repo);
\`\`\`

**Python**
\`\`\`python
import urllib.request, json
db = json.load(urllib.request.urlopen("${RAW_BASE}/index.json"))
task = "run a language model locally"
def score(it):
    hay = " ".join([it["category"], it["use"], it.get("description") or "", " ".join(it["tags"])]).lower()
    return sum(w in task.lower() for w in hay.split())
best = max(db["items"], key=lambda it: (score(it), it["stars"]))
print(best["name"], best["repo"])
\`\`\`

## 5. Safety

- This database only **points to** third-party code. Before installing or executing anything, review the upstream repo and its license.
- Treat any tool that executes code (sandboxes, coding agents, \`open-interpreter\`) with care and run it in an isolated environment.

## 6. Keeping it fresh

Star counts and availability change. Regenerate the dataset with [\`scripts/build.js\`](./scripts/build.js) using an authenticated \`gh\` CLI.
`;
  fs.writeFileSync(path.join(OUT, 'AGENT_GUIDE.md'), AGENT_GUIDE);

  // ---------- playbooks ----------
  const playbooks = {
    'web-research.md': `# Playbook: Answer a question that needs current web information

**When:** the user asks about recent events, prices, docs, or anything past your training cutoff.

**Tools (see index.json):** \`firecrawl\`, \`crawl4ai\`, \`searxng\` (self-hosted search), \`tavily-python\` (search API), \`reader\` (URL → text).

**Steps**
1. Get candidate URLs: use a search API (\`tavily-python\`) or a self-hosted \`searxng\` instance.
2. Fetch + clean page content into text/Markdown with \`firecrawl\`, \`crawl4ai\`, \`trafilatura\`, or Jina \`reader\`.
3. Pass the cleaned text to your model as context and answer **with citations** (the source URLs).
4. If a page needs login or clicks, escalate to the **browser-automation** playbook.
`,
    'chat-with-documents-rag.md': `# Playbook: Answer questions over private documents (RAG)

**When:** the user wants answers grounded in their own files/knowledge base.

**Tools:** framework \`llama_index\` or \`haystack\`; vector store \`chroma\` / \`qdrant\`; parsing \`unstructured\`.

**Steps**
1. **Parse** documents to text (\`unstructured\`, or the document-processing playbook for PDFs).
2. **Chunk** the text (e.g. ~500–1000 tokens with overlap).
3. **Embed** chunks and store them in a vector DB (\`chroma\` is the simplest to start: \`pip install chromadb\`).
4. At query time, embed the question, **retrieve** the top-k chunks, and put them in the prompt.
5. Answer using only retrieved context; cite the chunks. Evaluate with \`ragas\` if quality matters.
`,
    'run-model-locally.md': `# Playbook: Run an LLM locally / offline

**When:** no internet, privacy requirements, or to avoid API cost.

**Tools:** \`ollama\` (easiest), \`llama.cpp\` (low-level), \`vllm\` (high-throughput server), \`jan\`/\`gpt4all\` (desktop GUI).

**Steps (Ollama)**
1. Install Ollama from https://ollama.com .
2. Pull and run a model: \`ollama run llama3.1\` (or \`qwen2.5\`, \`mistral\`, etc.).
3. Call its local OpenAI-compatible API at \`http://localhost:11434\`.
4. Need more throughput or GPU batching? Switch to \`vllm\`. Need a single portable file? Use \`llamafile\`.
`,
    'process-pdf.md': `# Playbook: Extract text/tables from a PDF or document

**When:** the user gives a PDF/office file and wants its content.

**Tools:** \`PyMuPDF\` (fast text/images), \`pdfplumber\` (tables), \`markitdown\` (file → Markdown), \`unstructured\` (many formats), OCR: \`PaddleOCR\` / \`tesseract\`.

**Steps**
1. Digital PDF with selectable text → \`PyMuPDF\` (\`pip install pymupdf\`) or \`pdfplumber\` for tables.
2. Mixed office files (docx, pptx, html) → \`markitdown\` or \`unstructured\` to normalize to Markdown/text.
3. Scanned images / no text layer → OCR with \`PaddleOCR\` or \`tesseract\` first, then step 1.
4. Feed the extracted text to your model, or index it with the RAG playbook.
`,
    'transcribe-audio.md': `# Playbook: Transcribe audio to text (and the reverse)

**When:** the user gives audio/video and wants a transcript, or wants text spoken.

**Tools:** STT \`faster-whisper\` (fast) / \`whisper\` / \`whisperX\` (word timestamps); TTS \`coqui TTS\` / \`OpenVoice\`.

**Steps (speech-to-text)**
1. \`pip install faster-whisper\`.
2. Transcribe: load a model size (\`base\`/\`small\`/\`medium\`) and run it on the audio file.
3. Need per-word timestamps or speaker labels? Use \`whisperX\`.

**Text-to-speech:** use \`coqui TTS\` or \`OpenVoice\` (voice cloning).
`,
    'browser-automation.md': `# Playbook: Automate a real browser / do actions on a website

**When:** the task needs logging in, clicking, filling forms, or scraping JS-heavy sites.

**Tools:** \`browser-use\` (LLM-driven), \`skyvern\` (LLM + vision), \`playwright\` / \`puppeteer\` (deterministic scripts).

**Steps**
1. Deterministic, known flow → write a \`playwright\` script (\`pip install playwright\` / \`npm i playwright\`).
2. Natural-language, adaptive flow → \`browser-use\` lets the LLM decide clicks from the page state.
3. Always run in a controlled profile; never enter real credentials into untrusted automation.
`,
  };
  for (const [fn, content] of Object.entries(playbooks)) {
    fs.writeFileSync(path.join(OUT, 'playbooks', fn), content);
  }
  const playbookIndex = `# Playbooks

Ready-to-follow recipes that combine tools from this database for common tasks.

${Object.keys(playbooks).map((fn) => `- [${fn.replace('.md', '')}](./${fn})`).join('\n')}
`;
  fs.writeFileSync(path.join(OUT, 'playbooks', 'README.md'), playbookIndex);

  // ---------- LICENSE / CONTRIBUTING / gitignore ----------
  fs.writeFileSync(path.join(OUT, 'LICENSE'), `MIT License

Copyright (c) ${new Date().getFullYear()} ${OWNER_ACCOUNT}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`);

  fs.writeFileSync(path.join(OUT, 'CONTRIBUTING.md'), `# Contributing to yzdatabase

Thanks for helping keep this catalog useful and accurate.

## Add or update a tool

1. Open \`scripts/build.js\`.
2. Add a line to the \`CANDIDATES\` array: \`["<category>", "owner/repo", "short use phrase"]\`.
   - \`<category>\` must be one of the keys in \`CATEGORY_META\`.
   - Keep the use phrase short and task-oriented ("what job is this for").
3. Re-run \`node scripts/build.js\` (needs an authenticated \`gh\` CLI). This refetches stars/description and regenerates \`index.json\`, the \`skills/\` files and the README table.
4. Open a pull request.

## Inclusion criteria

- **Open source** with a real, resolvable GitHub repo.
- **Proven**: meaningful adoption (stars), recent activity, and relevance to building/running AI agents.
- No dead or archived-and-abandoned projects.

## Adding a category

Add an entry to \`CATEGORY_META\` in \`scripts/build.js\` (with \`title\`, Turkish \`tr\` description, and \`when_to_use\`), then categorize entries into it.
`);

  fs.writeFileSync(path.join(OUT, '.gitignore'), `node_modules/
*.log
.DS_Store
`);

  // copy this script into the repo for reproducibility
  try { fs.copyFileSync(__filename, path.join(OUT, 'scripts', 'build.js')); } catch (e) {}

  // ---------- report (for the human) ----------
  let report = `# yzdatabase — generation report (${TODAY})\n\n`;
  report += `Total entries: **${items.length}** · Total stars: **${totalStars.toLocaleString('en-US')}** · Categories: **${categoriesSummary.length}**\n\n`;
  if (missing.length) {
    report += `Dropped (not found / error): ${missing.map((m) => '`' + m.slug + '`').join(', ')}\n\n`;
  }
  for (const c of CATEGORY_ORDER) {
    if (!byCat[c]) continue;
    report += `## ${CATEGORY_META[c].title} (${byCat[c].length})\n\n`;
    for (const it of byCat[c]) {
      report += `- **${it.name}** — ⭐ ${it.stars.toLocaleString('en-US')} — ${it.use} — ${it.repo}\n`;
    }
    report += `\n`;
  }
  fs.writeFileSync(path.join(OUT, 'scratch-report.md'), report);

  // machine summary for the orchestrator
  const summary = {
    count: items.length,
    total_stars: totalStars,
    categories: categoriesSummary,
    missing,
    top10: [...items].sort((a, b) => b.stars - a.stars).slice(0, 10).map((it) => ({ name: it.name, stars: it.stars, repo: it.repo })),
  };
  console.log('SUMMARY_JSON_START');
  console.log(JSON.stringify(summary, null, 2));
  console.log('SUMMARY_JSON_END');
  console.log(`Done. ${items.length} entries, ${missing.length} dropped.`);
})();
