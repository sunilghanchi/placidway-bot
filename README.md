---
title: PlacidWay Bot
emoji: 🧭
colorFrom: teal
colorTo: blue
sdk: docker
app_port: 7860
---

# PlacidWay Bot

A full-stack retrieval-augmented generation chatbot for the AI Automation Engineer assessment. It uses only the seven approved PlacidWay pages and returns source-linked answers from a FAISS vector index.

## Free-tier stack

| Layer | Choice | Cost rationale |
|---|---|---|
| LLM | `gemini-3.5-flash-lite` | Google Gemini API free tier |
| Embeddings | `gemini-embedding-2`, 768 dimensions | Gemini API text embeddings are available on the free tier |
| Vector store | FAISS `IndexFlatIP` | Open-source, local, no hosted database charge |
| Backend | Python 3.12 + FastAPI | Open source |
| Frontend | HTML, CSS, vanilla JavaScript | Buildless single-page UI |

The browser never receives the Gemini key. All embedding, retrieval, prompt construction, LLM calls, and response validation run on the backend.

## Architecture

```text
Browser SPA
   │ POST /api/chat
   ▼
FastAPI safety classifier
   │
   ├── Gemini Embedding 2: query embedding
   ▼
FAISS IndexFlatIP: top-k cosine search
   │
   ▼
Evidence-only prompt + recent chat history
   │
   ├── Gemini 3.5 Flash-Lite: JSON answer + source IDs
   ▼
Post-generation price validator
   │
   ▼
Answer + clickable PlacidWay citations
```

## Grounding and safety

- The ingestion allowlist contains exactly the seven supplied URLs.
- Each source fact is a separate retrieval chunk with URL, title, type, and source ID metadata.
- Corpus chunks use `RETRIEVAL_DOCUMENT`; user questions use `QUESTION_ANSWERING` embeddings.
- FAISS uses normalized vectors and inner-product search, equivalent to cosine similarity.
- The prompt forbids outside knowledge and requires inline source IDs.
- A deterministic post-validator blocks any price not present in the retrieved context.
- Medical advice, booking requests, out-of-scope questions, and asserted prices are flagged before generation.
- Low-similarity retrieval returns an honest “I don’t know” without calling the LLM.

## Local setup

1. Create a free Google AI Studio API key: `https://aistudio.google.com/app/apikey`.
2. Create and activate a virtual environment.
3. Install dependencies and configure the environment:

```bash
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

4. Put the free key in `.env` as `GEMINI_API_KEY`.
5. Run:

```bash
uvicorn app.main:app --reload --port 4173
```

Open `http://localhost:4173`. On first startup, the backend embeds the 32 curated chunks and persists `storage/knowledge.faiss` plus digest-checked metadata. Later starts load the saved index.

## Free public deployment

The repository includes a Dockerfile compatible with a free CPU Hugging Face Space. Create a Docker Space, add `GEMINI_API_KEY` and `ADMIN_REFRESH_TOKEN` as Space secrets, and push this repository. The API key remains server-side.

## API

- `GET /api/health` — model, embedding, FAISS, chunk, and configuration status
- `POST /api/chat` — grounded RAG chat with recent history
- `POST /api/admin/reindex` — rebuilds the FAISS index; requires `X-Refresh-Token`

## Refreshing website content

Run `node scripts/ingest.mjs` to politely fetch only the allowlisted pages with a clear User-Agent and 1.1-second spacing. Review the extracted diff, update `data/knowledge.json`, then call the protected reindex endpoint or restart after deleting the stale index. The corpus SHA-256 digest prevents an old index from being loaded with new text.

Human review is intentional for medical and price content: arbitrary navigation text must not silently become patient-facing evidence.

## Known limitations

- The free Gemini tier has rate limits and may use submitted content to improve Google products under its free-tier terms.
- FAISS is local to one backend instance; a multi-instance production deployment would need shared index distribution.
- Curated facts require review after source-page changes.
- Browser-local unanswered logs are not aggregated across reviewers.

With another week, I would add automated HTML extraction diffs, multilingual evaluation, a reranker, prompt-injection tests, encrypted centralized gap logging, and a scheduled reindex job. The deterministic price and medical-safety validators would remain in front of and behind the LLM.
