# PlacidWay Grounded Care Guide

A small, deterministic chatbot for the AI Automation Engineer assessment. It answers only from the seven supplied PlacidWay pages and always shows the evidence used.

## Why this approach

I chose a buildless HTML/CSS/JavaScript application with deterministic retrieval instead of a hosted LLM. The assessment prioritizes accuracy and honesty. For this narrow corpus, explicit intent guards plus weighted keyword retrieval are easier to inspect, cheaper to run, and less likely to invent a price or medical fact.

## Architecture

1. **Allowlisted ingestion** — `scripts/ingest.mjs` fetches only the seven approved URLs, identifies itself with a clear User-Agent, and waits 1.1 seconds between requests.
2. **Curated knowledge** — `data/knowledge.json` contains concise facts with source identities. It is copied to `dist/knowledge.json` for deployment.
3. **Safety router** — `dist/app.js` handles medical-advice requests, booking requests, wrong-price premises, and out-of-scope questions before retrieval.
4. **Deterministic retrieval** — direct intent rules answer high-risk price and package questions; a weighted keyword fallback searches only the approved records.
5. **Evidence UI** — every grounded answer includes clickable citations and mirrors its sources in the evidence rail.
6. **Local gap logging** — unanswered questions are stored in browser `localStorage` and can be downloaded. No personal data is sent.

## Run locally

Serve the repository root with any static server, for example:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080/dist/`.

## Refresh the content

Run `npm run ingest` to fetch a fresh raw snapshot. Review changes, update the curated facts in `data/knowledge.json`, copy it to `dist/knowledge.json`, run `npm run check`, and redeploy. This review step is intentional: it prevents navigation text or malformed page content from silently changing medical or price answers.

## Grounding policy

- Use no pages beyond the supplied allowlist.
- Attach at least one source to every factual answer.
- Preserve currency, duration, and inclusion/exclusion context.
- Refuse diagnosis and individualized safety recommendations.
- Correct unsupported premises instead of agreeing with them.
- Say "I don't know" when evidence is missing.

## Known limitations

- The app is deterministic rather than generative, so phrasing coverage is narrower than an LLM-based RAG system.
- Translation and multi-turn context are limited to lightweight topic carry-over.
- Refresh requires curator review and redeployment; the live browser button reloads the deployed snapshot but does not crawl PlacidWay.
- Unanswered logs are per browser and are not centrally aggregated.

With another week, I would add a server-side HTML extractor with snapshot diffs, schema validation for price facts, a multilingual embedding retriever, automated adversarial tests, and privacy-reviewed aggregate gap logging. I would still keep the current deterministic safety router in front of any LLM.
