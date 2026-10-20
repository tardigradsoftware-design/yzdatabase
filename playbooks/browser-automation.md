# Playbook: Automate a real browser / do actions on a website

**When:** the task needs logging in, clicking, filling forms, or scraping JS-heavy sites.

**Tools:** `browser-use` (LLM-driven), `skyvern` (LLM + vision), `playwright` / `puppeteer` (deterministic scripts).

**Steps**
1. Deterministic, known flow → write a `playwright` script (`pip install playwright` / `npm i playwright`).
2. Natural-language, adaptive flow → `browser-use` lets the LLM decide clicks from the page state.
3. Always run in a controlled profile; never enter real credentials into untrusted automation.
