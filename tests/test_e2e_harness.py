from __future__ import annotations

from httpx import ASGITransport, AsyncClient
import pytest

from tests.e2e_app import USER_ID, app


@pytest.mark.asyncio
async def test_browser_harness_supports_phase_five_chat_contract() -> None:
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post(
            "/api/chat",
            headers={"X-Hope-User-Id": USER_ID},
            json={"message": "Quero registrar esta decisão arquitetural.", "history": []},
        )

    assert response.status_code == 200
    assert "Resposta" in response.json()["reply"]
