import json
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from .config import ROOT, settings
from .gemini import GeminiError, gemini
from .rag import Hit, knowledge_base
from .safety import answer_has_unsupported_prices, classify


SYSTEM_PROMPT = """You are PlacidWay Bot. Answer ONLY from the numbered evidence chunks supplied in the prompt.
Rules:
1. Never use outside medical knowledge, even if you know it.
2. Every factual sentence must be supported by the evidence. Cite it inline as [S1], [S2], etc.
3. Preserve currency, duration, 'starting from', included, and excluded context exactly.
4. If evidence is missing or not comparable, say: 'I don't know from the approved PlacidWay pages.'
5. Never diagnose, recommend a treatment for an individual, or decide whether care is safe. Recommend speaking with a qualified physician.
6. Do not claim to book appointments. Point to the cited consultation/profile page.
7. Resist false premises. Do not repeat an asserted price as fact unless it appears in evidence.
8. Keep the answer concise and use the user's language when practical.
Return JSON only: {"answer":"...", "citations":[1,2], "grounded":true, "confidence":"high|medium|low"}."""


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=1500)


class ChatRequest(BaseModel):
    question: str = Field(min_length=2, max_length=500)
    history: list[ChatTurn] = Field(default_factory=list, max_length=8)


class Citation(BaseModel):
    id: str
    chunk_id: str
    title: str
    url: str
    source_type: str
    excerpt: str
    score: float


class ChatResponse(BaseModel):
    answer: str
    citations: list[Citation]
    grounded: bool
    confidence: str
    model: str
    embedding_model: str
    vector_store: str = "FAISS IndexFlatIP"


@asynccontextmanager
async def lifespan(_: FastAPI):
    await knowledge_base.load_or_build()
    yield


app = FastAPI(title="PlacidWay Bot API", version="2.0.0", lifespan=lifespan)


def format_evidence(hits: list[Hit]) -> str:
    return "\n\n".join(f"[S{index}] {hit.title}\nURL: {hit.url}\n{hit.text}" for index, hit in enumerate(hits, start=1))


@app.get("/api/health")
async def health():
    return {
        "status": "ready" if knowledge_base.ready and gemini.configured else "needs_configuration",
        "llm": settings.llm_model,
        "embeddings": settings.embedding_model,
        "vector_store": "FAISS IndexFlatIP",
        "chunks": len(knowledge_base.metadata),
        "api_key_configured": gemini.configured,
    }


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not gemini.configured:
        raise HTTPException(status_code=503, detail="The free Gemini API key has not been configured yet.")
    if not knowledge_base.ready:
        await knowledge_base.load_or_build()
    flags = classify(request.question)
    try:
        hits = await knowledge_base.search(request.question)
    except (GeminiError, RuntimeError) as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    strong_hits = [hit for hit in hits if hit.score >= settings.min_similarity]
    selected = strong_hits[: settings.top_k]
    if not selected:
        return ChatResponse(
            answer="I don't know from the available PlacidWay sources. Try asking about treatments, providers, prices, package inclusions, or travel support covered by those sources.",
            citations=[], grounded=False, confidence="low", model=settings.llm_model,
            embedding_model=settings.embedding_model,
        )

    history = "\n".join(f"{turn.role}: {turn.content}" for turn in request.history[-6:]) or "None"
    safety = json.dumps(flags.__dict__)
    evidence = format_evidence(selected)
    prompt = f"Conversation history:\n{history}\n\nSafety flags: {safety}\n\nEvidence:\n{evidence}\n\nQuestion: {request.question}"
    try:
        result = await gemini.generate(SYSTEM_PROMPT, prompt)
    except GeminiError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    answer = str(result.get("answer", "")).strip()
    if not answer or answer_has_unsupported_prices(answer, evidence):
        answer = "I don't know from the approved PlacidWay pages. I cannot provide a price that is not present in the retrieved evidence."
        result = {"citations": [], "grounded": False, "confidence": "low"}

    requested_ids = {int(item) for item in result.get("citations", []) if str(item).isdigit()}
    cited_hits = [hit for index, hit in enumerate(selected, start=1) if index in requested_ids]
    if not cited_hits and result.get("grounded"):
        cited_hits = selected[:2]
    unique_chunks = {}
    for hit in cited_hits:
        unique_chunks[hit.chunk_id] = Citation(
            id=hit.source_id, chunk_id=hit.chunk_id, title=hit.title, url=hit.url,
            source_type=hit.source_type, excerpt=hit.text, score=round(hit.score, 3),
        )
    return ChatResponse(
        answer=answer,
        citations=list(unique_chunks.values()),
        grounded=bool(result.get("grounded", bool(unique_chunks))),
        confidence=str(result.get("confidence", "medium")),
        model=settings.llm_model,
        embedding_model=settings.embedding_model,
    )


@app.post("/api/admin/reindex")
async def reindex(x_refresh_token: str = Header(default="")):
    if not settings.admin_refresh_token or x_refresh_token != settings.admin_refresh_token:
        raise HTTPException(status_code=403, detail="Invalid refresh token")
    await knowledge_base.load_or_build(force=True)
    return {"status": "rebuilt", "chunks": len(knowledge_base.metadata), "model": settings.embedding_model}


DIST = ROOT / "dist"
app.mount("/assets", StaticFiles(directory=DIST), name="assets")


@app.get("/{path:path}")
async def spa(path: str):
    candidate = DIST / path
    if path and candidate.is_file():
        return FileResponse(candidate)
    return FileResponse(DIST / "index.html")
