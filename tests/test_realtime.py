from __future__ import annotations

import asyncio
import uuid

import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect
from httpx import ASGITransport, AsyncClient

from backend.database.session import Database
from backend.main import create_app
from backend.memory.embeddings import LocalHashEmbeddingProvider
from backend.memory.manager import MemoryManager
from backend.models import ChatResponse, HealthResponse, ServiceStatus
from backend.realtime import EventBus, EventType, HopeEvent


class FakeServices:
    async def health(self) -> HealthResponse:
        status = ServiceStatus(configured=False)
        return HealthResponse(
            claude=status, tavily=status, elevenlabs=status, obsidian=status
        )

    async def chat(self, payload):  # type: ignore[no-untyped-def]
        return ChatResponse(reply="ok")

    async def synthesize_speech(self, text: str) -> tuple[bytes, str]:
        return b"", "audio/mpeg"


async def make_app():  # type: ignore[no-untyped-def]
    database = Database("sqlite+aiosqlite:///:memory:")
    await database.create_schema_for_tests()
    manager = MemoryManager(database, LocalHashEmbeddingProvider(1536))
    return database, create_app(FakeServices(), manager)  # type: ignore[arg-type]


async def next_event(subscription, expected: EventType) -> HopeEvent:  # type: ignore[no-untyped-def]
    for _ in range(12):
        event = await asyncio.wait_for(subscription.get(), timeout=1)
        if event.type == expected:
            return event
    raise AssertionError(f"Evento {expected} não recebido.")


@pytest.mark.asyncio
async def test_event_bus_isolates_users_and_supports_all_event_types() -> None:
    bus = EventBus()
    user_id = uuid.uuid4()
    other_user = uuid.uuid4()
    subscription = await bus.subscribe(user_id)
    other_subscription = await bus.subscribe(other_user)
    try:
        for event_type in EventType:
            delivered = await bus.publish(
                HopeEvent(type=event_type, user_id=user_id, payload={"ok": True})
            )
            assert delivered == 1
            assert (await subscription.get()).type == event_type
        assert other_subscription.queue.empty()
    finally:
        await bus.unsubscribe(subscription)
        await bus.unsubscribe(other_subscription)
    assert bus.subscription_count == 0


@pytest.mark.asyncio
async def test_memory_api_publishes_incremental_lifecycle_events() -> None:
    database, app = await make_app()
    user_id = uuid.uuid4()
    headers = {"X-Hope-User-Id": str(user_id)}
    subscription = await app.state.event_bus.subscribe(user_id)
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            first_response = await client.post(
                "/api/memories",
                headers=headers,
                json={"content": "Prefiro respostas objetivas.", "force": True},
            )
            first_id = first_response.json()["memory"]["id"]
            created = await next_event(subscription, EventType.MEMORY_CREATED)
            assert created.payload["node"]["id"] == first_id

            update_response = await client.patch(
                f"/api/memories/{first_id}",
                headers=headers,
                json={"title": "Preferência de resposta"},
            )
            assert update_response.status_code == 200
            updated = await next_event(subscription, EventType.MEMORY_UPDATED)
            assert updated.payload["node"]["title"] == "Preferência de resposta"

            second_response = await client.post(
                "/api/memories",
                headers=headers,
                json={"content": "Preciso revisar o calendário amanhã.", "force": True},
            )
            second_id = second_response.json()["memory"]["id"]
            await next_event(subscription, EventType.MEMORY_CREATED)

            relation_response = await client.post(
                f"/api/memories/{first_id}/relations",
                headers=headers,
                json={
                    "target_memory_id": second_id,
                    "relation_type": "related_to",
                    "weight": 0.8,
                },
            )
            assert relation_response.status_code == 200
            relation_id = relation_response.json()["id"]
            relation_created = await next_event(
                subscription, EventType.MEMORY_RELATION_CREATED
            )
            assert relation_created.payload["edge"]["id"] == relation_id

            deleted_relation = await client.delete(
                f"/api/memories/{first_id}/relations/{relation_id}", headers=headers
            )
            assert deleted_relation.status_code == 204
            relation_deleted = await next_event(
                subscription, EventType.MEMORY_RELATION_DELETED
            )
            assert relation_deleted.payload["relation_id"] == relation_id

            deleted_memory = await client.delete(
                f"/api/memories/{second_id}", headers=headers
            )
            assert deleted_memory.status_code == 204
            memory_deleted = await next_event(subscription, EventType.MEMORY_DELETED)
            assert memory_deleted.payload["memory_id"] == second_id
    finally:
        await app.state.event_bus.unsubscribe(subscription)
        await database.dispose()


@pytest.mark.asyncio
async def test_chat_publishes_ai_state_for_same_user() -> None:
    app = create_app(FakeServices())  # type: ignore[arg-type]
    user_id = uuid.uuid4()
    subscription = await app.state.event_bus.subscribe(user_id)
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/chat",
                headers={"X-Hope-User-Id": str(user_id)},
                json={"message": "Olá", "history": []},
            )
        assert response.status_code == 200
        assert (await subscription.get()).payload["state"] == "thinking"
        assert (await subscription.get()).payload["state"] == "searching"
        assert (await subscription.get()).payload["state"] == "idle"
    finally:
        await app.state.event_bus.unsubscribe(subscription)


def test_websocket_connects_and_answers_ping() -> None:
    app = create_app(FakeServices())  # type: ignore[arg-type]
    user_id = uuid.uuid4()
    with TestClient(app) as client:
        with client.websocket_connect(f"/ws/hope?user_id={user_id}") as websocket:
            assert websocket.receive_json()["type"] == "CONNECTED"
            websocket.send_json({"type": "PING", "payload": {}})
            assert websocket.receive_json()["type"] == "PONG"


def test_websocket_rejects_malformed_json_with_policy_close() -> None:
    app = create_app(FakeServices())  # type: ignore[arg-type]
    user_id = uuid.uuid4()
    with TestClient(app) as client:
        with client.websocket_connect(f"/ws/hope?user_id={user_id}") as websocket:
            assert websocket.receive_json()["type"] == "CONNECTED"
            websocket.send_text("{invalid-json")
            with pytest.raises(WebSocketDisconnect) as caught:
                websocket.receive_json()

    assert caught.value.code == 1008
    assert caught.value.reason == "payload JSON inválido"
