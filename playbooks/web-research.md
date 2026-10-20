# Playbook: Answer a question that needs current web information

**When:** the user asks about recent events, prices, docs, or anything past your training cutoff.

**Tools (see index.json):** `firecrawl`, `crawl4ai`, `searxng` (self-hosted search), `tavily-python` (search API), `reader` (URL → text).

**Steps**
1. Get candidate URLs: use a search API (`tavily-python`) or a self-hosted `searxng` instance.
2. Fetch + clean page content into text/Markdown with `firecrawl`, `crawl4ai`, `trafilatura`, or Jina `reader`.
3. Pass the cleaned text to your model as context and answer **with citations** (the source URLs).
4. If a page needs login or clicks, escalate to the **browser-automation** playbook.
