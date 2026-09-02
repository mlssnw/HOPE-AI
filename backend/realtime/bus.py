from __future__ import annotations

import asyncio
import uuid
from dataclasses import dataclass, field

from .events import HopeEvent


@dataclass(eq=False)
class EventSubscription:
    user_id: uuid.UUID
    queue: asyncio.Queue[HopeEvent] = field(default_factory=lambda: asyncio.Queue(maxsize=256))

    async def get(self) -> HopeEvent:
        return await self.queue.get()


class EventBus:
    """Fan-out em memória, isolado por usuário e independente do transporte."""

    def __init__(self) -> None:
        self._subscriptions: set[EventSubscription] = set()
        self._lock = asyncio.Lock()

    async def subscribe(self, user_id: uuid.UUID) -> EventSubscription:
        subscription = EventSubscription(user_id=user_id)
        async with self._lock:
            self._subscriptions.add(subscription)
        return subscription

    async def unsubscribe(self, subscription: EventSubscription) -> None:
        async with self._lock:
            self._subscriptions.discard(subscription)

    async def publish(self, event: HopeEvent) -> int:
        async with self._lock:
            targets = [item for item in self._subscriptions if item.user_id == event.user_id]
        delivered = 0
        for subscription in targets:
            if subscription.queue.full():
                subscription.queue.get_nowait()
            subscription.queue.put_nowait(event)
            delivered += 1
        return delivered

    @property
    def subscription_count(self) -> int:
        return len(self._subscriptions)
