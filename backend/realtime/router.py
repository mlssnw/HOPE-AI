from __future__ import annotations

import asyncio
import time
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from .bus import EventBus
from .connections import ConnectionManager

router = APIRouter()

HEARTBEAT_INTERVAL_SECONDS = 20
CLIENT_TIMEOUT_SECONDS = 60


@router.websocket("/ws/hope")
async def hope_websocket(websocket: WebSocket) -> None:
    raw_user_id = websocket.query_params.get("user_id", "")
    try:
        user_id = uuid.UUID(raw_user_id)
    except ValueError:
        await websocket.close(code=1008, reason="user_id deve ser um UUID")
        return

    event_bus: EventBus = websocket.app.state.event_bus
    connections: ConnectionManager = websocket.app.state.connection_manager
    await connections.connect(user_id, websocket)
    subscription = await event_bus.subscribe(user_id)
    receive_task: asyncio.Task[dict[str, object]] | None = None
    event_task: asyncio.Task | None = None
    last_seen = time.monotonic()
    try:
        await connections.send(
            websocket,
            {
                "type": "CONNECTED",
                "user_id": str(user_id),
                "occurred_at": datetime.now(timezone.utc).isoformat(),
                "payload": {"heartbeat_seconds": HEARTBEAT_INTERVAL_SECONDS},
            },
        )
        receive_task = asyncio.create_task(websocket.receive_json())
        event_task = asyncio.create_task(subscription.get())
        while True:
            done, _ = await asyncio.wait(
                {receive_task, event_task},
                timeout=HEARTBEAT_INTERVAL_SECONDS,
                return_when=asyncio.FIRST_COMPLETED,
            )
            if not done:
                if time.monotonic() - last_seen >= CLIENT_TIMEOUT_SECONDS:
                    await websocket.close(code=1011, reason="heartbeat timeout")
                    break
                await connections.send(
                    websocket,
                    {
                        "type": "PING",
                        "occurred_at": datetime.now(timezone.utc).isoformat(),
                        "payload": {},
                    },
                )
                continue

            if receive_task in done:
                message = receive_task.result()
                last_seen = time.monotonic()
                if message.get("type") == "PING":
                    await connections.send(
                        websocket,
                        {
                            "type": "PONG",
                            "occurred_at": datetime.now(timezone.utc).isoformat(),
                            "payload": {},
                        },
                    )
                receive_task = asyncio.create_task(websocket.receive_json())

            if event_task in done:
                event = event_task.result()
                await connections.send(websocket, event.as_message())
                event_task = asyncio.create_task(subscription.get())
    except (WebSocketDisconnect, RuntimeError):
        pass
    finally:
        for task in (receive_task, event_task):
            if task is not None:
                task.cancel()
        await event_bus.unsubscribe(subscription)
        await connections.disconnect(user_id, websocket)
