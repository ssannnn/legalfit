# Domain Docs

This repo uses a single-context domain layout.

## Layout

- Root domain context: `CONTEXT.md`
- Architectural decisions: `docs/adr/`
- Product requirements and decision logs: `docs/prd/`

## Consumer Rules

- Read `CONTEXT.md` first when a task depends on domain language or product behavior.
- Read relevant PRDs in `docs/prd/` before splitting work into issues or implementing product features.
- Read relevant ADRs in `docs/adr/` before changing architecture, data model, infrastructure or cross-cutting behavior.
- If `CONTEXT.md` is missing, derive domain context from `PROJECT.md` and the PRDs, then propose creating or updating `CONTEXT.md`.

## Current Product Context

The current focused MVP is documented in `docs/prd/legalfit-mvp-anden-zonas-francas.md`.

The original product vision is documented in `PROJECT.md`.
