from __future__ import annotations

import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles

from .api.memory import router as memory_router
from .config import PROJECT_ROOT, Settings
from .database.session import Database
from .memory.embeddings import LocalHashEmbeddingProvider
from .memory.manager import MemoryManager
from .memory.service import MemoryService
from .models import ChatRequest, ChatResponse, HealthResponse, ServiceStatus, TtsRequest
from .realtime import ConnectionManager, EventBus, EventType, HopeEvent
from .realtime.router import router as realtime_router
from .services import ExternalServiceError, HopeServices

FRONTEND_DIR = PROJECT_ROOT / "frontend"


def create_app(
    services: HopeServices | None = None,
    memory_manager: MemoryManager | None = None,
) -> FastAPI:
    settings = Settings.from_env()
    event_bus = EventBus()
    connection_manager = ConnectionManager()
    database = None
    owns_database = False
    if memory_manager is None and settings.database_url:
        database = Database(settings.database_url, echo=settings.database_echo)
        memory_manager = MemoryManager(
            database,
            LocalHashEmbeddingProvider(settings.embedding_dimensions),
            min_importance=settings.memory_min_importance,
            duplicate_similarity=settings.memory_duplicate_similarity,
        )
        owns_database = True

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        yield
        if owns_database and database is not None:
            await database.dispose()

    app = FastAPI(
        title="HOPE-AI API",
        version="6.0.0-phase.4",
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
        lifespan=lifespan,
    )
    app.state.services = services or HopeServices(settings)
    app.state.database = database or getattr(memory_manager, "database", None)
    app.state.memory_manager = memory_manager
    app.state.memory_service = MemoryService(memory_manager) if memory_manager else None
    app.state.event_bus = event_bus
    app.state.connection_manager = connection_manager

    @app.middleware("http")
    async def security_headers(request: Request, call_next):  # type: ignore[no-untyped-def]
        request_id = request.headers.get("X-Request-Id", str(uuid.uuid4()))[:128]
        response = await call_next(request)
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; "
            "font-src 'self'; connect-src 'self'; media-src 'self' blob:; object-src 'none'; "
            "base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
        )
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Permissions-Policy"] = "camera=(), geolocation=(), payment=()"
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-Request-Id"] = request_id
        return response

    @app.exception_handler(ExternalServiceError)
    async def external_error_handler(request: Request, exc: ExternalServiceError) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.public_message})

    @app.get("/api/health", response_model=HealthResponse)
    async def health() -> HealthResponse:
        result = await app.state.services.health()
        database_status = ServiceStatus(
            configured=app.state.database is not None,
            available=(
                await app.state.database.ping() if app.state.database is not None else None
            ),
        )
        return result.model_copy(update={"database": database_status})

    @app.post("/api/chat", response_model=ChatResponse)
    async def chat(payload: ChatRequest, request: Request) -> ChatResponse:
        raw_user_id = request.headers.get("X-Hope-User-Id", "")
        try:
            user_id = uuid.UUID(raw_user_id)
        except ValueError:
            user_id = None
        if user_id is not None:
            await event_bus.publish(
                HopeEvent(
                    type=EventType.AI_STATE_CHANGED,
                    user_id=user_id,
                    payload={"state": "thinking"},
                )
            )
        try:
            result = await app.state.services.chat(payload)
        except Exception:
            if user_id is not None:
                await event_bus.publish(
                    HopeEvent(
                        type=EventType.AI_STATE_CHANGED,
                        user_id=user_id,
                        payload={"state": "error"},
                    )
                )
            raise
        if user_id is not None:
            await event_bus.publish(
                HopeEvent(
                    type=EventType.AI_STATE_CHANGED,
                    user_id=user_id,
                    payload={"state": "idle"},
                )
            )
        return result

    @app.post("/api/tts")
    async def tts(payload: TtsRequest) -> Response:
        audio, media_type = await app.state.services.synthesize_speech(payload.text)
        return Response(content=audio, media_type=media_type)

    app.include_router(memory_router)
    app.include_router(realtime_router)

    if FRONTEND_DIR.exists():
        app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

    @app.get("/", include_in_schema=False)
    async def index() -> FileResponse:
        index_path = FRONTEND_DIR / "index.html"
        if not index_path.exists():
            raise HTTPException(status_code=503, detail="Frontend não encontrado.")
        return FileResponse(index_path)

    @app.get("/favicon.ico", include_in_schema=False)
    async def favicon() -> Response:
        return Response(status_code=204)

    return app


app = create_app()
