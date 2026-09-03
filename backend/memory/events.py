from __future__ import annotations

import uuid

from ..realtime import EventBus, EventType, HopeEvent
from .manager import MemoryManager
from .schemas import MemoryGraph, MemoryWriteResult


async def publish_event(
    event_bus: EventBus,
    event_type: EventType,
    user_id: uuid.UUID,
    payload: dict[str, object],
) -> None:
    await event_bus.publish(HopeEvent(type=event_type, user_id=user_id, payload=payload))


async def graph_fragment_payload(
    manager: MemoryManager, user_id: uuid.UUID, memory_id: uuid.UUID
) -> dict[str, object] | None:
    fragment = await manager.graph_fragment(user_id, memory_id)
    if fragment is None:
        return None
    serialized = fragment.model_dump(mode="json", by_alias=True)
    return {
        "node": serialized["nodes"][0],
        "edges": serialized["edges"],
        "entities": serialized["entities"],
        "entity_links": serialized["entity_links"],
    }


async def publish_write_result(
    event_bus: EventBus,
    manager: MemoryManager,
    user_id: uuid.UUID,
    result: MemoryWriteResult,
) -> None:
    if not result.saved or result.memory is None:
        return
    fragment = await graph_fragment_payload(manager, user_id, result.memory.id)
    if fragment is None:
        return
    await publish_event(
        event_bus,
        EventType.MEMORY_UPDATED if result.consolidated else EventType.MEMORY_CREATED,
        user_id,
        fragment,
    )
    if not result.consolidated:
        for edge in fragment["edges"]:
            await publish_event(
                event_bus,
                EventType.MEMORY_RELATION_CREATED,
                user_id,
                {"edge": edge},
            )


async def publish_memory_update(
    event_bus: EventBus,
    manager: MemoryManager,
    user_id: uuid.UUID,
    memory_id: uuid.UUID,
    before: MemoryGraph | None,
) -> None:
    fragment = await graph_fragment_payload(manager, user_id, memory_id)
    if fragment is None:
        return
    await publish_event(event_bus, EventType.MEMORY_UPDATED, user_id, fragment)
    before_edges = {str(edge.id): edge for edge in before.edges} if before else {}
    after_edges = {str(edge["id"]): edge for edge in fragment["edges"]}
    for relation_id, edge in before_edges.items():
        if relation_id not in after_edges:
            await publish_event(
                event_bus,
                EventType.MEMORY_RELATION_DELETED,
                user_id,
                {
                    "relation_id": relation_id,
                    "source_memory_id": str(edge.source_memory_id),
                    "target_memory_id": str(edge.target_memory_id),
                },
            )
    for relation_id, edge in after_edges.items():
        if relation_id not in before_edges:
            await publish_event(
                event_bus,
                EventType.MEMORY_RELATION_CREATED,
                user_id,
                {"edge": edge},
            )


async def publish_memory_delete(
    event_bus: EventBus,
    user_id: uuid.UUID,
    memory_id: uuid.UUID,
    before: MemoryGraph | None,
) -> None:
    if before is not None:
        for edge in before.edges:
            await publish_event(
                event_bus,
                EventType.MEMORY_RELATION_DELETED,
                user_id,
                {
                    "relation_id": str(edge.id),
                    "source_memory_id": str(edge.source_memory_id),
                    "target_memory_id": str(edge.target_memory_id),
                },
            )
    await publish_event(
        event_bus,
        EventType.MEMORY_DELETED,
        user_id,
        {"memory_id": str(memory_id)},
    )
