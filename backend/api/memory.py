from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, Response, status

from ..memory.manager import MemoryManager
from ..memory.service import MemoryService
from ..memory.schemas import (
    EntityView,
    MemoryCandidateCreate,
    MemoryCreate,
    MemoryExplanation,
    MemoryGraph,
    MemoryRelationCreate,
    MemoryRelationView,
    MemorySearchHit,
    MemoryUpdate,
    MemoryView,
    MemoryWriteResult,
)

router = APIRouter(prefix="/api/memories", tags=["memories"])


def current_user_id(
    value: Annotated[str | None, Header(alias="X-Hope-User-Id")] = None,
) -> uuid.UUID:
    """Identidade transitória até a fase de autenticação baseada em tokens."""
    if value is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Envie X-Hope-User-Id. Autenticação completa será adicionada em uma fase futura.",
        )
    try:
        return uuid.UUID(value)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="X-Hope-User-Id deve ser um UUID.") from exc


CurrentUser = Annotated[uuid.UUID, Depends(current_user_id)]


def manager_from(request: Request) -> MemoryManager:
    manager = getattr(request.app.state, "memory_manager", None)
    if manager is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Memória persistente indisponível: configure DATABASE_URL.",
        )
    return manager


def service_from(request: Request) -> MemoryService:
    service = getattr(request.app.state, "memory_service", None)
    return service if service is not None else MemoryService(manager_from(request))


@router.post("", response_model=MemoryWriteResult, response_model_by_alias=True)
async def create_memory(
    payload: MemoryCreate,
    request: Request,
    user_id: CurrentUser,
) -> MemoryWriteResult:
    return await manager_from(request).create(user_id, payload)


@router.get("", response_model=list[MemoryView], response_model_by_alias=True)
async def list_memories(
    request: Request,
    user_id: CurrentUser,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[MemoryView]:
    return await manager_from(request).list(user_id, limit=limit, offset=offset)


@router.get("/search", response_model=list[MemoryView], response_model_by_alias=True)
async def search_memories(
    request: Request,
    user_id: CurrentUser,
    q: Annotated[str, Query(min_length=1, max_length=500)],
    limit: Annotated[int, Query(ge=1, le=50)] = 10,
) -> list[MemoryView]:
    return await manager_from(request).search(user_id, q.strip(), limit=limit)


@router.get("/retrieve", response_model=list[MemorySearchHit], response_model_by_alias=True)
async def retrieve_memories(
    request: Request,
    user_id: CurrentUser,
    q: Annotated[str, Query(min_length=1, max_length=500)],
    limit: Annotated[int, Query(ge=1, le=50)] = 10,
) -> list[MemorySearchHit]:
    return await manager_from(request).retrieve(user_id, q.strip(), limit=limit)


@router.post("/candidates", response_model=MemoryWriteResult, response_model_by_alias=True)
async def capture_memory_candidate(
    payload: MemoryCandidateCreate,
    request: Request,
    user_id: CurrentUser,
) -> MemoryWriteResult:
    return await service_from(request).capture_candidate(
        user_id,
        payload.content,
        source=payload.source,
        source_reference=payload.source_reference,
    )


@router.get("/entities", response_model=list[EntityView])
async def list_entities(
    request: Request,
    user_id: CurrentUser,
    limit: Annotated[int, Query(ge=1, le=500)] = 200,
) -> list[EntityView]:
    return await manager_from(request).list_entities(user_id, limit=limit)


@router.get("/entities/{entity_id}/memories", response_model=list[MemoryView])
async def entity_memories(
    entity_id: uuid.UUID,
    request: Request,
    user_id: CurrentUser,
    limit: Annotated[int, Query(ge=1, le=200)] = 100,
) -> list[MemoryView]:
    memories = await manager_from(request).entity_memories(
        user_id, entity_id, limit=limit
    )
    if memories is None:
        raise HTTPException(status_code=404, detail="Entidade não encontrada.")
    return memories


@router.get("/graph", response_model=MemoryGraph, response_model_by_alias=True)
async def memory_graph(
    request: Request,
    user_id: CurrentUser,
    limit: Annotated[int, Query(ge=1, le=500)] = 200,
) -> MemoryGraph:
    return await manager_from(request).graph(user_id, limit=limit)


@router.get("/{memory_id}", response_model=MemoryView, response_model_by_alias=True)
async def get_memory(
    memory_id: uuid.UUID,
    request: Request,
    user_id: CurrentUser,
) -> MemoryView:
    memory = await manager_from(request).get(user_id, memory_id)
    if memory is None:
        raise HTTPException(status_code=404, detail="Memória não encontrada.")
    return memory


@router.get(
    "/{memory_id}/explanation",
    response_model=MemoryExplanation,
    response_model_by_alias=True,
)
async def explain_memory(
    memory_id: uuid.UUID,
    request: Request,
    user_id: CurrentUser,
) -> MemoryExplanation:
    explanation = await manager_from(request).explain(user_id, memory_id)
    if explanation is None:
        raise HTTPException(status_code=404, detail="Memória não encontrada.")
    return explanation


@router.patch("/{memory_id}", response_model=MemoryView, response_model_by_alias=True)
async def update_memory(
    memory_id: uuid.UUID,
    payload: MemoryUpdate,
    request: Request,
    user_id: CurrentUser,
) -> MemoryView:
    memory = await manager_from(request).update(user_id, memory_id, payload)
    if memory is None:
        raise HTTPException(status_code=404, detail="Memória não encontrada.")
    return memory


@router.delete("/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_memory(
    memory_id: uuid.UUID,
    request: Request,
    user_id: CurrentUser,
) -> Response:
    if not await manager_from(request).delete(user_id, memory_id):
        raise HTTPException(status_code=404, detail="Memória não encontrada.")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{memory_id}/relations",
    response_model=MemoryRelationView,
)
async def relate_memories(
    memory_id: uuid.UUID,
    payload: MemoryRelationCreate,
    request: Request,
    user_id: CurrentUser,
) -> MemoryRelationView:
    if memory_id == payload.target_memory_id:
        raise HTTPException(status_code=400, detail="Uma memória não pode se relacionar consigo.")
    try:
        relation = await manager_from(request).relate(
            user_id,
            memory_id,
            payload.target_memory_id,
            payload.relation_type,
            payload.weight,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return MemoryRelationView.model_validate(relation)
