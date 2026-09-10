# QA Review — Latest

- Status: REJECTED
- Phase: 5
- Functional commit reviewed: `19e573893aba09da990256da05e7dab5af165ce1`
- Previous functional checkpoint: `ffef78236358ac4d7a0518a563a2d5f2d8c22c39`
- Review date: 2026-09-10
- Branch during review: `main`
- HEAD during review: `563cdf93ac3992d780d5aa500719d23625c69b11`
- Scope note: there is no functional diff between the reviewed commit and HEAD; later commits are documentation-only.

## Result

Result: REJECTED

## Test Summary

- Backend: PASSED — full Python suite completed with 42 passed and one Starlette TestClient/httpx deprecation warning. Imports for FastAPI, services, AI Orchestrator, Memory Manager, memory API and realtime succeeded.
- Frontend: PASSED — 19 Node tests passed; syntax validation passed for all JavaScript files.
- Browser: FAILED / PARTIAL — the official Phase 5 harness loaded, rendered the WebGL Memory Globe, completed ordinary chat, kept an XSS probe inert, exposed no console warnings/errors, handled cancellation, and worked at a 390×844 viewport without horizontal overflow. Memory-aware chat failed in the official harness, so the destructive confirmation could not be exercised end to end in the browser.
- API: PASSED — negative identity checks returned 401 for missing identity and 400 for an invalid UUID. Memory deletion returned 428 when the exact confirmation header was missing or mismatched; no deletion was attempted.
- Realtime: PASSED — live connection and PING/PONG succeeded. Malformed JSON closed with code 1008 and reason `payload JSON inválido`, without an unhandled traceback. Server interruption produced `Tempo real desconectado · HTTP disponível`; restart reconnected automatically and synchronized the graph.
- Memory: FAILED / PARTIAL — isolated automated coverage passed for opt-in, retrieval, capture, correction/forget, consolidation, relations and deletion preconditions. The official browser harness cannot execute memory-aware chat because its mock violates the MemoryContextBuilder contract. PostgreSQL/pgvector and migration `20260903_0003` were not exercised or changed.
- AI: PASSED WITH ENVIRONMENT LIMITATION — automated tests passed for memory retrieval, untrusted memory context, personality prompt behavior, provider errors and memory-disabled behavior. No paid provider was called.
- Security: PASSED WITH WARNINGS — memory-disabled requests block retrieval, capture and memory commands server-side; persistent-memory consent remains independent from local-history consent; XSS content rendered as text; deletion requires an exact target-bound UUID; basic tracked-file scanning found only explicit test/example credentials. Full authentication remains outside this phase.

## Validation Evidence

- `python -m pytest -q`: 42 passed, 1 warning.
- Focused Phase 5/API/realtime suite: 20 passed, 1 warning.
- Frontend Node suite: 19 passed.
- JavaScript syntax scan: passed.
- Live malformed WebSocket frame: `CONNECTED`, then close code 1008; server log contained no traceback.
- Live reconnect: disconnected state advertised HTTP fallback, followed by automatic reconnect and graph synchronization.
- Browser: memory consent checked while local-history consent remained unchecked, confirming independent controls.
- Browser: safe mocked response preserved `<img src=x onerror=alert(1)>` as code/text; no message image or `onerror` element was created.
- Responsive smoke test: 390×844 viewport, prompt remained available and document width did not overflow.
- No real database, migration, destructive memory confirmation, paid provider or live microphone was used.

## Regressions Found

- `QA-001` remains blocking in a narrower form: ordinary chat in the official harness was repaired, but enabling persistent memory exposes an incompatible mock return type and makes the harness report memory as unavailable.
- `QA-002` is resolved: malformed WebSocket JSON is rejected with code 1008 and no unhandled traceback.
- `QA-003` remains non-blocking: the chat reports cancellation immediately, while the Memory Globe status can remain `Consultando memórias…` briefly before returning to the connected/idle state.

## Bugs

### QA-001 — Official E2E harness cannot validate memory-aware chat

- Severity: MEDIUM
- Blocking: yes
- Steps to reproduce:
  1. Start `uvicorn tests.e2e_app:app`.
  2. Open the official harness and enable `Memória no chat`.
  3. Send a message that should retrieve a known mocked memory, such as `Esqueça Arquitetura da HOPE`.
- Expected: the mock retrieval supplies typed search hits, the Orchestrator selects the exact memory, and the UI opens the target-bound destructive confirmation dialog.
- Actual: the response says persistent memory is unavailable and `memory_delete_confirmation` is null.
- Root cause: `BrowserMockMemoryManager.retrieve()` returns dictionaries in `tests/e2e_app.py`, while `MemoryContextBuilder.build()` consumes objects with `.score` and `.memory`. Direct invocation reproduces `AttributeError: 'dict' object has no attribute 'score'`; the Orchestrator degrades the user-facing response instead of surfacing the harness defect.
- Impact: the repository's official E2E harness cannot validate memory retrieval, memory-aware chat, or the browser confirmation path introduced by the reviewed commit.
- Recommended owner: Development.

### QA-003 — Memory Globe state lags briefly after cancellation

- Severity: LOW
- Blocking: no
- Steps to reproduce:
  1. Submit the delayed `aguarde` request in the official harness.
  2. Click `Cancelar` while it is pending.
  3. Compare the chat status with the Memory Globe status immediately after cancellation.
- Expected: both surfaces leave the processing state together when abort is recognized.
- Actual: chat immediately reports `Solicitação cancelada.`, while the globe can still show `Consultando memórias…`; it recovered to the connected/idle state during the subsequent observation.
- Impact: transient visual inconsistency only; request controls recover and remain usable.
- Recommended owner: Development.

## Blockers

- `QA-001` — update the official Phase 5 E2E mock to satisfy the production Memory Manager retrieval contract, add a memory-enabled harness regression test, and re-run the browser flow through exact-target delete confirmation.

## Non-blocking Issues

- `QA-003` — transient Memory Globe processing state after chat cancellation.
- Starlette TestClient emits a deprecation warning for its current httpx integration.
- The real PostgreSQL/pgvector migration `20260903_0003` remains unapplied and unvalidated by this QA review, as required; production readiness still needs the authorized database process.
- Paid AI/TTS providers and live microphone permissions were not exercised.
- Authentication/authorization are not complete; client-supplied HTTP and WebSocket UUIDs remain development identities.
- The destructive dialog's static semantics, target/consequence copy and frontend keyboard behavior are covered by automated tests, but the browser-level memory-aware path was blocked by `QA-001`.

## Recommendation

REJECTED. The security controls in `19e573893aba09da990256da05e7dab5af165ce1` pass their isolated tests, and the prior malformed-WebSocket blocker is fixed. Approval is withheld because the official E2E harness still cannot execute the memory-enabled flow central to this functional commit. Fix `QA-001` in a new functional commit and request QA re-review against that exact hash.
