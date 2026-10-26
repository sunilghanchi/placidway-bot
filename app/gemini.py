import json
from typing import Any

import httpx

from .config import settings


class GeminiError(RuntimeError):
    pass


class GeminiClient:
    def __init__(self) -> None:
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"

    @property
    def configured(self) -> bool:
        return bool(settings.gemini_api_key)

    async def _post(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        if not self.configured:
            raise GeminiError("GEMINI_API_KEY is not configured")
        async with httpx.AsyncClient(timeout=45) as client:
            response = await client.post(
                f"{self.base_url}/{path}",
                headers={"x-goog-api-key": settings.gemini_api_key, "content-type": "application/json"},
                json=payload,
            )
        if response.status_code >= 400:
            detail = response.text[:500]
            raise GeminiError(f"Gemini API returned {response.status_code}: {detail}")
        return response.json()

    async def embed(self, text: str, task_type: str, title: str | None = None) -> list[float]:
        payload: dict[str, Any] = {
            "model": f"models/{settings.embedding_model}",
            "content": {"parts": [{"text": text}]},
            "taskType": task_type,
            "outputDimensionality": settings.embedding_dimensions,
        }
        if title and task_type == "RETRIEVAL_DOCUMENT":
            payload["title"] = title
        data = await self._post(f"models/{settings.embedding_model}:embedContent", payload)
        values = data.get("embedding", {}).get("values")
        if not values:
            raise GeminiError("Gemini embedding response did not contain values")
        return values

    async def generate(self, system: str, prompt: str) -> dict[str, Any]:
        payload = {
            "systemInstruction": {"parts": [{"text": system}]},
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.1,
                "topP": 0.8,
                "maxOutputTokens": 650,
                "responseMimeType": "application/json",
            },
        }
        data = await self._post(f"models/{settings.llm_model}:generateContent", payload)
        try:
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(text)
        except (KeyError, IndexError, json.JSONDecodeError) as exc:
            raise GeminiError("Gemini generation response was not valid JSON") from exc


gemini = GeminiClient()
