# QA Re-review — Phase 7 Conversational Presence Foundation

## QA Status

`APPROVED_WITH_WARNINGS`

The corrected Phase 7 Functional Commit closes both previously blocking QA findings. Independent clean-export execution passed the complete Python, frontend, Phase 7 browser and legacy Phase 6 browser packages. The playback-to-recognition transition now stops active audio, releases the local meter, resets amplitude and rejects stale playback callbacks before Listening is accepted. The Public history projection fails closed for legacy, private, memory-derived and delayed private records. No new functional regression or QA blocker was found.

## Commit Tested

- Functional Commit: `af2aa66d13a1f0c3a8ccd31f52943da602fc4aa5`
- Phase 6 baseline: `ce2bde4a0792fa6a8c0a79e56781add162bff2d2`
- Previously rejected Phase 7 candidate: `c649a903693d5fedf631d760880b80ed881dc138`
- Repository HEAD observed: `b0f9b7f9fe1dd689f7de2d49756e69791eaf249b`
- Branch: `codex/phase-7-completion`
- Review date: 2026-11-16

The Functional Commit is an ancestor of the observed HEAD. A targeted comparison from the Functional Commit to HEAD found no later drift in backend, frontend, tests, migrations or dependency manifests. Testing used a fresh `git archive` export of the exact Functional Commit. Database and provider environment variables were cleared; no `.env`, real database, migration, paid provider or production service was used.

## Test Summary

| Area | Result | Evidence |
|---|---|---|
| Backend / Python | PASSED | `60 passed`, one known Starlette/TestClient deprecation warning |
| Frontend / JavaScript | PASSED | `67 passed`, `0 failed` |
| Syntax | PASSED | Python AST parsing for 51 files; `node --check` for 49 JavaScript files |
| API / chat / memory | PASSED | Full Python suite covered typed E2E models, isolated mock state, memory-aware chat, exact-UUID forget confirmation, HTTP 428 negative cases, deletion and relation removal |
| Phase 7 browser | PASSED | 7/7 Chrome scenarios; console/page errors and frontend asset failures clean |
| Legacy Phase 6 browser | PASSED | Complete official package ran through all runtime, accessibility, chat, Memory Globe, realtime, voice and safe-forgetting scenarios |
| Voice / cancellation | PASSED | Active playback paused before recognition; meter disconnected; amplitude reset to zero; stale audio events could not overwrite Listening |
| Public history security | PASSED | Legacy/unknown, private, memory-derived and delayed private response records excluded; PUBLIC+PRIVATE remained fail-closed |
| Modes / accessibility | PASSED | Escape, close control, focus return, 130% text, 200% reflow equivalent, seven viewport sizes and single announcement channel |
| Realtime | PASSED | Incremental events, heartbeat PONG, disconnected HTTP sync, reconnect and rejection of uncorrelated remote AI state |
| Memory Globe / WebGL | PASSED | Incremental graph behavior, no-WebGL fallback, context-loss recovery and quality tiers; HIGH rendered 2,500 nodes at 58.85 FPS in this run |
| Basic security | PASSED within local scope | Inert hostile HTML, executable-protocol rejection, exact destructive target, no secret-material match in the functional diff; only `.env.example` is tracked |

## Commands and Evidence Executed

- Git state, branch, HEAD, target identity, ancestry, functional-drift inventory and `git diff --check`.
- Clean export: `git archive --format=zip af2aa66d13a1f0c3a8ccd31f52943da602fc4aa5` into a disposable directory.
- Python: `python -m pytest -q -p no:cacheprovider` with database/provider variables cleared.
- Frontend: `node --test tests/frontend/*.test.mjs`.
- Syntax: AST parsing of all Python files and `node --check` for frontend/test JavaScript.
- Phase 7 browser: `node tests/browser/run-phase-7.mjs` on exclusive port 8767 with synthetic media and disposable evidence.
- Full legacy browser regression: `node tests/browser/run.mjs` on exclusive port 8766 with disposable evidence.
- Static security checks: tracked sensitive-file inventory, known secret-pattern scan of the functional delta, schema/dependency boundary review and whitespace validation.

## Blocker Closure

### QA-P7-001 — Closed

- Severity: `MEDIUM` (previously blocking)
- Evidence: the Chrome recognition scenario reached real synthetic playback, observed one `pause()` call, observed meter disconnection, observed the final voice level at zero, confirmed Listening only after the recognition `onstart` callback, and confirmed late playback events could not restore Speaking.
- Impact after correction: the UI and actual media lifecycle no longer diverge when the microphone is activated during playback.
- Disposition: `CLOSED`.

### QA-P7-002 — Closed

- Severity: `MEDIUM` (previously blocking)
- Evidence: the complete official Phase 6 browser runner exited successfully. Updated assertions prove that uncorrelated realtime state cannot control the local turn and that only history-eligible records survive reload; all remaining legacy scenarios executed and passed.
- Impact after correction: the repository's advertised complete regression package is reproducibly green on the exact Functional Commit.
- Disposition: `CLOSED`.

## Regressions Found

None in the executed scope.

## Bugs

No new reproducible bug was found.

## Blockers

None. `QA-P7-001` and `QA-P7-002` are closed.

## Non-blocking Issues

### QA-P7-W01 — Real-provider and physical-device fidelity remain untested

- Severity: `INFO`
- Evidence: voice, recognition and provider behavior used deterministic mocks, fake playback and synthetic PCM; no physical microphone/speaker or paid provider was invoked.
- Impact: this review proves lifecycle, contract and fallback behavior, not live prosody, acoustic quality or provider style fidelity.
- Recommendation: retain as a separate authorized live-device/provider validation gate.

### QA-P7-W02 — Production data and infrastructure remain outside scope

- Severity: `INFO`
- Evidence: no real PostgreSQL/pgvector database, migration, credentials, deployment or production environment was accessed.
- Impact: Feature Status is approved with warnings; Production Readiness is not established by this review.
- Recommendation: preserve the existing Database, Security and production gates.

### QA-WARN-HTTPX — Deprecated TestClient integration

- Severity: `INFO`
- Evidence: the Python suite emitted the known `StarletteDeprecationWarning` for the current TestClient/httpx integration.
- Impact: no current test failure; future dependency maintenance is required.
- Recommendation: track outside the Phase 7 acceptance gate.

## Recommendation

`APPROVED_WITH_WARNINGS`

QA recommends advancing the exact Functional Commit `af2aa66d13a1f0c3a8ccd31f52943da602fc4aa5` through the remaining required review gates. Do not interpret this result as production approval or authorization for Phase 8, migrations, real-provider use or deployment.

---

## Historical QA Record — Rejected Phase 7 Candidate `c649a903`

# QA Review — Phase 7 Conversational Presence Foundation

## QA Status

`REJECTED`

The exact Phase 7 candidate passes its Python, frontend and new Phase 7 browser suites, but it does not satisfy the complete acceptance contract. Starting microphone recognition while HOPE audio is already playing changes the visible state to Listening without stopping the active audio. In addition, the repository's complete Phase 6 browser regression runner fails on two assertions that were not reconciled with the authorized Phase 7 behavior. Both findings block the claim that cancellation/interruption and the complete regression suite pass.

## Commit Tested

- Functional Commit: `c649a903693d5fedf631d760880b80ed881dc138`
- Functional baseline: `ce2bde4a0792fa6a8c0a79e56781add162bff2d2`
- Delivery documentation/evidence: `6919c967c66f728471b5c195079dabda33a3e3ed`
- Repository HEAD observed: `08e3984986798dfee0500f6af6cd3f695e57a910`
- Branch: `codex/phase-7-completion`
- Review date: 2026-11-15

`c649a903` is an ancestor of the observed HEAD. `git diff c649a903..HEAD -- backend frontend tests migrations ...` was empty; the later commits contain documentation/evidence only. Testing used a clean `git archive` export of the exact Functional Commit with database and provider environment variables removed. No `.env` was read.

## Test Summary

| Area | Result | Evidence |
|---|---|---|
| Backend / Python | PASSED | `60 passed`, one known Starlette/TestClient deprecation warning |
| Frontend / JavaScript | PASSED | `62 passed`, `0 failed` |
| Syntax | PASSED | Python AST parsing and `node --check` for 47 JavaScript files |
| API / presentation contract | PASSED | strict enum rejection, omitted/`NORMAL` equality, one bounded static overlay, provider payload keys and `max_tokens=1400` verified with mocks |
| Phase 7 browser harness | PASSED | five Chrome scenarios; console/page errors and asset failures clean; separate QA evidence directory used |
| Phase 6 browser regression package | FAILED | official `node tests/browser/run.mjs` stopped in `phase-6-runtime.mjs`; isolated `phase-6-flows.mjs` also failed |
| Accessibility browser regression | PASSED | isolated Phase 6 accessibility runner passed bounds, 200% reflow equivalent, 130% text, landscape, contrast and focus |
| Memory / API regressions | PASSED in automated suites | retrieval with `memory_enabled=true`, exact-UUID forget confirmation, HTTP 428 negative cases, deletion and relation removal covered by passing Python tests |
| Realtime | PARTIAL / REGRESSION HARNESS FAILED | frontend unit coverage passed heartbeat, disconnect and reconnect scheduling; the legacy browser assertion for raw uncorrelated AI state is stale and fails |
| Voice / cancellation | FAILED | targeted Chrome reproduction confirmed active audio is not paused when recognition starts |
| Memory Globe / WebGL | PASSED in Phase 7 harness | no-WebGL conversation and controls passed; complete Phase 7 viewport matrix passed |
| Basic security | PASSED within local scope | hostile presentation input, inert HTML, exact phrase allowlist, no tracked sensitive `.env`, and zero known secret-prefix hits in the delta |

## Commands and Evidence Executed

- Git state, ancestry, log, exact functional diff inventory and `git diff --check`.
- Clean export: `git archive --format=zip c649a903693d5fedf631d760880b80ed881dc138` into a disposable directory.
- Python: isolated interpreter with the export as current directory, `python -m pytest -q -p no:cacheprovider`.
- Frontend: `node --test tests/frontend/*.test.mjs`.
- Syntax: AST parsing of Python files and `node --check` for frontend/test JavaScript.
- Phase 7 browser: `HOPE_EVIDENCE_DIR=test-results/phase-7-qa node tests/browser/run-phase-7.mjs` on exclusive port 8767.
- Phase 6 browser regression: `node tests/browser/run.mjs` on exclusive port 8766; then isolated accessibility and flow runners for diagnosis.
- Targeted voice race: disposable FastAPI harness plus Chrome synthetic playback/recognition; result was `{"pauseCalls":0,"state":"listening","micPressed":"true"}`.
- Static boundary checks: no schema, migration, database, dependency or credential-path delta; no tracked sensitive `.env`; known secret-prefix scan returned zero hits.

## Acceptance and UI/UX Evidence Matrix

| Contract | QA result |
|---|---|
| Strict `presentation_mode`, exact `NORMAL`, bounded overlay, unchanged provider shape/call count | PASS with mocked-provider fidelity limit |
| Canonical DisplayResponse / separate SpokenResponse / material warnings and values preserved | PASS |
| Session, turn, attempt and response-version stale guards | PASS for covered generation, synthesis and recognition cases; FAIL for the playback-to-listening transition in `QA-P7-001` |
| Stop, cancel, Escape, focus and truthful visual states | FAIL due to `QA-P7-001`; the other exercised paths passed |
| Five mode axes, privacy restrictions, delayed Private response and restoration | PASS |
| Exact phrases `006`–`018`, null default, cooldown and suppressions; pending/rejected phrases excluded | PASS |
| Public-safe SelfKnowledge and capability-state separation | PASS |
| Local-only amplitude, reset paths and reduced motion | FAIL for the microphone-start transition because active playback is not stopped or explicitly reset; other terminal paths passed |
| Responsive UI, 200% reflow equivalent, 130% text, required viewports and no-WebGL | PASS |
| Existing chat, memory, API, confirmation/delete and incremental Memory Globe behavior | PASS in automated suites; complete legacy browser runner remains red under `QA-P7-002` |

`UIUX-P7-001`, `002`, `006`–`011`, `013`–`021` passed within the executed environment. `UIUX-P7-003`, `004`, `005` and `012` are not approved because the active-playback-to-recognition path violates the specified interruption and terminal-reset behavior.

## Regressions Found

### QA-P7-001 — Starting recognition does not stop active playback

- Severity: `MEDIUM`
- Blocking: `YES`
- Affected surface: voice interruption, truthful state, local amplitude and microphone/playback coexistence
- Evidence: in Chrome with deterministic synthetic audio, HOPE entered `SPEAKING`; activating the microphone then entered `LISTENING`, but the active audio object's `pause()` call count remained zero. Result: `pauseCalls=0`, `state=listening`, `micPressed=true`.
- Code diagnosis: the microphone click path in `VoiceInput` begins a new turn/reference, but `ChatController` does not call `VoiceManager.stopSpeech()` before recognition starts. The new reference makes old callbacks stale, but it does not stop the actual media element or explicitly reset its meter at that transition.
- Impact: HOPE can keep speaking while the UI claims it is listening. Playback can feed the microphone, the Stop-playback scope becomes misleading, and the last positive Orb amplitude can survive because the stale meter callback is ignored rather than terminated through the normal reset path.
- Recommendation: make microphone activation stop/invalidate active playback before recognition starts, then add browser coverage proving audio pause/resource release, amplitude zero, real recognition-start gating and idempotent interruption.
- Acceptance criteria to close: real playback is paused/stopped before Listening; meter/resources are released; `voiceLevel` is zero; late old-audio events cannot change state; repeated activation remains safe.

### QA-P7-002 — Complete legacy browser regression package is not green

- Severity: `MEDIUM`
- Blocking: `YES`
- Affected surface: repository test integrity and Phase 6 regression evidence
- Evidence 1: `node tests/browser/run.mjs` failed at `tests/browser/phase-6-runtime.mjs:49`, timing out while waiting for uncorrelated `AI_STATE_CHANGED` values to control `#hope-state`. Phase 7 intentionally rejects those uncorrelated events, so the legacy assertion no longer represents the authorized contract.
- Evidence 2: isolated `tests/browser/phase-6-flows.mjs` failed at line 53 with `2 !== 4` after reload. Phase 7 now preserves only history-eligible messages; the legacy test still expects messages created while persistence was off to become persistable later.
- Impact: the repository's advertised complete Phase 6 browser runner fails on the exact Functional Commit. The new Phase 7 harness does not replace all legacy memory/realtime/delete/browser regression scenarios, so the claim that the complete suite passes is not reproducible.
- Recommendation: reconcile the two obsolete assertions with the authorized Phase 7 contracts without weakening the underlying coverage, run the entire Phase 6 browser package from a disposable output location, and keep the new Phase 7 package green.
- Acceptance criteria to close: `node tests/browser/run.mjs` completes successfully on a clean exact-target export; updated assertions prove uncorrelated remote state is ignored and only history-eligible records persist; all remaining legacy scenarios execute rather than being skipped after the first failure.

## Blockers

- `QA-P7-001` — active playback continues when microphone recognition starts.
- `QA-P7-002` — the complete repository browser regression package fails and does not execute all legacy scenarios.

## Non-blocking Issues

### QA-P7-W01 — Real-provider presentation and audio fidelity are untested

- Severity: `INFO`
- Blocking: `NO`
- Evidence: provider behavior was exercised only through mocks and synthetic PCM/fake playback/recognition.
- Impact: deterministic tests prove request/prompt boundaries, not whether a live provider consistently follows Focus/Supportive/Presentation style or produces acceptable audio.
- Recommendation: retain this limit explicitly; any paid/live evaluation requires separate authorization.

### QA-P7-W02 — Real devices and production dependencies remain outside this review

- Severity: `INFO`
- Blocking: `NO` for Phase 7 feature scope
- Evidence: no physical microphone/speaker, manual screen reader, real PostgreSQL/pgvector, migration, provider credential, deployment or production environment was used.
- Impact: this review does not establish Production Readiness.
- Recommendation: preserve the existing Database, Security, accessibility-device and production gates.

### QA-WARN-HTTPX — Deprecated TestClient integration

- Severity: `INFO`
- Blocking: `NO`
- Evidence: the Python suite emitted the known `StarletteDeprecationWarning` for the current TestClient/httpx integration.
- Impact: no current failure; future dependency maintenance is required.
- Recommendation: track outside the Phase 7 correction gate.

## Environmental Limits

- No real microphone, paid AI/TTS provider, real PostgreSQL, migration, credential, infrastructure, deployment or production action was used.
- Browser media evidence used deterministic fake recognition, fake playback and synthetic PCM.
- Mocks do not prove live-provider generation fidelity, prosody or audio quality.
- The real owner/authentication and production-security blockers remain unchanged and are not reclassified by this feature review.

## Recommendation

`REJECTED`

Return the candidate to Development for the two exact blockers above. Re-review should target a new Functional Commit and rerun the targeted playback-to-recognition race, both complete browser packages, Python, frontend and syntax checks. Phase 8, production, migration and real-provider work remain outside scope.

---

## Historical QA Record — Phase 6

# QA Final Confirmation — Phase 6 Integration Candidate

## QA Status

`APPROVED_WITH_WARNINGS`

Both QA blockers remain closed and the final documentation/metadata candidate is confirmed. `QA-IC-001` was closed by independent clean-export validation, `QA-IC-002` was closed by public PR metadata verification, and the final candidate adds no functional drift. No QA blocker remains; environmental and maintenance warnings remain non-blocking.

## Commits Reviewed

- Final Integration Candidate: `f819440a72f2e68368bcc0d3c1af6ec700d170bf`
- Previously reviewed functional candidate: `51f93d12740a6e0860856257ea761377b04c97fb`
- Functional correction commit: `4d76f2433363a47a9d8fe29fef337de1dc79ac50`
- Development evidence commit: `9e5764671d86121aedd88b926c05ccbc7c385131`
- Rejected candidate baseline: `20843a4568ca6eba67d66f93234412038ca79199`
- Original Phase 6 Functional Commit: `0912e9492370f6bce8c51762d1a8a87b5bd16aa8`
- Branch: `codex/phase-6-target-ui`
- Review date: 2026-09-22
- Metadata closure date: 2026-09-24
- Final candidate confirmation date: 2026-09-24

The previously reviewed functional candidate contains both `4d76f24` and `9e57646`. The only functional-path delta from `20843a4` is `tests/test_realtime.py`; the final candidate adds documentation only, so runtime backend, frontend, API, schema, migrations, dependencies, and production configuration remain unchanged.

## Final Metadata and Documentation Confirmation

`APPROVED_WITH_WARNINGS`

- Public PR #1 is open and remains draft.
- Base/head remain `main` <- `codex/phase-6-target-ui`.
- Public PR head is exactly `f819440a72f2e68368bcc0d3c1af6ec700d170bf`.
- GitHub reports `mergeable=true` and mergeable state `clean`; no merge conflict remains.
- The PR body identifies exact Final Integration Candidate `f819440a72f2e68368bcc0d3c1af6ec700d170bf`, reviewed functional candidate `51f93d12740a6e0860856257ea761377b04c97fb`, and functional correction `4d76f2433363a47a9d8fe29fef337de1dc79ac50`.
- The PR preserves Production Readiness as `BLOCKED`, keeps Phase 7 unauthorized, and keeps merge dependent on this confirmation plus separate owner authorization.
- `README.md` at `f819440` is PT-BR, uses the HOPE brand, identifies Phase 6, records `APPROVED_WITH_WARNINGS`, links to `docs/phase-6.md`, and does not contain a Phase 5/current-state reference, `IN_PROGRESS`, or a conflicting runtime-version badge.
- Diff `51f93d1..f819440` changes only `README.md`, `docs/handoff.md`, and QA/Security review reports. Backend, frontend, tests, schema, migrations, dependencies, and runtime behavior are unchanged.
- Functional suites were not repeated because no functional drift was detected.

## QA-IC-001 Result

`CLOSED — APPROVED`

### Root Cause Confirmation

The rejected test created `create_app(FakeServices())` without an explicit memory manager. A developer-local `DATABASE_URL` silently supplied one, so the test passed locally but failed in a clean checkout with `thinking -> idle` instead of the expected `thinking -> searching -> idle`.

### Correction Review

- The corrected test patches `Settings.from_env()` at the test boundary with `Settings.for_tests()`.
- It reuses the existing disposable in-memory SQLite fixture and real `MemoryManager` with local hash embeddings.
- It disposes the SQLite database in `finally`.
- The original assertions remain unchanged: HTTP `200`, then `thinking`, `searching`, and `idle` for the same user.
- No runtime or product behavior was modified.

### Independent Clean-Export Evidence

The exact candidate `51f93d12740a6e0860856257ea761377b04c97fb` was exported with `git archive` to a new disposable directory.

- `.env` in export: absent.
- `DATABASE_URL`: absent.
- `DATABASE_ADMIN_URL`: absent.
- Anthropic, Tavily, ElevenLabs, and Obsidian credentials: absent.
- Focused regression: `1 passed, 1 warning`.
- Complete Python suite: `45 passed, 1 warning`.
- Frontend suite: `36 passed, 0 failed`.
- Python syntax: `49` files passed AST parsing.
- JavaScript syntax: `30` files passed `node --check`.
- `git diff --check 20843a4..51f93d1`: passed.

No real PostgreSQL connection, migration, provider, credential, network service, or production environment was used. The corrected test used only disposable SQLite in memory.

## Test Summary

- Backend: `PASSED` — 45 Python tests passed in the clean controlled export.
- Frontend: `PASSED` — 36 Node tests passed.
- Realtime correction: `PASSED` — the isolated event-order regression passed without local environment configuration.
- Syntax: `PASSED` — 49 Python and 30 JavaScript files.
- Browser: `NOT RE-RUN` — no runtime/frontend delta; the prior complete Phase 6 browser evidence remains applicable.
- API/Memory/Security behavior: `UNCHANGED` — no runtime delta from the previously reviewed implementation.
- Database: `NOT ACCESSED` — only in-memory SQLite test state was used.

## Regressions Found

No regression was reproduced from the `QA-IC-001` correction.

## Closed Findings

### QA-IC-001 — CLOSED

- Severity: MEDIUM
- Blocking: NO
- Evidence: isolated and full Python runs passed from an exact clean export without `.env`, database URLs, or provider credentials.
- Impact: the realtime regression test is now deterministic and no longer depends on developer-local configuration.
- Recommendation: retain the explicit fixture and clean-export validation as regression coverage.

### QA-IC-002 — CLOSED

- Historical severity: MEDIUM
- Blocking: NO
- Source verified: public GitHub PR #1 via fresh API metadata.
- Evidence: the PR remains open and draft; base/head remain `main` <- `codex/phase-6-target-ui`; the body identifies exact Integration Candidate `51f93d12740a6e0860856257ea761377b04c97fb` and functional correction `4d76f2433363a47a9d8fe29fef337de1dc79ac50`; it records `QA-IC-001` closed/approved, Security `APPROVED_WITH_WARNINGS`, and `SEC-019`/`SEC-020` closed; it keeps merge blocked until this confirmation, Production Readiness `BLOCKED`, and Phase 7 not authorized.
- Superseded candidate check: `cf9cd976549163d1f49cead7bc2f993254150708` is absent from the current PR body and is no longer presented as the active candidate.
- Functional suites: not repeated, as explicitly required for this metadata-only closure. The Git candidate reviewed by QA remains `51f93d1`.

## Open Blockers

- None.

## Non-blocking Issues

### QA-WARN-HTTPX — Deprecated TestClient integration

- Severity: INFO
- Evidence: Python runs emitted the known `StarletteDeprecationWarning` for the current TestClient/httpx integration.
- Impact: no current test failure; future dependency maintenance may be required.
- Recommendation: track outside the Phase 6 correction gate.

### QA-ENV-003 — Production environments remain untested

- Severity: INFO
- Evidence: no real PostgreSQL/pgvector, migration, paid provider, physical device, or public deployment was used.
- Impact: the result validates the test-fixture correction, not Production Readiness.
- Recommendation: retain the existing Database, Security, provider, accessibility, and production gates.

## Recommendation

`APPROVED_WITH_WARNINGS`

QA approves Final Integration Candidate `f819440a72f2e68368bcc0d3c1af6ec700d170bf` with non-blocking warnings. `QA-IC-001` and `QA-IC-002` are closed. The PR may leave the QA gate, but merge remains subject to separate owner authorization and must not imply Production Readiness or authorize Phase 7.

## Parallel Live Retest — Obsidian Local REST API

- Result: `BLOCKED / NOT_TESTED`
- Execution commit: `4497347b6440c03c305cbb54eaccc643d95ced3c` (QA documentation descendant of candidate `51f93d12740a6e0860856257ea761377b04c97fb`; Obsidian implementation unchanged).
- Owner-reported state: Obsidian open and Local REST API active.
- Gate impact: `NONE`. This environmental check remains separate from the Phase 6 decision and from `QA-IC-001`/`QA-IC-002`.

### Sanitized Evidence

- Credential configuration: present.
- Endpoint configuration: present.
- TLS verification setting: enabled.
- Configured TCP listener: unreachable.
- Adapter health: `configured=true`, `available=false`.
- Obsidian process visible in the current OS session: no.
- Configured listener visible in the current OS session: no.
- Authentication: `NOT_TESTED` because no listener accepted a connection.
- Functional read/search: `NOT_TESTED`; the read-only sentinel query was deliberately skipped after failed health/connectivity.
- Proportional mocked service regression: `tests/test_services.py` — `5 passed`.

### Diagnosis and Safety

The owner-reported application/plugin state is not observable from the current QA execution session. The evidence is consistent with Obsidian running in another machine/session, the application having exited, or the active plugin listening under configuration different from the backend endpoint. This is an environmental reachability blocker, not a reproduced adapter defect.

No host, port, URL, token, vault name, private path, note name, note content, excerpt, or response body was logged or persisted. No note or Obsidian configuration was created, changed, moved, or deleted.

### Owner Action for Another Live Attempt

Keep Obsidian open in the same Windows session as the HOPE process and confirm locally that the existing Local REST API status indicates it is listening under the already configured endpoint. Do not share any secret or private vault information. QA can then repeat health, authentication, and one non-sensitive read-only sentinel search.
