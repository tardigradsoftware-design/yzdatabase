# Playbook: Run an LLM locally / offline

**When:** no internet, privacy requirements, or to avoid API cost.

**Tools:** `ollama` (easiest), `llama.cpp` (low-level), `vllm` (high-throughput server), `jan`/`gpt4all` (desktop GUI).

**Steps (Ollama)**
1. Install Ollama from https://ollama.com .
2. Pull and run a model: `ollama run llama3.1` (or `qwen2.5`, `mistral`, etc.).
3. Call its local OpenAI-compatible API at `http://localhost:11434`.
4. Need more throughput or GPU batching? Switch to `vllm`. Need a single portable file? Use `llamafile`.
