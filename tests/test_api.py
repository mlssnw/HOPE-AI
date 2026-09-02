from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from backend.main import create_app
from backend.models import ChatResponse, HealthResponse, ServiceStatus, Source


class FakeServices:
    async def health(self) -> HealthResponse:
        return HealthResponse(
            claude=ServiceStatus(configured=True), tavily=ServiceStatus(configured=False),
            elevenlabs=ServiceStatus(configured=True),
            obsidian=ServiceStatus(configured=True, available=True),
        )

    async def chat(self, payload):  # type: ignore[no-untyped-def]
        return ChatResponse(reply="Resposta **segura**", sources=[
            Source(kind="obsidian", title="nota.md", reference="obsidian://nota", excerpt="trecho")
        ])

    async def synthesize_speech(self, text: str) -> tuple[bytes, str]:
        return b"ID3fake", "audio/mpeg"


def transport() -> ASGITransport:
    return ASGITransport(app=create_app(FakeServices()))  # type: ignore[arg-type]


@pytest.mark.asyncio
async def test_index_has_strict_security_headers() -> None:
    async with AsyncClient(transport=transport(), base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 200
        assert "object-src 'none'" in response.headers["content-security-policy"]
        assert response.headers["x-content-type-options"] == "nosniff"
        assert "HOPE" in response.text
        assert 'href="./styles/main.css"' in response.text
        assert 'src="./js/app.js"' in response.text


@pytest.mark.asyncio
async def test_frontend_assets_are_served_with_browser_mime_types() -> None:
    async with AsyncClient(transport=transport(), base_url="http://test") as client:
        stylesheet = await client.get("/styles/main.css")
        script = await client.get("/js/app.js")

    assert stylesheet.status_code == 200
    assert stylesheet.headers["content-type"].startswith("text/css")
    assert script.status_code == 200
    assert script.headers["content-type"].startswith(
        ("text/javascript", "application/javascript")
    )


@pytest.mark.asyncio
async def test_chat_validates_and_returns_sources() -> None:
    async with AsyncClient(transport=transport(), base_url="http://test") as client:
        response = await client.post("/api/chat", json={"message": "Olá", "history": []})
        assert response.status_code == 200
        assert response.json()["reply"] == "Resposta **segura**"
        assert response.json()["sources"][0]["title"] == "nota.md"
        invalid = await client.post("/api/chat", json={"message": "   ", "history": []})
        assert invalid.status_code == 422


@pytest.mark.asyncio
async def test_tts_returns_only_audio() -> None:
    async with AsyncClient(transport=transport(), base_url="http://test") as client:
        response = await client.post("/api/tts", json={"text": "Olá"})
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("audio/mpeg")
