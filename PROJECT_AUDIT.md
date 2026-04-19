# Project Audit: Generative AI Tutor & Adaptive Learning Platform

**Audit date:** 2026-04-19  
**Audit basis:** Re-reviewed current repository after your latest code updates.

## 1) Executive status
You have already built a solid MVP foundation by yourself (roughly the first **55–65%** of the internship scope): core backend, ingestion pipeline, vector search, chat UI, admin upload/library flows, and role-gated navigation.  
The remaining scope is still mostly in "hardening + advanced capabilities" (faithfulness controls, citations, memory, quizzes, strict SSE protocol, and KPI evaluation).

---

## 2) Requirement-by-requirement status (current code)

| Internship requirement | Current status | Notes |
|---|---|---|
| FastAPI backend project setup | ✅ Done | App wiring and routers are in place. |
| Document ingestion pipeline (upload → parse → chunk → embed → vector DB) | ✅ Done | End-to-end flow exists for PDF/DOCX/TXT with Chroma storage. |
| Subject-based organization | ✅ Done | Subject is captured at upload and used for retrieval filter. |
| Core RAG tutor endpoint | ✅ Done (baseline) | Query embedding + top-K retrieval + prompt + streamed answer is implemented. |
| Strict "context only" answering | ❌ Not done | Current prompt still allows general knowledge and out-of-scope answers. |
| Source citations returned with answers | ❌ Not done | Chat response stream is plain text; no citation payload contract. |
| Conversational memory (session-based) | ❌ Not done | No session id flow in `/chat`; persisted history model is unused by chat route. |
| Adaptive quiz generation endpoint (5 MCQs structured JSON) | ❌ Not done | No `/quiz` route/model in backend and no quiz UI flow in frontend. |
| SSE protocol streaming (`text/event-stream`) | ⚠️ Partial | Token streaming exists, but response is `text/plain` rather than SSE framing. |
| Admin visibility into learning struggles / analytics | ❌ Not done | No topic analytics dashboard or KPI pipeline yet. |
| Evaluation metrics (context relevance, faithfulness, latency target) | ❌ Not done | No explicit automated eval/instrumentation framework yet. |

---

## 3) What is implemented well already (your delivered base)

### Backend base
- FastAPI app with modular routers (`auth`, `upload`, `library`, `chat`).
- SQL models/migrations present for users, subjects, docs, and chat history.
- ChromaDB persistence and metadata storage integrated.

### RAG baseline
- Upload route stores files and triggers extraction/chunking/embedding/indexing.
- Chat route performs embedding + retrieval + prompt construction + streamed generation.
- Subject filtering is wired into retrieval.

### Frontend base
- Login flow with role-based navigation (student/admin).
- Admin upload center and document library pages exist.
- Student chat page supports incremental streamed rendering.

This is a strong platform base for your teammates to extend.

---

## 4) Issues still visible in current code review

1. **Grounding policy conflict**
   - Prompt text still explicitly permits general-knowledge completion and unrelated answers.
   - This conflicts with the project objective to avoid answers outside provided syllabus context.

2. **Citation contract missing**
   - Retrieved chunks are not returned with source references in API response format.
   - Frontend chat UI has no citation rendering path.

3. **Memory not wired**
   - `ChatHistory` exists at model level but is not connected to chat request/response flow.

4. **SSE mismatch**
   - Current streaming works functionally but is not exposed as proper SSE events.

5. **Delete flow bug likely still present**
   - Library UI still sends `filename` to delete endpoint, while API route expects `document_id` path value.

6. **Config/documentation mismatch**
   - README environment examples and backend default DB assumptions are still not fully aligned.

---

## 5) Team split for remaining work (4 teammates)

### Teammate A — Faithfulness + Citation Compliance
- Enforce strict context-only response policy and refusal fallback.
- Add retrieval-score gating and safe no-answer behavior.
- Return citation metadata per answer and add UI citation display.

### Teammate B — Conversation Memory
- Add `session_id` to chat contract.
- Persist and retrieve turn history from DB.
- Inject short, relevant prior context into prompts.

### Teammate C — Adaptive Quiz System
- Create `/quiz` endpoint with strict structured JSON schema (5 MCQs).
- Ground quiz generation in retrieved context only.
- Add quiz UI workflow (generate, answer, score, review).

### Teammate D — Streaming + Observability + Integration Fixes
- Upgrade streaming to proper SSE (`text/event-stream`, event framing).
- Add latency and retrieval quality instrumentation (target p95 < 2s where feasible).
- Fix integration bugs (document delete ID mismatch, config/readme consistency).

---

## 6) Recommended next milestone plan

1. **Milestone 1 (highest risk):** Grounding + citations + delete bug fix.  
2. **Milestone 2:** Session memory and follow-up consistency tests.  
3. **Milestone 3:** Quiz endpoint + quiz frontend.  
4. **Milestone 4:** SSE protocol upgrade + KPI dashboard/eval harness.

---

## 7) Completion statement
- **Completed by you individually:** foundational MVP and platform architecture (~55–65%).
- **Remaining for team completion:** advanced reliability, pedagogy features, and measurable evaluation layers needed to fully satisfy the internship brief.
