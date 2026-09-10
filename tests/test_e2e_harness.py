from __future__ import annotations

from httpx import ASGITransport, AsyncClient
import pytest

from tests.e2e_app import MEMORY_IDS, USER_ID, create_browser_app


@pytest.mark.asyncio
async def test_browser_harness_supports_phase_five_chat_contract() -> None:
    app, _ = create_browser_app()
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post(
            "/api/chat",
            headers={"X-Hope-User-Id": USER_ID},
            json={
                "message": "Mostre a Arquitetura da HOPE.",
                "history": [],
                "memory_enabled": True,
            },
        )

    assert response.status_code == 200
    body = response.json()
    assert "Resposta" in body["reply"]
    assert body["memory_enabled"] is True
    assert body["memory_available"] is True
    assert body["memories_used"] == [MEMORY_IDS[0]]
    assert "memory_retriever" in body["tools_used"]


@pytest.mark.asyncio
async def test_browser_harness_forget_flow_binds_confirmation_to_exact_uuid() -> None:
    app, manager = create_browser_app()
    headers = {"X-Hope-User-Id": USER_ID}
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        command = await client.post(
            "/api/chat",
            headers=headers,
            json={
                "message": "Esqueça Arquitetura da HOPE.",
                "history": [],
                "memory_enabled": True,
            },
        )
        missing = await client.delete(f"/api/memories/{MEMORY_IDS[0]}", headers=headers)
        mismatch = await client.delete(
            f"/api/memories/{MEMORY_IDS[0]}",
            headers={**headers, "X-Hope-Confirm-Memory-Id": MEMORY_IDS[1]},
        )
        confirmed = await client.delete(
            f"/api/memories/{MEMORY_IDS[0]}",
            headers={**headers, "X-Hope-Confirm-Memory-Id": MEMORY_IDS[0]},
        )

    body = command.json()
    assert command.status_code == 200
    assert body["memory_available"] is True
    assert body["memory_delete_confirmation"] == {
        "memory_id": MEMORY_IDS[0],
        "label": "Arquitetura da HOPE",
        "consequence": "A memória e suas relações serão removidas permanentemente.",
    }
    assert missing.status_code == 428
    assert mismatch.status_code == 428
    assert confirmed.status_code == 204
    assert all(str(item.id) != MEMORY_IDS[0] for item in manager.memories)
    assert all(
        MEMORY_IDS[0] not in (str(edge.source_memory_id), str(edge.target_memory_id))
        for edge in manager.relations
    )
