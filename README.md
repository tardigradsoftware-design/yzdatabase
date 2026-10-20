# yzdatabase

> A machine-readable database of **proven, open-source tools and capabilities for AI agents**.
> Point a (even lightweight) agent at one JSON file and let it discover which tool fits the task.

![entries](https://img.shields.io/badge/entries-138-blue) ![categories](https://img.shields.io/badge/categories-17-green) ![license](https://img.shields.io/badge/license-MIT-lightgrey)

- **138** curated tools across **17** categories
- Every entry is **verified against the GitHub API** — real repo, real star count (fetched **2026-10-20**), real license
- Single entry point for agents: [`index.json`](./index.json)
- How an agent consumes this: **[AGENT_GUIDE.md](./AGENT_GUIDE.md)**

## 🇹🇷 Özet (Türkçe)

Bu depo, bir yapay zeka ajanının yeteneklerini artırmak için kullanabileceği **kanıtlanmış açık kaynak araçların kataloğudur**. Zayıf/ücretsiz bir ajan bile tek bir dosyayı (`index.json`) okuyarak "bu iş için hangi aracı kullanmalıyım?" sorusuna cevap bulabilir. Her kayıt GitHub API ile doğrulandı; yıldız sayıları **2026-10-20** tarihinde çekildi. Ajanın bunu nasıl kullanacağı **[AGENT_GUIDE.md](./AGENT_GUIDE.md)** dosyasında anlatılıyor. Hazır tarifler için **[playbooks/](./playbooks/)** klasörüne bak.

## How it's organized

```
index.json          # All entries in one file — the entry point for agents
schema.json         # JSON schema for an entry
skills/<category>.json   # Entries split per category, each with "when_to_use"
playbooks/          # Step-by-step recipes for common tasks
AGENT_GUIDE.md      # The protocol an agent follows to use this database
```

## Categories

| id | Category | Count | Açıklama (TR) |
|----|----------|-------|---------------|
| `agent-frameworks` | Agent Frameworks | 21 | Ajan ve çok-ajanlı sistem kurmak için iskeletler |
| `mcp` | Model Context Protocol (MCP) | 6 | Araçları ve veriyi LLM'e standart protokolle bağlama |
| `orchestration` | LLM Orchestration & App Building | 12 | LLM uygulaması kurma, sağlayıcı yönlendirme, yapılandırılmış çıktı |
| `rag-retrieval` | RAG & Retrieval | 7 | Özel belgeler üzerinde kaynağa dayalı yanıt (RAG) |
| `vector-db` | Vector Databases | 8 | Embedding saklama ve semantik arama |
| `memory` | Agent Memory | 2 | Ajana oturumlar arası uzun süreli hafıza |
| `web-search-scraping` | Web Search & Scraping | 8 | Web'den güncel bilgi alma, tarama ve içerik çıkarma |
| `browser-automation` | Browser Automation | 4 | Gerçek tarayıcıyı kontrol etme ve web otomasyonu |
| `coding-agents` | Coding Agents & Dev Tools | 9 | Kod yazan/düzenleyen ajanlar ve geliştirici araçları |
| `local-inference` | Local LLM Inference & Serving | 10 | Modeli yerelde çalıştırma ve kendi API'ni sunma |
| `fine-tuning` | Fine-tuning & Training | 7 | Modeli kendi verinle eğitme / ince ayar |
| `observability-eval` | Observability & Evaluation | 7 | İzleme, hata ayıklama ve kalite değerlendirme |
| `speech` | Speech (STT / TTS) | 7 | Konuşma tanıma ve metinden sese |
| `vision-multimodal` | Vision & Multimodal | 6 | Görüntü anlama, nesne tespiti ve çok-kipli modeller |
| `document-processing` | Document Processing & OCR | 8 | Belge/PDF işleme ve OCR |
| `ui-frontend` | Chat UIs & App Frontends | 7 | Sohbet arayüzü ve uygulama ön yüzü |
| `resources` | Learning & Curated Resources | 9 | Öğrenme kaynakları, örnekler ve derlemeler |

## Quick start for an agent

```bash
curl -s https://raw.githubusercontent.com/tardigradsoftware-design/yzdatabase/main/index.json
```

Then filter `items[]` by `category`, `tags`, `use` or `description` to find a capability, and open its `repo` for exact install and usage. See [AGENT_GUIDE.md](./AGENT_GUIDE.md).

## Data & accuracy

- Star counts are a **snapshot at 2026-10-20** and drift over time; treat them as a popularity signal, not a live value.
- Entries link to upstream projects; **each upstream project keeps its own license**. The `license` field reflects what GitHub reported at generation time.
- Regenerate the data anytime with [`scripts/build.js`](./scripts/build.js) (requires the `gh` CLI, authenticated).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). In short: add a `[category, "owner/repo", "short use phrase"]` line to the candidate list in `scripts/build.js` and re-run it, or open an issue.

## License

[MIT](./LICENSE) for the catalog/code in this repo. Listed tools are governed by their own upstream licenses.
