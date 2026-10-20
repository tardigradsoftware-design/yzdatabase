# AGENT_GUIDE — How an AI agent uses yzdatabase

This database exists so an agent can **discover the right tool for a task at runtime**, instead of relying only on what it was trained on. It is designed to be usable even by small/cheap models: everything you need is in one JSON file.

## 1. The single entry point

Fetch this URL (no auth, public):

```
https://raw.githubusercontent.com/tardigradsoftware-design/yzdatabase/main/index.json
```

It returns an object:

```jsonc
{
  "count": 138,
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
```

## 2. The selection algorithm (what the agent should do)

1. **Understand the task** the user asked for (e.g. "read this PDF", "search the web", "run a model offline").
2. **Match** the task to entries. Score each item by how well the task words match its `category`, `use`, `tags` and `description`.
3. **Rank** the top matches. Use `stars` as a tie-breaker / quality signal (higher = more battle-tested), and prefer entries whose `category` matches the task.
4. **Open the `repo`** (or `homepage`) of the chosen tool and read its README for the exact install command and API. Do **not** guess install commands.
5. For very common tasks, check **`playbooks/`** first — they give a ready sequence of tools and steps.

## 3. Narrowing by category

If you already know the kind of capability, fetch just that category file (smaller):

```
https://raw.githubusercontent.com/tardigradsoftware-design/yzdatabase/main/skills/<category>.json
```

Each category file includes a `when_to_use` array describing when that whole category applies. Available categories:

- `agent-frameworks` — Agent Frameworks
- `mcp` — Model Context Protocol (MCP)
- `orchestration` — LLM Orchestration & App Building
- `rag-retrieval` — RAG & Retrieval
- `vector-db` — Vector Databases
- `memory` — Agent Memory
- `web-search-scraping` — Web Search & Scraping
- `browser-automation` — Browser Automation
- `coding-agents` — Coding Agents & Dev Tools
- `local-inference` — Local LLM Inference & Serving
- `fine-tuning` — Fine-tuning & Training
- `observability-eval` — Observability & Evaluation
- `speech` — Speech (STT / TTS)
- `vision-multimodal` — Vision & Multimodal
- `document-processing` — Document Processing & OCR
- `ui-frontend` — Chat UIs & App Frontends
- `resources` — Learning & Curated Resources

## 4. Minimal code examples

**Node.js**
```js
const res = await fetch("https://raw.githubusercontent.com/tardigradsoftware-design/yzdatabase/main/index.json");
const db = await res.json();
const task = "I need to extract text from a PDF";
const hit = db.items
  .map(it => ({ it, score: [it.category, it.use, (it.description||""), it.tags.join(" ")]
      .join(" ").toLowerCase().split(/\W+/).filter(w => task.toLowerCase().includes(w)).length }))
  .sort((a,b) => b.score - a.score || b.it.stars - a.it.stars)[0];
console.log(hit.it.name, hit.it.repo);
```

**Python**
```python
import urllib.request, json
db = json.load(urllib.request.urlopen("https://raw.githubusercontent.com/tardigradsoftware-design/yzdatabase/main/index.json"))
task = "run a language model locally"
def score(it):
    hay = " ".join([it["category"], it["use"], it.get("description") or "", " ".join(it["tags"])]).lower()
    return sum(w in task.lower() for w in hay.split())
best = max(db["items"], key=lambda it: (score(it), it["stars"]))
print(best["name"], best["repo"])
```

## 5. Safety

- This database only **points to** third-party code. Before installing or executing anything, review the upstream repo and its license.
- Treat any tool that executes code (sandboxes, coding agents, `open-interpreter`) with care and run it in an isolated environment.

## 6. Keeping it fresh

Star counts and availability change. Regenerate the dataset with [`scripts/build.js`](./scripts/build.js) using an authenticated `gh` CLI.
