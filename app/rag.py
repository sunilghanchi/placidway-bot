import asyncio
import hashlib
import json
from dataclasses import dataclass
from pathlib import Path

import faiss
import numpy as np

from .config import settings
from .gemini import gemini


@dataclass
class Hit:
    chunk_id: str
    source_id: str
    title: str
    url: str
    source_type: str
    text: str
    score: float


class FaissKnowledgeBase:
    def __init__(self) -> None:
        self.index: faiss.IndexFlatIP | None = None
        self.metadata: list[dict] = []
        self.digest = ""
        self._lock = asyncio.Lock()

    def _read_chunks(self) -> tuple[list[dict], str]:
        raw = settings.knowledge_path.read_bytes()
        knowledge = json.loads(raw)
        chunks = []
        for source in knowledge["sources"]:
            for number, fact in enumerate(source["facts"], start=1):
                chunks.append({
                    "chunk_id": f"{source['id']}:{number}",
                    "source_id": source["id"],
                    "title": source["title"],
                    "url": source["url"],
                    "source_type": source["type"],
                    "text": fact,
                })
        return chunks, hashlib.sha256(raw).hexdigest()

    async def load_or_build(self, force: bool = False) -> None:
        async with self._lock:
            chunks, digest = self._read_chunks()
            if not force and settings.index_path.exists() and settings.metadata_path.exists():
                stored = json.loads(settings.metadata_path.read_text())
                if stored.get("digest") == digest and stored.get("model") == settings.embedding_model:
                    self.index = faiss.read_index(str(settings.index_path))
                    self.metadata = stored["chunks"]
                    self.digest = digest
                    return
            if not gemini.configured:
                self.metadata = chunks
                self.digest = digest
                return
            vectors = []
            for chunk in chunks:
                vector = await gemini.embed(
                    chunk["text"],
                    task_type="RETRIEVAL_DOCUMENT",
                    title=chunk["title"],
                )
                vectors.append(vector)
            matrix = np.asarray(vectors, dtype="float32")
            faiss.normalize_L2(matrix)
            self.index = faiss.IndexFlatIP(matrix.shape[1])
            self.index.add(matrix)
            self.metadata = chunks
            self.digest = digest
            settings.index_path.parent.mkdir(parents=True, exist_ok=True)
            faiss.write_index(self.index, str(settings.index_path))
            settings.metadata_path.write_text(json.dumps({
                "digest": digest,
                "model": settings.embedding_model,
                "dimensions": settings.embedding_dimensions,
                "chunks": chunks,
            }, indent=2))

    @property
    def ready(self) -> bool:
        return self.index is not None and bool(self.metadata)

    async def search(self, query: str, k: int | None = None) -> list[Hit]:
        if not self.ready:
            raise RuntimeError("FAISS index is not ready")
        vector = np.asarray([await gemini.embed(query, task_type="QUESTION_ANSWERING")], dtype="float32")
        faiss.normalize_L2(vector)
        scores, ids = self.index.search(vector, min(k or settings.top_k, len(self.metadata)))
        hits = []
        for score, row_id in zip(scores[0], ids[0]):
            if row_id < 0:
                continue
            item = self.metadata[int(row_id)]
            hits.append(Hit(**item, score=float(score)))
        return hits


knowledge_base = FaissKnowledgeBase()
